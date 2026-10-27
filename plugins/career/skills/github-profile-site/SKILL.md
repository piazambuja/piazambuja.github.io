---
name: github-profile-site
description: Create and publish a personal profile or portfolio site on GitHub Pages at <account>.github.io using the gh CLI - repo creation, content from a JSON file, Pages via GitHub Actions, deploy and checks. Use when the user wants a personal site, portfolio, online CV or a username.github.io page.
---

# Personal site on GitHub Pages

Goal: a fast, accessible personal site at `https://<account>.github.io/`, built from one content file the user can edit, published by GitHub Actions on every push to `main`. No framework and no npm dependencies, so it builds anywhere.

Works for anyone, in any field. Write the site in the user's language.

## Hard rules

- **The repository must be named exactly `<account>.github.io`**, where `<account>` is the GitHub username (or organization) that owns it, in lowercase. Only that name publishes at the root (`https://<account>.github.io/`). Any other name publishes under a subpath (`https://<account>.github.io/<repo>/`), and a typo or a different owner means the root URL stays a 404. Each account has one such site.
- **Never invent content.** No made-up employers, dates, titles, metrics, projects or links. Missing facts become a visible placeholder like `[year you started]` and a question to the user.
- **Personal data is public once pushed**, including in git history. Ask before publishing a phone number, home address, personal email or birth date; prefer city/region, a contact link and LinkedIn. Never commit secrets or `.env` files.
- Run commands that create or change things on GitHub (create repo, enable Pages, push) only after showing the user what they will do, the first time. Everything else can go ahead.

## Prerequisites

The GitHub CLI, installed and logged in. Check first and fix what fails:

```bash
gh --version                        # install: https://cli.github.com
gh auth status                      # logged in? which account? which scopes?
gh auth login -h github.com -p https -w          # if not logged in (browser flow)
gh auth refresh -h github.com -s workflow        # pushing .github/workflows/* needs the workflow scope
gh api user --jq .login             # the account name: the repo is <this>.github.io
git --version
node --version                      # 18+; only needed to run the build locally
```

If the site belongs to an organization, `<account>` is the organization name and the user needs permission to create repos in it (`gh repo create <org>/<org>.github.io`).

## Step 1: check the starting point

```bash
ACCOUNT=$(gh api user --jq .login | tr '[:upper:]' '[:lower:]')
REPO="$ACCOUNT.github.io"
gh repo view "$ACCOUNT/$REPO" --json name,visibility,url 2>/dev/null || echo "repo does not exist yet"
gh api "repos/$ACCOUNT/$REPO/pages" 2>/dev/null || echo "Pages not enabled"
```

- Repo exists with a site in it: ask whether to replace it, keep it, or migrate its content. Never overwrite without a yes.
- Repo exists under a different name (e.g. `portfolio`, `MyName.github.io` under another account): offer to rename it (`gh repo rename <account>.github.io -R <owner>/<old>`) instead of creating a second one.
- On a free plan the repo must be **public** for Pages to work.

## Step 2: gather content (ask only what's missing, in one message)

1. Name, role or headline, city/region (optional), and the site language.
2. Two or three sentences on what they do and for whom, then a longer "about" if they want one.
3. Experience or projects: title, organization, period, one or two lines each. A CV, LinkedIn export or existing page is the fastest source.
4. Links: GitHub (filled in automatically), LinkedIn, email or contact form, other profiles.
5. Look and feel in a few words, and anything to avoid. Without a preference, use the sober default in `assets/style.css`.

Put the answers in `content/profile.json` (shape in `assets/profile.example.json`). Show the user the JSON before building, and mark every placeholder.

## Step 3: create the project

Recommended structure (same layout works for any static generator):

```
<account>.github.io/
  AGENTS.md                    instructions for any coding agent (template: assets/AGENTS.md)
  CLAUDE.md -> AGENTS.md       optional symlink, so Claude Code reads the same file
  README.md                    how to edit, build and publish
  content/profile.json         all text on the site
  build.mjs                    generator, Node only, no dependencies (assets/build.mjs)
  static/style.css             tokens on :root, dark mode via prefers-color-scheme
  .github/workflows/deploy.yml build + deploy to Pages (assets/deploy.yml)
  .gitignore                   dist/ and node_modules/
```

Copy the files from this skill's `assets/` folder, then adapt them. `scripts/` has the repo setup used in step 4. Keep `AGENTS.md` agent-neutral: it describes the project, the commands and the design rules, not one specific tool.

