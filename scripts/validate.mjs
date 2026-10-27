// Checks the marketplace before it ships: manifests, names, sources, skill frontmatter, hooks JSON.
// Usage: node scripts/validate.mjs   (exits 1 on any error)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { frontmatter } from "../lib/markdown.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const readJson = (p) => {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8")); }
  catch (err) { errors.push(`${p}: ${err.message}`); return null; }
};

const market = readJson(".claude-plugin/marketplace.json");
if (market) {
  if (!kebab.test(market.name || "")) errors.push(`marketplace name "${market.name}" must be kebab-case`);
  if (!market.owner?.name) errors.push("marketplace owner.name is required");
  const seen = new Set();
  for (const [i, p] of (market.plugins || []).entries()) {
    const where = `plugins[${i}] (${p.name})`;
    if (!kebab.test(p.name || "")) errors.push(`${where}: name must be kebab-case`);
    if (seen.has(p.name)) errors.push(`${where}: duplicate name`);
    seen.add(p.name);
    if (typeof p.source !== "string" || !p.source.startsWith("./") || p.source.includes("..")) {
      errors.push(`${where}: source must be a "./" path inside the repo`);
      continue;
    }
    const dir = p.source.slice(2);
    const manifest = readJson(`${dir}/.claude-plugin/plugin.json`);
    if (manifest && manifest.name !== p.name) errors.push(`${where}: plugin.json name "${manifest.name}" differs`);
    if (manifest && !manifest.description) errors.push(`${where}: plugin.json needs a description`);

    const skillsDir = path.join(ROOT, dir, "skills");
    if (fs.existsSync(skillsDir)) {
      for (const s of fs.readdirSync(skillsDir)) {
        const file = path.join(skillsDir, s, "SKILL.md");
        if (!fs.existsSync(file)) { errors.push(`${dir}/skills/${s}: missing SKILL.md`); continue; }
        const { data } = frontmatter(fs.readFileSync(file, "utf8"));
        if (!data.description) errors.push(`${dir}/skills/${s}/SKILL.md: frontmatter needs a description`);
        if (data.name && data.name !== s) errors.push(`${dir}/skills/${s}/SKILL.md: name "${data.name}" should match folder`);
      }
    }
    if (fs.existsSync(path.join(ROOT, dir, "hooks/hooks.json"))) readJson(`${dir}/hooks/hooks.json`);
  }
}

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`✓ marketplace "${market.name}" with ${market.plugins.length} plugins is valid`);
