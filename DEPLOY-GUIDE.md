# J53 All Access v2.6.0 — Deploy Guide

## Website: GitHub Pages + Cloudflare

1. Extract the website ZIP and commit the contents of its top-level folder to the GitHub Pages repository. Preserve all of `assets/`, `downloads/`, `favicon.svg`, and `CNAME`.
2. On GitHub: repository **Settings → Pages → Custom domain** = `this.jarvis53.dynamicrobotics53.com`.
3. On Cloudflare DNS: add CNAME name `this.jarvis53`, target `tyadam4142-ai.github.io` (or the exact Pages target shown by GitHub), TTL Auto, initially **DNS only** (grey cloud).
4. Wait for GitHub's DNS verification and certificate provisioning, then enable Enforce HTTPS.
5. Check `/`, `/assets/css/style.css`, `/assets/js/main.js`, `/assets/img/j53-logo.svg`, `/favicon.svg` and the two files in `/downloads/`.

## Desktop apps

- Requires Node.js 20.9+ and an Internet connection for first-time dependency install.
- Extract the Mac/Windows ZIP to its own folder. Run `start-mac.command` (Mac) or `start-windows.bat` (Windows). It creates `.env` from `.env.example` only if a local `.env` does not already exist.
- Open `http://127.0.0.1:3000/admin`, change the factory PIN `5353` before sharing, configure keys under AI Keys, and set payment instructions/UPI in Settings. Never expose the localhost app or commit `.env`/`data/keys.json`.
- The app keys screen uses password-style entry and opaque IDs and a fixed hidden label, never key fragments. Production API keys are not part of any website asset or release ZIP.
- The launcher prepares Prisma and runs the production build. Do not treat the app as fully tested unless `npm run build` completes successfully.

## Subscription/backend limitation

J53 All Access is ₹553 monthly / ₹5,530 annually. Payment references require manual verification; static hosting does not process payments. Current customer records and approvals are local to each app installation. A separate authenticated central backend/database is needed for an owner to approve subscriptions remotely across customer devices.
