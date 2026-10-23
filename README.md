# J53 All Access Website v2.6.0

Static GitHub Pages bundle for J53 All Access by Dynamic Robotics. Contains all HTML/CSS/JS/icon assets and the Mac/Windows source ZIPs in `downloads/`.

## One plan

**J53 All Access:** ₹553 monthly or ₹5,530 annually. Both have the same feature set. The static site does not collect money or process recurring billing. The app asks for a payment transaction reference; an administrator must verify the transfer manually.

## Deploy on GitHub Pages + Cloudflare

1. Extract this ZIP. Commit the *contents* of `JARVIS-53-Website-AllAccess-v2.6.0/` to your GitHub Pages repository. Keep `assets/`, `downloads/`, `favicon.svg`, and `CNAME`.
2. GitHub repository Settings → Pages → Custom domain: `this.jarvis53.dynamicrobotics53.com`.
3. Cloudflare DNS: CNAME name `this.jarvis53`, target `tyadam4142-ai.github.io` (or the exact GitHub Pages hostname GitHub shows), TTL Auto. Start with DNS only while GitHub verifies. Enable Enforce HTTPS after the certificate is ready.
4. Test the homepage, CSS, JS, logo, favicon and both downloads over HTTPS.

## API key privacy

No production API keys are included in the static website or the release archives. The app bundles `.env.example`, but not `.env`, `data/keys.json` or the local SQLite database. On first app launch, its starter copies the safe template to a private `.env`. Add keys under local Admin → AI Keys; the field masks typing and the UI only returns opaque IDs and a fixed hidden label, never key fragments. Never commit local secrets to GitHub.

## Important backend limitation

GitHub Pages is static hosting. It cannot run Next.js API routes or a shared cloud subscription/admin service. This release contains the desktop activation flow and local manual-review dashboard, but access records are stored on each installation. To centrally verify payments and unlock customers on separate computers, deploy a separate authenticated activation backend and shared database first.
