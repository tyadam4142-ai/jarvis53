# JARVIS 53 — Release Notes v2.7.0

_The "Build Anything" release — real files, real websites, one summon phrase._

## ★ NEW: JARVIS Drive — JARVIS can now create files & build websites (everywhere)

JARVIS used to "do things in your computer" but had nowhere of its own to put
results — and on the hosted website it could not create files at all. That is
fixed with a real, persistent, sandboxed workspace that ships on **every**
install: the **JARVIS Drive**.

- **"Build me a website for my bakery"** → JARVIS writes a complete,
  production-quality single-file website (HTML + CSS + JS) and saves it to
  your Drive. No more describing code in chat — it *builds* it.
- **Live preview**: every site renders instantly in Studio → Drive inside a
  sandboxed pane (scripts run; the site can never touch JARVIS itself).
- **Real files**: markdown, CSV, JSON, code, documents — "save a file…" and
  it is in the Drive, forever.
- **One-click zip**: "Download all" packages the whole Drive.
- New tools: `drive.write`, `drive.site`, `drive.list`, `drive.read`,
  `drive.delete`, `drive.download` (74 tools total, up from 68).
- Fixed the silent killer: the AI token cap used to truncate whole websites
  mid-JSON and break the reply — raised 1,200 → 8,000 tokens with much wider
  argument limits, so big builds parse cleanly.

## ★ NEW: "Command 53" — summon JARVIS from anywhere

- **macOS: hold ⌘ and tap 5, then 3** (⌘5 → ⌘3)
- **Windows: hold Ctrl and tap 5, then 3** (Ctrl+5 → Ctrl+3)
- Works system-wide in any app via the Global Voice Companion, and inside the
  app window too. The JARVIS window opens/focuses instantly.
- Disable with `JARVIS_SUMMON="off"` in `.env`.
- Hold-to-talk is unchanged: Right Option / Right Command on macOS (F8 stays
  reserved by macOS for Play/Pause), F8 on Windows.

## ★ NEW: Web App deployment package — admin on YOUR website link

New `JARVIS-53-WebApp-v2.7.0.zip`: the full app preconfigured to run on your
own server/domain with the database connected and **admin enabled**.

- Open `https://your-domain/admin` — no local customer install needed.
- Ships with a generated master PIN (see ADMIN-ACCESS.txt; change any time).
- Domain guard pre-wired: set your hostnames in `JARVIS_ALLOWED_HOSTS`.
- Step-by-step server guide included (DEPLOY-WEB.md, nginx/pm2/certbot).

## ★ Studio, upgraded

Studio now leads with the **Drive** tab (file browser, live site preview,
code view, per-file delete, zip download) alongside Tasks, Notes and the
prompt library — refreshed with website-building prompts.

## ★ Smoother

- Chat tool cards for Drive items carry **Live preview / Open in Studio /
  Zip** buttons the moment JARVIS finishes building.
- The console empty state teaches Command 53 and website building.
- PWA cache and all version badges bumped to v2.7.0.

## Security notes

- Drive is path-sandboxed (no `..`, no hidden files, 3 MB per file) and site
  previews run in a locked-down iframe (CSP, no same-origin access).
- Drive previews are the only pages allowed to frame (SAMEORIGIN) — everything
  else stays DENY.
- Desktop packages still ship admin OFF; the Web App package is the one with
  the admin portal on, protected by your PIN.

— Dynamic Robotics · J53 All Access
