# J53 All Access v2.7.1 — Deploy Guide

## Website: GitHub Pages + Cloudflare

1. Extract the website ZIP and commit the contents of its top-level folder to the GitHub Pages repository. Preserve all of `assets/`, `downloads/`, `favicon.svg`, and `CNAME`.
2. On GitHub: repository **Settings → Pages → Custom domain** = `jarvis53.dynamicrobotics53.com`.
3. On Cloudflare DNS: add CNAME record name **`jarvis53`**, target `tyadam4142-ai.github.io` (or the exact Pages target shown by GitHub), TTL Auto, initially **DNS only** (grey cloud).
4. Wait for GitHub's DNS verification and certificate provisioning, then enable Enforce HTTPS.
5. Check `/`, `/assets/css/style.css`, `/assets/js/main.js`, `/assets/img/j53-logo.svg`, `/favicon.svg` and the three files in `/downloads/`.

## Web App (console + database + admin portal)

The static site cannot run the console, the database or `/admin` — those live in
`JARVIS-53-WebApp-v2.7.1.zip`. Deploy it on any Node 20.9+ server:

```bash
unzip JARVIS-53-WebApp-v2.7.1.zip && cd JARVIS-53-WebApp
npm install && npm run db:push && npm run build
npm run start -- -H 0.0.0.0 -p 3000
```

Then point your domain at it (reverse proxy + HTTPS) and open **`/admin`** with the
owner PIN from `ADMIN-ACCESS.txt`. The `.env` in that package is pre-wired to
`jarvis53.dynamicrobotics53.com` — the hostname from `JARVIS_SITE_URL` is always
accepted automatically, so your own domain can never be 403'd by the host guard.

## Desktop apps (customer installs)

- Requires Node.js 20.9+ and an Internet connection for first-time dependency install.
- Extract the Mac/Windows ZIP to its own folder. Run `start-mac.command` (Mac) or `start-windows.bat` (Windows). It creates `.env` from `.env.example` only if a local `.env` does not already exist.
- Customer installs ship with admin **disabled** (`/admin` does not exist there). The owner manages customers, payments and keys from the Web App admin portal instead.
- Summon JARVIS any time with **Command 53**: ⌘5 then ⌘3 on macOS, Ctrl+5 then Ctrl+3 on Windows. Hold-to-talk: Right ⌥/⌘ on macOS, F8 on Windows.
- The launcher prepares Prisma and runs the production build. Do not treat the app as fully tested unless `npm run build` completes successfully.

## Subscriptions & payments

J53 All Access is ₹553 monthly / ₹5,530 annually. Payment references are verified
manually by the owner in the Web App admin portal (Admin → Customers), which is backed
by the server database — approvals apply to every customer device connected to that
deployment.
