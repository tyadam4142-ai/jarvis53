# JARVIS 53 — Release Notes v2.7.1

## Your link: jarvis53.dynamicrobotics53.com

- Every domain reference now points to **jarvis53.dynamicrobotics53.com** (the old
  `this.jarvis53…` placeholder is gone from configs, docs, CNAME, sitemap and metadata).
- DNS note: on Cloudflare the CNAME record name is `jarvis53` (target depends on where
  you host — GitHub Pages for the static site, your server for the Web App).

## Smarter host guard (Web App + server deploys)

- The hostname from `JARVIS_SITE_URL` is now **always allowed automatically** — one
  config value controls both your link and the host guard, so a mismatch can never 403
  your own domain. `JARVIS_ALLOWED_HOSTS` remains for extra hostnames/aliases.
- The Web App package ships with `JARVIS_SITE_URL` and `JARVIS_ALLOWED_HOSTS`
  pre-wired to `jarvis53.dynamicrobotics53.com`.

## Admin portal (unchanged, confirmed working)

- Open `https://jarvis53.dynamicrobotics53.com/admin` (or `http://127.0.0.1:3000/admin`
  locally with the Web App) and sign in with the owner PIN shipped in `ADMIN-ACCESS.txt`.
- 5 wrong attempts lock login for 5 minutes; PIN is changeable in `.env` or in
  Admin → Settings.

## Packages refreshed

- `JARVIS-53-Mac-v2.7.1.zip`, `JARVIS-53-Windows-v2.7.1.zip`,
  `JARVIS-53-WebApp-v2.7.1.zip`, `JARVIS-53-Website-AllAccess-v2.7.1.zip`
- Desktop apps get the same host-guard improvement; nothing else changed on desktop.
