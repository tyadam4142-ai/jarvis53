# JARVIS 53 — Platform Setup (v2.9.0)

This package is designed for the accounts you already have: **Cloudflare + GitHub, with no VPS**.

## What ships in v2.9.0

- **Desktop application source** (`desktop-app/`): the customer app is now a real native desktop
  application (Electron shell supervising the local JARVIS service) for macOS and Windows, with a
  tray, a global summon shortcut, background-task survival, native notifications, and crash
  recovery. The classic launcher scripts are still included and supported.
- **Real coding agent**: tool results are reported back to the AI (it can fix its own failures),
  and new tools let JARVIS run approved commands, inspect projects, edit files in place, and
  search file contents — with real exit codes and zero fake success.
- **UPI removed everywhere**; the one all-in-one subscription keeps manual payment verification.
- **Release engineering**: GitHub Actions builds `JARVIS53-macOS-*.dmg` (Apple Silicon + Intel)
  and `JARVIS53-Windows-x64-Setup.exe` on tagged pushes, with an optional signing recipe.

## Your two websites and one shared database

- **Public website/downloads:** `https://jarvis53.dynamicrobotics53.com` — static site deployed
  through Cloudflare Pages from GitHub. It contains the customer Mac/Windows packages.
- **Admin website + API:** `https://53.jarvis53.dynamicrobotics53.com` — Cloudflare Worker,
  administrator login, activation/payment review, settings and AI keys.
- **One shared database:** Cloudflare D1 (`jarvis53-shared-db`). The public activation form and the
  administrator website both use the same Worker API and D1 customer records.
- **Source and automatic updates:** GitHub. Once connected, pushes to `main` redeploy both Cloudflare
  projects, and version tags (`v*`) build the desktop installers via Actions.

## Why the public site uses Cloudflare Pages

GitHub Pages policy says it is not intended/allowed as free hosting for an online business or
commercial SaaS, so the commercial download/subscription site stays on Cloudflare Pages:
https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

## Cost note

Designed to fit Cloudflare's Free tiers: Workers 100k requests/day, D1 5M rows read/day /
100k writes/day / 5 GB, Pages 500 builds/month. Exceeding a limit makes requests fail; moving to
paid plans costs money. Your domain renewal and third-party AI provider usage also cost money.
You can leave AI keys unset while testing activation; cloud AI will not answer until a key is set.
Official limits: https://developers.cloudflare.com/workers/platform/limits/ ·
https://developers.cloudflare.com/d1/platform/pricing/ · https://developers.cloudflare.com/pages/platform/limits/

## Do these steps in order

1. Extract this package.
2. Check Cloudflare DNS: if a stale `A`, `AAAA`, or `CNAME` record named `53.jarvis53` exists from
   an old experiment, remove **only that record** before setup.
3. Double-click `SETUP-CLOUDFLARE.command` (right-click → Open if blocked). It creates/reuses the
   D1 database, generates private admin/encryption secrets, applies migrations (now including
   `0002_remove_upi`), and deploys the admin/API Worker.
4. A private file `~/JARVIS53-CLOUDFLARE-SECRETS.txt` opens. `ADMIN_PASSWORD` is your admin login.
   Never upload or paste that file.
5. Create a **private empty repository** named `jarvis53-platform` at https://github.com/new
   (no README/license).
6. Double-click `PUBLISH-TO-GITHUB.command` and paste the repository URL. v2.9.0 publishes the
   public site, the Worker, **and the desktop-app source** (so Actions can build installers), while
   excluding secrets, dependencies, builds and local databases.
7. Cloudflare → Workers & Pages → create a Pages project from the repo: branch `main`, preset
   **None**, no build command, output directory `public-site`. Test the `*.pages.dev` preview.
8. Point `jarvis53.dynamicrobotics53.com` at the Pages project (custom domain), removing only the
   old GitHub Pages `jarvis53` DNS records if prompted. Do not touch the admin hostname, root or www.
9. Connect the Worker to Git: repo `main`, root directory `cloudflare-worker`, install
   `npm install --no-audit --no-fund`, build `npm test`, deploy `npx wrangler deploy`.
10. Open `https://53.jarvis53.dynamicrobotics53.com/api/health` — expect `ok:true`, `version:"2.9.0"`,
    `database:"connected"`. Sign in at `/admin`, set payment instructions (no UPI field — by design),
    optionally add a provider key under **AI Keys**.
11. Desktop installers: push a tag (`git tag v2.9.0 && git push origin v2.9.0`) — the `release`
    workflow builds macOS/Windows artifacts and attaches them to the GitHub Release. Until you add
    signing secrets they are unsigned test builds (docs/RELEASE_CHECKLIST.md §6).
12. Submit a test activation from the public site, approve it in the admin Customers panel after
    verifying the payment, confirm activation in the app, then delete the test customer.

## Important security and product notes

- The admin password and AES encryption key are created locally and set as Worker secrets; the local
  secret file is not part of the source package. Provider AI keys are encrypted at rest (AES-GCM).
- Payment is verified **manually**. A submitted reference is not proof of payment. Activation
  submissions are rate-limited per IP; hosted AI defaults to 100 requests/day per active account
  (`CUSTOMER_DAILY_AI_LIMIT`).
- No owner-controlled API key is ever bundled into the desktop app; customers use the hosted AI
  route with their activated account. The Electron shell is sandboxed (no Node in the renderer).
- Customer desktop packages in this release are v2.9.0 and match the control-plane version.

## If a step errors

Stop and copy the first actual error message. Never paste API tokens, the admin password, AI keys,
or the contents of `JARVIS53-CLOUDFLARE-SECRETS.txt`. See `docs/TROUBLESHOOTING.md` for the common
failures and `docs/RELEASE_CHECKLIST.md` for the full go-live gate.
