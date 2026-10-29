#!/bin/bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
APP="$ROOT/cloudflare-worker"
SECRETS_FILE="$HOME/JARVIS53-CLOUDFLARE-SECRETS.txt"

say() { printf '\n\033[1;33m[J53]\033[0m %s\n' "$*"; }
fail() { printf '\n\033[1;31m[J53 ERROR]\033[0m %s\n' "$*" >&2; exit 1; }

if ! command -v node >/dev/null 2>&1; then
  say "Node.js is required. Opening the official download page."
  open https://nodejs.org 2>/dev/null || true
  fail "Install Node.js LTS, reopen Terminal, and run this setup script again."
fi
if ! command -v npm >/dev/null 2>&1; then fail "npm was not found. Reinstall Node.js LTS from https://nodejs.org."; fi

cd "$APP"
say "Installing the Cloudflare deployment tool (first run only)."
npm install --no-audit --no-fund || fail "Could not install Wrangler. Check your internet connection and run this script again."

say "Opening Cloudflare sign-in. Approve the access in your browser."
npx wrangler login || fail "Cloudflare login did not complete. Try again, then rerun this script."

# Find an existing matching D1 DB if this setup was started previously.
say "Finding or creating the one shared JARVIS database."
DB_ID="$(npx wrangler d1 list --json 2>/dev/null | node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const root=JSON.parse(s);let found="";function walk(v){if(found||!v)return;if(Array.isArray(v)){for(const x of v)walk(x);return;}if(typeof v==="object"){const name=v.name||v.database_name||v.databaseName;const id=v.database_id||v.databaseId||v.uuid||v.id;if(name==="jarvis53-shared-db"&&typeof id==="string")found=id;for(const x of Object.values(v))walk(x);}}walk(root);if(found)process.stdout.write(found);});' || true)"

if [ -z "$DB_ID" ]; then
  CREATE_OUTPUT="$(npx wrangler d1 create jarvis53-shared-db 2>&1)" || {
    printf '%s\n' "$CREATE_OUTPUT"
    fail "Could not create D1. If the database already exists, check Cloudflare D1 and rerun; the setup script will reuse it when Wrangler lists it."
  }
  printf '%s\n' "$CREATE_OUTPUT"
  DB_ID="$(printf '%s' "$CREATE_OUTPUT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const m=s.match(/"?database_id"?\s*[:=]\s*"?([0-9a-f-]{16,})"?/i)||s.match(/"?databaseId"?\s*[:=]\s*"?([0-9a-f-]{16,})"?/i); if(m)process.stdout.write(m[1]);});')"
  if [ -z "$DB_ID" ]; then
    DB_ID="$(npx wrangler d1 list --json 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const root=JSON.parse(s);let id="";function w(v){if(id||!v)return;if(Array.isArray(v)){v.forEach(w);return;}if(typeof v==="object"){const n=v.name||v.database_name||v.databaseName;const x=v.database_id||v.databaseId||v.uuid||v.id;if(n==="jarvis53-shared-db"&&typeof x==="string")id=x;Object.values(v).forEach(w);}}w(root);process.stdout.write(id); }catch{}});')"
  fi
fi
[ -n "$DB_ID" ] || fail "Wrangler did not return the D1 database ID. Run 'cd "$APP" && npx wrangler d1 list' and send me the error output (not any secrets)."

DB_ID="$DB_ID" node - <<'NODE'
const fs = require('fs');
const path = 'wrangler.jsonc';
const config = JSON.parse(fs.readFileSync(path, 'utf8'));
config.d1_databases[0].database_id = process.env.DB_ID;
fs.writeFileSync(path, JSON.stringify(config, null, 2) + '\n');
NODE

# Preserve the encryption key between deployments. Changing it makes existing encrypted AI keys unreadable.
if [ -f "$SECRETS_FILE" ]; then
  ADMIN_PASSWORD="$(sed -n 's/^ADMIN_PASSWORD=//p' "$SECRETS_FILE" | head -n 1)"
  ENCRYPTION_KEY="$(sed -n 's/^ENCRYPTION_KEY=//p' "$SECRETS_FILE" | head -n 1)"
else
  ADMIN_PASSWORD="$(openssl rand -hex 20)"
  ENCRYPTION_KEY="$(openssl rand -base64 32 | tr -d '\n')"
  umask 077
  printf 'ADMIN_PASSWORD=%s\nENCRYPTION_KEY=%s\n' "$ADMIN_PASSWORD" "$ENCRYPTION_KEY" > "$SECRETS_FILE"
  chmod 600 "$SECRETS_FILE"
fi
[ "${#ADMIN_PASSWORD}" -ge 16 ] || fail "Your local secret file has an invalid ADMIN_PASSWORD. Rename it and rerun setup to generate a new secret file."
[ -n "$ENCRYPTION_KEY" ] || fail "Your local secret file is missing ENCRYPTION_KEY. Do not generate a new key if you already stored AI keys; recover the original key first."

say "Setting up the protected admin password and encryption key in Cloudflare."
printf '%s' "$ADMIN_PASSWORD" | npx wrangler secret put ADMIN_PASSWORD || fail "Could not set ADMIN_PASSWORD secret."
printf '%s' "$ENCRYPTION_KEY" | npx wrangler secret put ENCRYPTION_KEY || fail "Could not set ENCRYPTION_KEY secret."

say "Running the local route/security smoke tests."
npm test || fail "Smoke tests failed. Do not deploy until they pass."

say "Applying database tables and deploying the admin/API website."
npx wrangler d1 migrations apply jarvis53-shared-db --remote || fail "D1 migration failed. Do not publish links yet. Check the migration output."
npx wrangler deploy || fail "Worker deploy failed. Check the DNS/custom-domain message from Wrangler."

say "Setup finished. Your admin login details are stored privately on this Mac at:"
printf '  %s\n' "$SECRETS_FILE"
printf '\nAdmin website: https://53.jarvis53.dynamicrobotics53.com\nHealth check:  https://53.jarvis53.dynamicrobotics53.com/api/health\n'
printf '\nOpening your private admin password + encryption-key file now. Save it safely; never upload it to GitHub.\n'
open "$SECRETS_FILE" 2>/dev/null || true
printf '\nKeep the secret file out of GitHub. It contains the admin password and the key used to encrypt AI provider keys.\n'
