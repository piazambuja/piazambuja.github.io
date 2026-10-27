#!/usr/bin/env bash
# Creates <account>.github.io with the gh CLI and turns on GitHub Pages built by Actions.
# The repo name always comes from the logged-in account (or --org), so it can't be mistyped.
#
# Usage: create-site-repo.sh [--org <org>] [--existing] [--dry-run]
#   --org <org>  create <org>/<org>.github.io instead of the user site
#   --existing   the repo already exists: reuse it and switch its Pages source to Actions
#   --dry-run    only check and print what would be done
# Run it from the site folder: if it is a git repo, "origin" is pointed at the new repo.
set -euo pipefail

ORG="" DRY=0 EXISTING=0
while [ $# -gt 0 ]; do
  case "$1" in
    --org) ORG="${2:?--org needs a name}"; shift 2 ;;
    --existing) EXISTING=1; shift ;;
    --dry-run) DRY=1; shift ;;
    -h|--help) sed -n '2,9p' "$0"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 64 ;;
  esac
done

die() { echo "✗ $*" >&2; exit 1; }
run() { if [ "$DRY" = 1 ]; then echo "  would run: $*"; else "$@"; fi; }

command -v gh >/dev/null || die "gh not found. Install it: https://cli.github.com"
gh auth status -h github.com >/dev/null 2>&1 || die "gh is not logged in. Run: gh auth login -h github.com -p https -w"

LOGIN=$(gh api user --jq .login)
OWNER=$(printf '%s' "${ORG:-$LOGIN}" | tr '[:upper:]' '[:lower:]')
REPO="$OWNER.github.io"
echo "Account: $LOGIN"
echo "Repo:    $OWNER/$REPO  ->  https://$REPO/"

# Pushing .github/workflows/* with an OAuth token needs the "workflow" scope.
SCOPES=$(gh api -i user 2>/dev/null | tr -d '\r' | sed -n 's/^[Xx]-[Oo][Aa]uth-[Ss]copes: //p')
if [ -n "$SCOPES" ] && ! printf '%s' "$SCOPES" | grep -qw workflow; then
  echo "! token lacks the workflow scope; pushing the deploy workflow will fail."
  echo "  Fix: gh auth refresh -h github.com -s workflow"
fi

if gh repo view "$OWNER/$REPO" --json name >/dev/null 2>&1; then
  [ "$EXISTING" = 1 ] || die "$OWNER/$REPO already exists. Check what's in it with the user, then rerun with --existing to reuse it."
  echo "• $OWNER/$REPO already exists; reusing it."
else
  run gh repo create "$OWNER/$REPO" --public --description "Personal site"
fi

# Pages source = GitHub Actions. POST creates it; PUT switches an existing Pages site.
if gh api "repos/$OWNER/$REPO/pages" >/dev/null 2>&1; then
  run gh api -X PUT "repos/$OWNER/$REPO/pages" -f build_type=workflow --silent
else
  run gh api -X POST "repos/$OWNER/$REPO/pages" -f build_type=workflow --silent
fi

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  URL="https://github.com/$OWNER/$REPO.git"
  if git remote get-url origin >/dev/null 2>&1; then
    [ "$(git remote get-url origin)" = "$URL" ] || echo "! origin points to $(git remote get-url origin), not $URL. Check before pushing."
  else
    run git remote add origin "$URL"
  fi
fi

[ "$DRY" = 1 ] && { echo "Dry run: nothing changed."; exit 0; }
echo "✓ Ready. Push with: git push -u origin main"
echo "  Follow the deploy: gh run watch --exit-status"
