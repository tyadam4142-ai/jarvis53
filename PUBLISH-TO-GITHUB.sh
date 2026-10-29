#!/bin/bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
fail() { printf '\n[J53 ERROR] %s\n' "$*" >&2; exit 1; }
if ! command -v git >/dev/null 2>&1; then
  open https://desktop.github.com 2>/dev/null || true
  fail "Git was not found. Install GitHub Desktop from https://desktop.github.com, sign in, then run this script again."
fi
if ! command -v rsync >/dev/null 2>&1; then fail "rsync is required; it is normally included with macOS."; fi
printf '\nJARVIS 53 — Publish the platform source to GitHub\n'
printf 'Opening GitHub so you can create a private, empty repository (name: jarvis53-platform).\n'
open https://github.com/new 2>/dev/null || true
printf 'Create it without adding a README/license, then paste its HTTPS URL below.\n'
printf 'Do not commit .env files or the private JARVIS53-CLOUDFLARE-SECRETS.txt file. This script excludes local secrets.\n\n'
read -r -p 'Paste the new repository HTTPS URL (for example https://github.com/YOURNAME/jarvis53-platform.git): ' REPO_URL
case "$REPO_URL" in
  https://github.com/*/*|git@github.com:*/*) ;;
  *) fail "That does not look like a GitHub repository URL. Copy the HTTPS URL from your new repo page." ;;
esac
DEST="$HOME/JARVIS53-platform-repo"
if [ -e "$DEST" ]; then
  fail "The folder $DEST already exists. Rename or move it, then rerun this script."
fi
printf '\nCloning your repository...\n'
git clone "$REPO_URL" "$DEST" || fail "Could not clone/push the GitHub repository. Sign in via GitHub Desktop and rerun."
cd "$DEST"
# Make main the publishing branch whether the repository is empty or initialized with a README.
git switch -C main >/dev/null 2>&1 || git checkout -B main
rsync -a --exclude 'node_modules/' --exclude '.wrangler/' --exclude '.dev.vars' --exclude '.env' --exclude '.env.*' "$ROOT/public-site/" "$DEST/public-site/"
rsync -a --exclude 'node_modules/' --exclude '.wrangler/' --exclude '.dev.vars' --exclude '.env' --exclude '.env.*' "$ROOT/cloudflare-worker/" "$DEST/cloudflare-worker/"
# v2.9.0: the desktop application source ships in the same repository so that the
# GitHub Actions release workflow can build Mac/Windows installers on tagged pushes.
rsync -a \
  --exclude 'node_modules/' --exclude '.next/' --exclude 'release/' \
  --exclude '.env' --exclude '.env.*' --exclude 'db/*.db' --exclude 'db/*.db-journal' \
  --exclude 'native/.venv/' --exclude 'native/global-voice.pid' --exclude 'native/global-voice.log' \
  --exclude 'data/keys.json' --exclude '.DS_Store' \
  "$ROOT/desktop-app/" "$DEST/desktop-app/"
cp "$ROOT/README-FIRST.md" "$DEST/README.md"
cp "$ROOT/.gitignore" "$DEST/.gitignore"
if [ -d "$ROOT/.github" ]; then rsync -a "$ROOT/.github/" "$DEST/.github/"; fi
if [ -d "$ROOT/docs" ]; then rsync -a "$ROOT/docs/" "$DEST/docs/"; fi
for file in START-HERE.command SETUP-CLOUDFLARE.sh SETUP-CLOUDFLARE.command PUBLISH-TO-GITHUB.sh PUBLISH-TO-GITHUB.command; do cp "$ROOT/$file" "$DEST/$file"; done
chmod +x "$DEST"/*.command "$DEST"/*.sh
# Local developer identity is stored only in this repo if Git needs it.
if ! git config user.name >/dev/null; then read -r -p 'Git commit name: ' GIT_NAME; git config user.name "$GIT_NAME"; fi
if ! git config user.email >/dev/null; then read -r -p 'Git commit email (GitHub email or noreply address): ' GIT_EMAIL; git config user.email "$GIT_EMAIL"; fi
git add public-site cloudflare-worker desktop-app README.md .gitignore START-HERE.command SETUP-CLOUDFLARE.sh SETUP-CLOUDFLARE.command PUBLISH-TO-GITHUB.sh PUBLISH-TO-GITHUB.command
if [ -d "$DEST/.github" ]; then git add .github; fi
if [ -d "$DEST/docs" ]; then git add docs; fi
if git diff --cached --quiet; then
  printf '\nNo changed files to commit. Your repo already appears to contain this release.\n'
else
  git commit -m 'Deploy JARVIS 53 platform: sites, control plane, desktop app v2.9.0'
fi
printf '\nPushing source to GitHub...\n'
git push -u origin main || fail "Git could not push. Sign in to GitHub, then run: cd '$DEST' && git push -u origin main"
printf '\nDONE. Source is here: %s\n' "$DEST"
printf 'Next: follow README.md steps 7–9 to connect Cloudflare Pages and Worker Builds.\n'
open 'https://dash.cloudflare.com/' 2>/dev/null || true
