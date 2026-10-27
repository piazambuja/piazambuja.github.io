# Personal site (<account>.github.io)

Personal site of [Name], published on GitHub Pages at https://<account>.github.io/. These instructions apply to any coding agent; `CLAUDE.md` may be a symlink to this file. Always edit `AGENTS.md`.

## How it works

- `node build.mjs` builds the site into `dist/`. No npm dependencies, on purpose: it builds anywhere, including CI, without installing anything.
- Preview: `node build.mjs && python3 -m http.server 4321 -d dist`, then open http://localhost:4321.
- All text lives in `content/profile.json`. Look and feel lives in `static/style.css`.
- Deploy: `.github/workflows/deploy.yml` builds and publishes on every push to `main`. The repo name must stay exactly `<account>.github.io`, or the site moves off the root URL.

## Rules

- Never invent facts about [Name]: employers, dates, titles, metrics, projects. Ask, or leave a visible `[placeholder]`.
- Don't publish personal data (phone, address, personal email) unless [Name] asked for it.
- Design tokens are CSS variables on `:root`, with a dark version under `prefers-color-scheme: dark`. Change tokens, not one-off colors.
- Minimum bar: no horizontal scroll at 390px, visible keyboard focus, WCAG AA contrast in both themes.
- Before calling a visual change done, build and take screenshots at 1280px and 390px, in light and dark mode.
