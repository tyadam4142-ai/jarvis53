# JARVIS 53 — Technical Audit (v2.8.0 package, desktop v2.7.3)

Audited: full source of the Cloudflare control plane (Worker, admin UI, D1 schema, setup scripts),
the public download site, and both customer desktop packages (macOS + Windows v2.7.3).
All findings below cite the exact source files inspected. Verified facts are separated from
engineering judgement.

## 1. What the product actually is today

Three components ship in the v2.8.0 package:

| Component | Technology | Role |
|---|---|---|
| Customer desktop app (v2.7.3, inside `public-site/downloads/*.zip`) | Next.js 16 + React 19 + Prisma/SQLite, launched by shell scripts, UI opened in a Chrome `--app` window | Chat HUD, 60+ local OS automations, JARVIS Drive sandbox, local admin page (operator mode), activation gate |
| Control plane (v2.8.0) | Cloudflare Worker + D1 + static admin page | Manual payment approval, customer registry, encrypted AI-key vault, hosted `/api/chat` proxy, announcements, audit log |
| Public site | Static (Cloudflare Pages) | Marketing page + activation form + download links |

Desktop app runtime model (`start-mac.command`, verified):
`npm install` on first run → `prisma db push` → `next build` → `npm start` (foreground Terminal
process on 127.0.0.1:3000) → opens `Google Chrome --app=http://127.0.0.1:3000`, falling back to
`open http://127.0.0.1:3000` (a normal browser tab).

## 2. Repository and architecture facts (verified)

- Frontend: Next.js 16 App Router, React 19, Tailwind, shadcn/radix UI, zustand store
  (`src/components/jarvis/store.ts`), framer-motion. Service worker at `sw.js` + `public/sw.js`.
- Backend: Next.js route handlers under `src/app/api/*` (chat, activation, admin, drive, tools,
  voice, preferences, health). Middleware-class guard in `src/proxy.ts` (host allow-list, CSRF
  same-origin checks, hosted-mode endpoint lockdown, security headers).
- AI adapters: `src/lib/ai/keys.ts` (multi-provider key pool: OpenRouter, NVIDIA NIM, Gemini;
  LRU rotation, cooldowns, masked keys) and `src/lib/ai/provider.ts` (JSON action protocol,
  strict-command local router, no silent local LLM fallback).
- Tool system: `src/lib/tools/registry.ts` (65+ tools, risk tiers, per-OS availability),
  `runner.ts` (validation, path sandbox, confirm gate), handlers per OS
  (`handlers-mac.ts` 799 lines, `handlers-win.ts` 641, `handlers-drive.ts`, `handlers-linux.ts`).
- Path safety: `src/lib/os.ts` — `resolvePath`, `isPathSafe` blocklists, argv-array `execFile`
  defaults, AppleScript/PowerShell escapers. Injection-hardened by construction.
- Auth: per-install activation token (64-hex), stored only as SHA-256 hash
  (`customer-auth.ts`, constant-time compare). Admin PIN session for operator mode (`admin-auth.ts`).
- Control plane: session cookies hashed at rest, login rate-limit, audit log, AES-GCM-encrypted
  provider keys, IP-hashed activation rate limit, CSV export with formula-injection guard
  (`cloudflare-worker/src/index.js` — all verified by reading the full file).
- Database: Prisma/SQLite locally (`db/custom.db`), Cloudflare D1 remotely (schema `0001_init.sql`).

## 3. Root-cause analysis of the owner-reported problems

