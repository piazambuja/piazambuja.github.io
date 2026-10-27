// Builds the site from content/profile.json into dist/. Node 18+, no dependencies.
// Usage: node build.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, "dist");
const profile = JSON.parse(fs.readFileSync(path.join(ROOT, "content/profile.json"), "utf8"));

// <account>.github.io serves at "/"; any other repo name serves at "/<repo>/".
const [owner = "", repo = ""] = (process.env.GITHUB_REPOSITORY || "").split("/");
const BASE = !repo || repo.toLowerCase() === `${owner.toLowerCase()}.github.io` ? "/" : `/${repo}/`;
if (owner && !profile.links.github) profile.links.github = `https://github.com/${owner}`;

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const linkLabels = { github: "GitHub", linkedin: "LinkedIn", email: "Email" };
const links = Object.entries(profile.links || {})
  .filter(([, href]) => href)
  .map(([key, href]) => {
    const url = key === "email" && !href.startsWith("mailto:") ? `mailto:${href}` : href;
    return `<li><a href="${esc(url)}">${esc(linkLabels[key] || key)}</a></li>`;
  })
  .join("");

const section = (id, title, inner) =>
  inner ? `<section class="block" aria-labelledby="h-${id}"><h2 id="h-${id}">${esc(title)}</h2><div>${inner}</div></section>` : "";

const about = (profile.about || []).map((p) => `<p>${esc(p)}</p>`).join("");
const experience = (profile.experience || []).map((e) => `
  <li class="row">
    <span class="when">${esc(e.start)}${e.end ? ` – ${esc(e.end)}` : ""}</span>
    <div><h3>${esc(e.title)}${e.org ? `, ${esc(e.org)}` : ""}</h3><p>${esc(e.text)}</p></div>
  </li>`).join("");
const projects = (profile.projects || []).map((p) => `
  <li class="row">
    <h3>${p.url ? `<a href="${esc(p.url)}">${esc(p.title)}</a>` : esc(p.title)}</h3>
    <p>${esc(p.text)}</p>
  </li>`).join("");

const html = `<!doctype html>
<html lang="${esc(profile.lang || "en")}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(profile.name)}, ${esc(profile.role)}</title>
<meta name="description" content="${esc(profile.lead)}">
<meta property="og:title" content="${esc(profile.name)}">
<meta property="og:description" content="${esc(profile.lead)}">
<link rel="stylesheet" href="${BASE}style.css">
</head>
<body>
<main>
  <header class="hero">
    <h1>${esc(profile.name)}</h1>
    <p class="role">${esc(profile.role)}${profile.location ? ` · ${esc(profile.location)}` : ""}</p>
    <p class="lead">${esc(profile.lead)}</p>
    ${links ? `<ul class="links">${links}</ul>` : ""}
  </header>
  ${section("about", profile.labels?.about || "About", about)}
  ${section("experience", profile.labels?.experience || "Experience", experience && `<ul class="rows">${experience}</ul>`)}
  ${section("projects", profile.labels?.projects || "Projects", projects && `<ul class="rows">${projects}</ul>`)}
</main>
<footer><p>© ${new Date().getFullYear()} ${esc(profile.name)}</p></footer>
</body>
</html>
`;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "index.html"), html);
fs.copyFileSync(path.join(ROOT, "static/style.css"), path.join(OUT, "style.css"));
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");
console.log(`Built dist/ for base ${BASE}`);
