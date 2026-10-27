// Static site generator for the personal page + plugin marketplace.
// Usage: node build.mjs   →  writes ./dist
// No dependencies. Reads content/profile.json, .claude-plugin/marketplace.json
// and every plugin under ./plugins.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { markdown, frontmatter, escapeHtml as e } from "./lib/markdown.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, "dist");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));

// ---------- config ----------
// GITHUB_REPOSITORY is set by GitHub Actions ("owner/repo").
const repoFull = process.env.GITHUB_REPOSITORY || process.env.SITE_REPOSITORY || "seu-usuario/seu-usuario.github.io";
const [owner, repo] = repoFull.split("/");
const isUserSite = repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;
const BASE = process.env.SITE_BASE ?? (isUserSite ? "/" : `/${repo}/`);
const SITE_URL = `https://${owner.toLowerCase()}.github.io${BASE}`;
const REPO_URL = `https://github.com/${repoFull}`;
const url = (p = "") => BASE + p.replace(/^\//, "");

const profile = JSON.parse(read("content/profile.json"));
if (!profile.links.github) profile.links.github = `https://github.com/${owner}`;
const market = JSON.parse(read(".claude-plugin/marketplace.json"));

// ---------- load plugins ----------
const plugins = market.plugins.map((entry) => {
  const dir = entry.source.replace(/^\.\//, "");
  const manifest = JSON.parse(read(`${dir}/.claude-plugin/plugin.json`));
  const skillsDir = path.join(ROOT, dir, "skills");
  const skills = fs.existsSync(skillsDir)
    ? fs.readdirSync(skillsDir).filter((s) => fs.existsSync(path.join(skillsDir, s, "SKILL.md"))).sort().map((s) => {
        const { data, body } = frontmatter(fs.readFileSync(path.join(skillsDir, s, "SKILL.md"), "utf8"));
        return { slug: s, name: data.name || s, description: data.description || "", body };
      })
    : [];
  const hooks = exists(`${dir}/hooks/hooks.json`) ? JSON.parse(read(`${dir}/hooks/hooks.json`)) : null;
  const hookEvents = hooks ? Object.keys(hooks.hooks || {}) : [];
  const readme = exists(`${dir}/README.md`) ? read(`${dir}/README.md`).replace(/^#\s+.*\n/, "") : "";
  return {
    ...entry,
    ...manifest,
    displayName: entry.displayName || manifest.displayName || manifest.name,
    description: manifest.description || entry.description,
    dir, skills, hookEvents, readme,
  };
});

const components = (p) => {
  const parts = [];
  if (p.skills.length) parts.push(`${p.skills.length} ${p.skills.length === 1 ? "skill" : "skills"}`);
  if (p.hookEvents.length) parts.push(`hook ${p.hookEvents.join(", ")}`);
  return parts.join(" e ");
};

// ---------- hero chart (SVG built at compile time) ----------
function careerChart() {
  const W = 1120, H = 330, padL = 8, padR = 8, bottom = 40;
  const rowH = 22, top = 16 + profile.timeline.length * rowH + 12;
  const start = 2012, end = 2027;
  const x = (dec) => padL + ((dec - start) / (end - start)) * (W - padL - padR);
  const dec = (d) => { const [y, m] = d.split("-").map(Number); return y + (m - 1) / 12; };
  const yBase = H - bottom;
  const plotH = yBase - top;

  // Step series: scope grows at each annotation; small deterministic jitter so it reads as a signal.
  const steps = [
    { at: 2012, v: 0.12 },
    { at: 2014.5, v: 0.3 },
    ...profile.timeline.slice(1).map((t, i) => ({ at: dec(t.date), v: 0.48 + i * 0.16 })),
  ];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5);
  const pts = [];
  for (let t = start; t <= 2026.85; t += 1 / 12) {
    const level = steps.filter((s) => s.at <= t).pop()?.v ?? 0.1;
    const v = Math.max(0.04, Math.min(0.97, level + rnd() * 0.018));
    pts.push([x(t), yBase - v * plotH]);
  }
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("");
  const area = `${d}L${pts.at(-1)[0].toFixed(1)} ${yBase}L${pts[0][0].toFixed(1)} ${yBase}Z`;

  const years = [];
  for (let y = start; y <= end; y++) {
    years.push(`<line class="grid" x1="${x(y)}" x2="${x(y)}" y1="${top - 8}" y2="${yBase}"/>`);
    years.push(`<line class="axis" x1="${x(y)}" x2="${x(y)}" y1="${yBase}" y2="${yBase + 6}"/>`);
    if (y < end && (y % 2 === 0 || y >= 2020)) years.push(`<text class="tick" x="${x(y)}" y="${H - 12}" text-anchor="${y === start ? "start" : "middle"}">${y}</text>`);
  }
  const gridY = `<line class="axis" x1="${padL}" x2="${W - padR}" y1="${yBase}" y2="${yBase}"/>` + [0.25, 0.5, 0.75].map((f) => `<line class="grid" x1="${padL}" x2="${W - padR}" y1="${yBase - f * plotH}" y2="${yBase - f * plotH}"/>`).join("");

  const band = `<rect class="band" x="${x(2014.5)}" y="${top - 8}" width="${x(2021.67) - x(2014.5)}" height="${plotH + 8}"/>
    <text class="band-label" x="${x(2014.5) + 10}" y="${yBase - 12}">TI antes do PagBank</text>`;

  // Later changes sit on higher rows, so a label never crosses an earlier change's line.
  const n = profile.timeline.length;
  const notes = profile.timeline.map((t, i) => {
    const xx = x(dec(t.date));
    const anchorEnd = xx > W - 220;
    const lx = anchorEnd ? xx - 12 : xx + 12;
    const row = 20 + (n - 1 - i) * rowH;
    return `<g class="note" style="--i:${i}">
      <line class="note-line" x1="${xx}" x2="${xx}" y1="${row + 2}" y2="${yBase}"/>
      <path class="note-mark" d="M${xx} ${row - 10}l5 5l-5 5l-5-5Z"/>
      <text class="note-label" x="${lx}" y="${row}" text-anchor="${anchorEnd ? "end" : "start"}"><tspan class="note-year">${t.date.slice(0, 4)}</tspan><tspan class="note-detail" dx="6">${e(t.detail)}</tspan></text>
    </g>`;
  }).join("");
  const [ex, ey] = pts.at(-1);
  const now = `<g class="now"><circle class="now-halo" cx="${ex}" cy="${ey}" r="9"/><circle class="now-dot" cx="${ex}" cy="${ey}" r="4"/>
    <text class="now-label" x="${ex - 4}" y="${ey + 24}" text-anchor="end">agora</text></g>`;

  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="chart-title chart-desc">
    <title id="chart-title">Linha do tempo da carreira</title>
    <desc id="chart-desc">${profile.timeline.map((t) => `${t.date.slice(0, 4)}: ${t.detail}`).join("; ")}.</desc>
    ${gridY}${years.join("")}${band}
    <path class="area" d="${area}"/>
    <path class="line" d="${d}" pathLength="1"/>
    ${notes}${now}
  </svg>`;
}

// ---------- layout ----------
const icons = {
  copy: `<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/></svg>`,
};

const cmd = (text, label = "Copiar comando") =>
  `<div class="cmd"><code><span class="prompt" aria-hidden="true">$ </span>${e(text)}</code><button type="button" class="copy" data-copy="${e(text)}" aria-label="${label}">${icons.copy}<span>Copiar</span></button></div>`;

// Wrap everything after each section's <h2> in .block-body (two-column layout on desktop).
const twoCol = (html) =>
  html.replace(/(<section class="block[^"]*"[^>]*>\s*<h2[^>]*>[\s\S]*?<\/h2>)([\s\S]*?)(<\/section>)/g, '$1<div class="block-body">$2</div>$3');

function page({ title, description, body, current, pathname = "" }) {
  body = twoCol(body);
  const nav = [
    ["", "Sobre", "home"],
    ["marketplace/", "Marketplace", "marketplace"],
  ];
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title>
<meta name="description" content="${e(description)}">
<link rel="canonical" href="${SITE_URL}${pathname}">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(description)}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#E8EDF0" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#16232D" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${url("favicon.svg")}" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Schibsted+Grotesk:ital,wght@0,400;0,500;0,700;0,800;1,400&display=swap">
<link rel="stylesheet" href="${url("style.css")}">
</head>
<body class="${current}">
<a class="skip" href="#main">Pular para o conteúdo</a>
<header class="site-header">
  <div class="site-header-inner">
  <a class="wordmark" href="${url()}"><span class="status" aria-hidden="true"></span><span class="wordmark-name">${e(profile.name)}</span><span class="wordmark-loc">${e(profile.location)} · UTC−3</span></a>
  <nav aria-label="Principal">
    ${nav.map(([href, label, key]) => `<a href="${url(href)}"${key === current ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
    <a href="${REPO_URL}">GitHub</a>
  </nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <p>${e(profile.name)}, ${e(profile.location)}. Plugins sob licença MIT.</p>
  <p><a href="${REPO_URL}">Código do site e dos plugins</a></p>
</footer>
<script src="${url("site.js")}" defer></script>
</body>
</html>`;
}

// ---------- pages ----------
const addCmd = `/plugin marketplace add ${repoFull}`;
const totalSkills = plugins.reduce((n, p) => n + p.skills.length, 0);

// Agents the open skills CLI (npx skills) installs into; Claude Code also gets the plugin marketplace.
const TOOLS = [
  { id: "claude-code", label: "Claude Code" },
  { id: "codex", label: "Codex" },
  { id: "gemini-cli", label: "Gemini CLI" },
  { id: "github-copilot", label: "Copilot" },
  { id: "cursor", label: "Cursor" },
  { id: "kiro-cli", label: "Kiro" },
];

// Tabbed install box. `forTool(tool)` returns { cmds: [...], hint } for each tool.
// Without JS the first tab (Claude Code) shows; site.js switches tabs and keeps the choice.
let installerCount = 0;
function installer(forTool) {
  const n = ++installerCount;
  const tabs = TOOLS.map((t, i) => `<button type="button" role="tab" id="inst${n}-${t.id}" aria-controls="inst${n}-${t.id}-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-tool="${t.id}">${t.label}</button>`).join("");
  const panels = TOOLS.map((t, i) => {
    const { cmds = [], hint = "" } = forTool(t);
    return `<div class="installer-panel" role="tabpanel" id="inst${n}-${t.id}-panel" aria-labelledby="inst${n}-${t.id}" data-tool="${t.id}"${i === 0 ? "" : " hidden"}>
      ${cmds.map((c) => cmd(c)).join("")}
      ${hint ? `<p class="installer-hint">${hint}</p>` : ""}
    </div>`;
  }).join("");
  return `<div class="installer"><div class="installer-tabs" role="tablist" aria-label="Sua ferramenta">${tabs}</div>${panels}</div>`;
}

const skillsCmd = (t, extra = "") => `npx skills add ${repoFull}${extra} -a ${t.id}`;
const c = (text) => `<code>${e(text)}</code>`;

const catalogInstaller = () => installer((t) => t.id === "claude-code"
  ? { cmds: [addCmd], hint: `Depois instale um plugin com ${c(`/plugin install <nome>@${market.name}`)}, ou escolha na lista com ${c("/plugin")}. Para receber novidades, rode ${c(`/plugin marketplace update ${market.name}`)}.` }
  : { cmds: [skillsCmd(t)], hint: `Instala as ${totalSkills} skills no projeto. Acrescente ${c("--skill <nome>")} para uma só, ou ${c("-g")} para todos os projetos. Hooks, como o prod-guardrails, só existem no Claude Code.` });

function pluginRows(list) {
  return `<div class="plugin-head" aria-hidden="true"><span>Plugin</span><span>O que faz</span><span>Conteúdo</span></div>
  <ul class="plugin-list">${list.map((p) => `
    <li>
      <a class="plugin-row" href="${url(`marketplace/${p.name}/`)}">
        <span class="plugin-name">${e(p.displayName)}</span>
        <span class="plugin-desc">${e(p.description)}</span>
        <span class="plugin-meta"><span class="chip">${e(components(p))}</span></span>
      </a>
    </li>`).join("")}
  </ul>`;
}

function home() {
  const L = profile.links;
  const contact = [
    L.linkedin && `<li><a href="${e(L.linkedin)}"><span>LinkedIn</span><span class="contact-kind">Mensagem direta →</span></a></li>`,
    L.email && `<li><a href="mailto:${e(L.email)}"><span>${e(L.email)}</span><span class="contact-kind">E-mail →</span></a></li>`,
    L.github && `<li><a href="${e(L.github)}"><span>${e(L.github.replace(/^https:\/\//, ""))}</span><span class="contact-kind">Código →</span></a></li>`,
  ].filter(Boolean).join("");

  const body = `
<section class="hero">
  <div class="hero-text">
    <p class="role">${e(profile.role)}</p>
    <h1>${e(profile.name)}</h1>
  </div>
  <div class="hero-row">
    <div class="hero-main">
      <p class="lead">${e(profile.lead)}</p>
      <p class="actions">
        ${L.linkedin ? `<a class="btn btn-primary" href="${e(L.linkedin)}">Falar comigo no LinkedIn</a>` : `<a class="btn btn-primary" href="mailto:${e(L.email)}">Falar comigo por e-mail</a>`}
        <a class="btn" href="${url("marketplace/")}">Ver os plugins</a>
      </p>
    </div>
    <dl class="facts-list">
      <div><dt>Foco</dt><dd>SRE e plataforma de IA</dd></div>
      <div><dt>Stack</dt><dd>AWS, EKS, Prometheus, Grafana, OpenTelemetry, Bedrock</dd></div>
      <div><dt>Hoje</dt><dd>${e(profile.experience[0].org)}</dd></div>
    </dl>
  </div>
  <figure class="panel">
    <figcaption class="panel-head">
      <span class="panel-legend"><strong class="panel-title">Carreira</strong><span><i class="sw sw-line"></i>Escopo de atuação</span><span><i class="sw sw-note"></i>Mudança</span></span>
      <span class="panel-range">mar/2012 a out/2026</span>
    </figcaption>
    <div class="chart-scroll">${careerChart()}</div>
  </figure>
</section>

<section class="block" id="sobre" aria-labelledby="h-sobre">
  <h2 id="h-sobre">Sobre</h2>
  <div class="prose">${profile.about.map((p) => `<p>${e(p)}</p>`).join("")}</div>
</section>

<section class="block" aria-labelledby="h-areas">
  <h2 id="h-areas">No que eu trabalho</h2>
  <dl class="areas">
    ${profile.areas.map((a) => `<div><dt>${e(a.title)}</dt><dd>${e(a.text)}</dd></div>`).join("")}
  </dl>
</section>

<section class="block" id="experiencia" aria-labelledby="h-exp">
  <h2 id="h-exp">Experiência</h2>
  <ol class="timeline">
    ${profile.experience.map((x) => `
    <li>
      <p class="when"><span class="mark" aria-hidden="true"></span>${e(x.start)} a ${e(x.end)}</p>
      <div>
        <h3>${e(x.title)}, ${e(x.org)}</h3>
        <p>${e(x.text)}</p>
      </div>
    </li>`).join("")}
  </ol>
  <h3 class="sub">Formação</h3>
  <ul class="edu">
    ${profile.education.map((x) => `<li><span class="when">${e(x.period)}</span><span>${e(x.title)}, ${e(x.org)}</span></li>`).join("")}
  </ul>
</section>

<section class="block market-teaser" aria-labelledby="h-market">
  <h2 id="h-market">Skills e plugins</h2>
  <div class="prose">
    <p>O que uso no dia a dia de SRE, empacotado para agentes de código: triagem de Kubernetes, SLOs, resposta a incidentes, custos na AWS e plataforma de IA. As skills funcionam no Claude Code, Codex, Gemini CLI, Copilot, Cursor e Kiro.</p>
  </div>
  ${catalogInstaller()}
  ${pluginRows(plugins)}
  <p class="more"><a href="${url("marketplace/")}">Ver como instalar e o conteúdo de cada plugin</a></p>
</section>

<section class="block" id="contato" aria-labelledby="h-contato">
  <h2 id="h-contato">Contato</h2>
  <ul class="contact">${contact}</ul>
</section>`;
  return page({ title: `${profile.name}, ${profile.role}`, description: profile.lead, body, current: "home" });
}

function marketplaceIndex() {
  const body = `
<section class="page-head">
  <p class="crumb"><a href="${url()}">${e(profile.name)}</a></p>
  <h1>Skills e plugins para agentes de código</h1>
  <div class="hero-row">
    <p class="lead">${totalSkills} skills e ${plugins.length} plugins de SRE e plataforma, mantidos neste repositório. O agente usa cada skill sozinho quando o assunto aparece. As skills funcionam no Claude Code, Codex, Gemini CLI, Copilot, Cursor e Kiro.</p>
    <dl class="stats">
      <div><dt>Plugins</dt><dd>${plugins.length}</dd></div>
      <div><dt>Skills</dt><dd>${totalSkills}</dd></div>
      <div><dt>Hooks</dt><dd>${plugins.filter((p) => p.hookEvents.length).length}</dd></div>
    </dl>
  </div>
</section>

<section class="block install" aria-labelledby="h-install">
  <h2 id="h-install">Instalar</h2>
  ${catalogInstaller()}
</section>

<section class="block" aria-labelledby="h-plugins">
  <h2 id="h-plugins">Plugins</h2>
  ${pluginRows(plugins)}
</section>`;
  return page({ title: `Skills e plugins, ${profile.name}`, description: market.description, body, current: "marketplace", pathname: "marketplace/" });
}

function pluginPage(p) {
  const skills = p.skills.map((s) => `
    <details class="skill" id="skill-${s.slug}">
      <summary>
        <span class="skill-name">${e(s.name)}</span>
        <span class="skill-desc">${e(s.description)}</span>
      </summary>
      <div class="md">${markdown(s.body, { headingOffset: 2, idPrefix: `${s.slug}-` })}</div>
    </details>`).join("");

  const body = `
<section class="page-head">
  <p class="crumb"><a href="${url("marketplace/")}">Marketplace</a></p>
  <h1>${e(p.displayName)}</h1>
  <p class="lead">${e(p.description)}</p>
  <p class="facts"><span>${e(components(p))}</span><span>${e(p.license || "MIT")}</span><a href="${REPO_URL}/tree/main/${p.dir}">Código-fonte</a></p>
</section>

<section class="block" aria-labelledby="h-inst">
  <h2 id="h-inst">Instalar</h2>
  ${installer((t) => {
    if (t.id === "claude-code") return { cmds: [`/plugin install ${p.name}@${market.name}`], hint: `Ainda não adicionou o marketplace? Rode antes ${c(addCmd)}.` };
    if (!p.skills.length) return { hint: `Este plugin é um hook do Claude Code e não tem versão para o ${t.label}.` };
    return { cmds: [skillsCmd(t, ` --skill ${p.skills.map((s) => s.slug).join(" ")}`)], hint: `Instala ${p.skills.length === 1 ? "a skill" : `as ${p.skills.length} skills`} deste plugin no projeto. Acrescente ${c("-g")} para todos os projetos.` };
  })}
</section>

${p.readme ? `<section class="block" aria-labelledby="h-readme"><h2 id="h-readme">Como funciona</h2><div class="md">${markdown(p.readme, { headingOffset: 1 })}</div></section>` : ""}

${p.skills.length ? `<section class="block" aria-labelledby="h-skills">
  <h2 id="h-skills">Skills</h2>
  <p class="note-text">O agente carrega uma skill quando o pedido combina com a descrição dela. No Claude Code, você também pode chamar direto com <code>/${e(p.name)}:&lt;skill&gt;</code>. Abra cada uma para ler as instruções completas.</p>
  ${skills}
</section>` : ""}`;
  return page({ title: `${p.displayName}, ${profile.name}`, description: p.description, body, current: "marketplace", pathname: `marketplace/${p.name}/` });
}

// ---------- write ----------
fs.rmSync(OUT, { recursive: true, force: true });
const write = (rel, content) => {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
};
write("index.html", home());
write("marketplace/index.html", marketplaceIndex());
for (const p of plugins) write(`marketplace/${p.name}/index.html`, pluginPage(p));
for (const f of fs.readdirSync(path.join(ROOT, "static"))) fs.copyFileSync(path.join(ROOT, "static", f), path.join(OUT, f));
write(".nojekyll", "");
write("404.html", page({ title: "Página não encontrada", description: "", current: "", body: `<section class="page-head"><h1>Página não encontrada</h1><p class="lead">Esse endereço não existe mais ou foi digitado errado. <a href="${url()}">Voltar para o início</a>.</p></section>` }));

console.log(`Built ${2 + plugins.length} pages for ${repoFull} at base ${BASE}`);