```bash
mkdir "$REPO" && cd "$REPO" && git init -b main
mkdir -p content static .github/workflows
# copy assets/: build.mjs, style.css -> static/, deploy.yml -> .github/workflows/,
#               AGENTS.md, profile.example.json -> content/profile.json
ln -s AGENTS.md CLAUDE.md          # optional
printf 'dist/\nnode_modules/\n' > .gitignore
node build.mjs && python3 -m http.server 4321 -d dist   # preview at http://localhost:4321
```

Optional extras, only if the user asks: a projects page, a blog (Markdown files rendered at build time), a custom domain, or a plugin/skill marketplace in the same repo (`.claude-plugin/marketplace.json` + `plugins/<plugin>/`, with the site listing them; validate with `claude plugin validate .` when Claude Code is installed).

## Step 4: create the repository and enable Pages

Always create the repo with `gh`, never by typing the name in the web UI: `scripts/create-site-repo.sh` takes the name from the logged-in account, so it is always exactly `<account>.github.io`. Run it from the site folder, with `--dry-run` first and show the user the output:

```bash
bash <skill-dir>/scripts/create-site-repo.sh --dry-run      # checks gh, login, scopes; prints what it will do
bash <skill-dir>/scripts/create-site-repo.sh                # creates the public repo, enables Pages (Actions), sets origin
# organization site:       ... --org <org>
# repo already exists:     ... --existing   (only after checking with the user what's in it)
```

It stops if `gh` is missing or not logged in, warns when the token lacks the `workflow` scope, and refuses to touch an existing repo without `--existing`. The same steps by hand:

```bash
gh repo create "$ACCOUNT/$REPO" --public --description "Personal site"
gh api -X POST "repos/$ACCOUNT/$REPO/pages" -f build_type=workflow   # PUT if Pages already exists
git remote add origin "https://github.com/$ACCOUNT/$REPO.git"
gh api "repos/$ACCOUNT/$REPO/pages" --jq '{url: .html_url, source: .build_type}'
```

The Pages setting also lives in the web UI under **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Step 5: deploy

```bash
git add -A && git commit -m "Personal site"
git push -u origin main
gh run watch "$(gh run list --workflow deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId')" --exit-status
curl -sI "https://$REPO/" | head -1      # expect HTTP/2 200; the first deploy can take a minute or two
```

From then on, every push to `main` rebuilds and publishes. `gh workflow run deploy.yml` redeploys without a commit.

## Step 6: check before calling it done

- Open the live URL, not only the local preview. Links work, no 404 on CSS or pages.
- Take screenshots at 1280px and 390px wide, light and dark mode. No horizontal scroll at 390px.
- Keyboard: Tab reaches every link with a visible focus ring. Text contrast meets WCAG AA in both themes.
- `<title>`, meta description and `lang` are set; images have `alt`.
- No placeholder like `[year]` left in the published page, unless the user chose to keep it for now (then list them).

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `https://<account>.github.io/` is 404, site appears under `/<repo>/` | Repo name isn't exactly `<account>.github.io` for the owning account. Rename: `gh repo rename <account>.github.io`. |
| 404 everywhere after a green run | Pages source still "Deploy from a branch", or private repo on a free plan. Re-run the `build_type=workflow` call; make the repo public (`gh repo edit --visibility public --accept-visibility-change-consequences`). |
| Push rejected: "refusing to allow an OAuth App to create or update workflow" | Token lacks the `workflow` scope: `gh auth refresh -s workflow`. |
| Deploy job: "Branch is not allowed to deploy to github-pages" | The `github-pages` environment only allows the default branch. Deploy from `main`, or add the branch under Settings → Environments. |
| `gh api .../pages` returns 409 or 422 | Pages already exists: use `-X PUT` instead of `-X POST`. |
| CSS missing on the live site only | Absolute paths assume the root. For a project site (`/<repo>/`), prefix paths with the base; `assets/build.mjs` does this from `GITHUB_REPOSITORY`. |
| Old version still showing | CDN cache, up to ~10 minutes. Check the run finished and hard-refresh. |

## Custom domain (optional)

```bash
gh api -X PUT "repos/$ACCOUNT/$REPO/pages" -f cname=www.example.com
# DNS: CNAME www -> <account>.github.io ; apex: A records to GitHub Pages IPs (see GitHub docs)
gh api -X PUT "repos/$ACCOUNT/$REPO/pages" -F https_enforced=true   # once the certificate is issued
```

## Output

End with: the live URL, the repo URL, which file to edit for each kind of change (`content/profile.json` for text, `static/style.css` for look), the list of placeholders still open, and the one command to preview locally.
