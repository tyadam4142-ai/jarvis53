# J53 All Access — Security notes

- This is a static GitHub Pages website. It contains no API keys and must never contain production keys.
- Keep OpenRouter, NVIDIA NIM, and Google Gemini secrets in the local app's server-side configuration only.
- The app admin interface uses password-style key entry and returns opaque IDs and a fixed hidden label, never complete raw keys.
- Do not upload `.env`, `data/keys.json`, SQLite databases, or `.j53-bridge-token` to GitHub. These are ignored by the shipped app `.gitignore`.
- The website bundle does not process payments. The included app requires a payment reference and manual admin verification; the database is per installation. A shared web dashboard needs a separately hosted, authenticated activation backend.
- If a production API key was ever committed to a repository, displayed publicly, or included in a ZIP, revoke it at the provider and replace it. Removing it from the latest ZIP does not invalidate a leaked key.
