# J53 All Access Website v2.7.1

Static site bundle for JARVIS 53 by Dynamic Robotics. Contains the marketing/downloads
site plus the latest release ZIPs for macOS, Windows and the Web App in `downloads/`.

## Your link

**https://jarvis53.dynamicrobotics53.com**

## One plan

**J53 All Access:** ₹553 monthly or ₹5,530 annually. Both have the same feature set.
The static site does not collect money or process recurring billing. The app asks for a
payment transaction reference; the owner verifies the transfer in the admin portal.

## Deploy on GitHub Pages + Cloudflare

1. Extract this ZIP. Commit the *contents* of `JARVIS-53-Website-AllAccess-v2.7.1/` to
   your GitHub Pages repository. Keep `assets/`, `downloads/`, `favicon.svg`, and `CNAME`.
2. GitHub repository Settings → Pages → Custom domain: `jarvis53.dynamicrobotics53.com`.
3. Cloudflare DNS: CNAME record name **`jarvis53`**, target `tyadam4142-ai.github.io`
   (or the exact GitHub Pages hostname GitHub shows), TTL Auto. Start with DNS only
   while GitHub verifies. Enable Enforce HTTPS after the certificate is ready.
4. Test the homepage, CSS, JS, logo, favicon and the three downloads over HTTPS.

## Owner admin portal

The admin portal (customers, payments, AI keys, tickets, announcements) lives in the
**Web App package** (`downloads/JARVIS-53-WebApp-v2.7.1.zip`), not on GitHub Pages.
Deploy the Web App on your server, point `jarvis53.dynamicrobotics53.com` (or an
`app.` subdomain) at it, and open `/admin`. See `DEPLOY-WEB.md` + `ADMIN-ACCESS.txt`
inside that ZIP. Customer installs keep admin disabled by design.

## API key privacy

No production API keys are included in the static website or the release archives. The
Web App ships with admin enabled for the owner only (PIN in `ADMIN-ACCESS.txt`); AI keys
are added after login under Admin → AI Keys and are stored server-side only. Never
commit secrets to GitHub.

## Static hosting note

GitHub Pages is static hosting — it serves this site and the download ZIPs. The chat
console, database and admin portal need the Web App running on a server. Point the
domain (or an `app.` subdomain) at the machine running the Web App for full functionality.
