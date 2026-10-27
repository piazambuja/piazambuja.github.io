// Minimal Markdown renderer for SKILL.md / README.md files.
// Supports: headings, paragraphs, fenced code, tables, nested lists,
// blockquotes, hr, inline code, bold, italic and links. No dependencies.

export const escapeHtml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function inline(text) {
  const codes = [];
  let s = text.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(`<code>${escapeHtml(c)}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = escapeHtml(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, href) => `<a href="${href}">${t}</a>`);
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[+i]);
}

const isTableSep = (l) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(l);
const cells = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

function renderList(lines) {
  // lines: [{indent, ordered, text}]
  let html = "";
  const stack = [];
  for (const item of lines) {
    while (stack.length && item.indent < stack[stack.length - 1].indent) {
      html += `</li></${stack.pop().tag}>`;
    }
    const top = stack[stack.length - 1];
    if (!top || item.indent > top.indent) {
      const tag = item.ordered ? "ol" : "ul";
      stack.push({ indent: item.indent, tag });
      html += `<${tag}><li>${inline(item.text)}`;
    } else {
      html += `</li><li>${inline(item.text)}`;
    }
  }
  while (stack.length) html += `</li></${stack.pop().tag}>`;
  return html;
}

export function markdown(src, { headingOffset = 0, idPrefix = "" } = {}) {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  const slug = (t) =>
    idPrefix + t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    const fence = line.match(/^\s*```(\w*)/);
    if (fence) {
      const indent = line.match(/^\s*/)[0].length;
      const buf = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) buf.push(lines[i].slice(indent)), i++;
      i++;
      const lang = fence[1] ? ` data-lang="${fence[1]}"` : "";
      out.push(`<pre${lang}><code>${escapeHtml(buf.join("\n"))}</code></pre>`);
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = Math.min(6, h[1].length + headingOffset);
      out.push(`<h${level} id="${slug(h[2])}">${inline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { out.push("<hr>"); i++; continue; }

    if (line.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) rows.push(cells(lines[i])), i++;
      out.push(
        `<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>` +
          rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("") +
          `</tbody></table></div>`
      );
      continue;
    }

    if (/^\s*>/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i].replace(/^\s*>\s?/, "")), i++;
      out.push(`<blockquote>${markdown(buf.join("\n"))}</blockquote>`);
      continue;
    }

    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
        if (m) {
          items.push({ indent: m[1].length, ordered: /\d/.test(m[2]), text: m[3] });
          i++;
        } else if (lines[i].trim() && /^\s{2,}\S/.test(lines[i]) && !/^\s*```/.test(lines[i])) {
          items[items.length - 1].text += " " + lines[i].trim();
          i++;
        } else break;
      }
      out.push(renderList(items));
      continue;
    }

    const buf = [];
    while (
      i < lines.length && lines[i].trim() &&
      !/^(#{1,6}\s|\s*```|\s*>|\s*([-*]|\d+\.)\s+)/.test(lines[i]) &&
      !(lines[i].includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1]))
    ) buf.push(lines[i].trim()), i++;
    out.push(`<p>${inline(buf.join(" "))}</p>`);
  }
  return out.join("\n");
}

export function frontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, body: src };
  const data = {};
  for (const l of m[1].split("\n")) {
    const kv = l.match(/^([\w-]+):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
  }
  return { data, body: src.slice(m[0].length) };
}