| Reported problem | Root cause (evidence) |
|---|---|
| "Unreliable when the browser tab is minimized" | The UI is a browser page. Background-tab throttling plus the lifetime coupling between UI and server (Terminal running `npm start`). Any chat request that starts in a hidden tab is at the mercy of browser timers; closing Chrome kills the window; closing Terminal kills the server. |
| "Not a proper standalone desktop experience" | No Electron/Tauri shell exists. No tray, no native notifications, no launch-at-login, no real app lifecycle. The "app window" is Chrome app-mode. |
| "Not accessible from other applications" | Only the optional Python voice companion (`native/global_voice_bridge.py`) is global. No system-wide shortcut to summon the assistant UI itself. |
| "AI files not consistently created on disk" | Two-part cause: (1) every AI-proposed `files.write` is risk:medium, so `runner.ts:105` returns `confirm_required` unless the user approves each card; (2) the chat pipeline is single-turn — tool outcomes are never fed back to the model (`api/chat/route.ts` runs tools after `jarvisThink()` returns; no second model turn), so the model can neither react to failures nor iterate. |
| "Coding requests produce text, not working projects" | The tool registry has no `run_command`, no `inspect_project`, no `files.edit`; the model can only write whole files via `files.write`/`drive.write`. There is no plan→execute→test→fix loop. |
| "Tool execution and provider selection unreliable" | Provider selection is actually sound (LRU pool with failover — verified). The unreliability is the missing tool-result feedback loop and the confirm-gate dead-end described above. |
| "Falls back to a basic local engine" | `provider.ts` has a deterministic command router (`offlineCommand`) for exact matches like `volume 40`. It is documented in the route note, not silent. Some users perceived it as a "dumb mode". Its regexes also occasionally swallowed simple requests that should have gone to the model (mitigated by the compound-action guard at provider.ts:106). |
| "UPI functionality unnecessary" | UPI strings remain in the activation route, Activation UI, Admin UI, worker publicConfig/settings, admin page, public site, and schema comments (full list in BUG_REGISTER BUG-201). No payment gateway exists — only a reference string verified manually, so removal is safe. |

## 4. What is genuinely good and must be preserved (per working rule #2/#3)

- The activation token model (hash-only storage, constant-time compare, binding one install per phone).
- The manual payment approval workflow end-to-end (pending → admin approve → active, with expiry
  enforcement on both worker and desktop).
- The tool risk-tier system and the path sandbox.
- The provider key pool (LRU, cooldown, failover, masked UI, AES-GCM at rest on the worker).
- `proxy.ts` host allow-list + CSRF guard + hosted-mode endpoint lockdown.
- The JARVIS Drive (sandboxed workspace with real files on disk, previews, zip download).
- Honest diagnostics: `routeNote` strings and the "no local language-model fallback" policy.

## 5. Test coverage before this rebuild

- Worker: 6 smoke tests (`cloudflare-worker/tests/smoke.test.mjs`) — health, CORS, activation
  config, foreign-origin rejection, unauthenticated admin, chat rejection.
- Desktop app: zero automated tests. Two shell-based runtime experiments in `tests/` (Python
  runtime builds) that are not wired into any runner.
- No CI. No typecheck gate. No lint gate. (Owner runs `npm test` on the worker only via `predeploy`.)

## 6. Environment and packaging facts

- Customer machines must install Node.js 20.9+, run `npm install` (2–4 min), `prisma db push`,
  and a full `next build` on first launch — slow, fragile first-run experience.
- No code signing or notarization anywhere; downloads are plain ZIPs (Gatekeeper/SmartScreen will
  warn). No update mechanism.
- `.env.example` ships `JARVIS_REMOTE_AI_URL` pointing at the control plane, so customer installs
  use hosted AI by default; keys live server-side. Good design, retained.
- Desktop package contains `data/keys.json` (empty) and `db/custom.db` (empty schema). Verified no
  secrets committed. `FILES-SHA256SUMS.txt` and per-site `SHA256SUMS.txt` exist and must be
  regenerated for any new build.

## 7. Conclusion

The codebase is healthier than the owner's bug list suggests: security posture and provider
routing are solid. The four load-bearing gaps are (1) no real desktop process, (2) single-turn
agent with no tool-result feedback, (3) missing coding/file-tool coverage, (4) leftover UPI
language. Those four are exactly what v2.9.0 fixes; everything else is preserved.
