# JARVIS 53 — Bug Register

Severity: critical / high / medium / low. Every entry lists evidence (file:line in the v2.8.0
package / v2.7.3 desktop source), root cause, fix status, and verification method.
"Verified" = reproduced or proven by an automated check in this rebuild.

## A. Runtime / agent architecture

### BUG-001 · high · Tool results never reach the model (single-turn agent)
- Repro: ask "create a file hello.py in Documents with print('hi')" with an active account.
- Expected: model proposes `files.write`, sees the real tool outcome, confirms or corrects.
- Actual: `src/app/api/chat/route.ts` calls `jarvisThink()` once, runs proposed tools afterwards,
  returns. Tool outcomes go only to the UI. The model can never react to a failed/confirmed tool.
- Root cause: no agent loop; `jarvisThink` returns a final answer before any tool runs.
- Fix: implemented multi-turn loop (`runAgentLoop`) in the local chat route — after tools execute,
  their outcomes are appended as a tool-report message and the model gets up to 2 follow-up turns
  (bounded budget; never loops on the same failure).
- Verification: unit test `tests/agent-loop.test.ts` (fake model + fake runner) proves the model
  receives outcomes and stops when done.

### BUG-002 · high · AI file writes dead-end at "confirmation required" with no model awareness
- Repro: any chat request that implies `files.write`/`files.mkdir`/`files.copy` (risk:medium).
- Expected: either a smooth approval flow, or an explicit "approval pending" answer.
- Actual: `runner.ts:105` returns `confirm_required`; the model's pre-generated `say` often reads
  as if the work already happened ("Done, sir." from store.ts:380 when events exist).
- Root cause: confirm gate is invisible to the model; UI fallback text overstates progress.
- Fix: outcomes (including `confirm_required`) now feed back to the model (BUG-001 fix); the loop
  prompt forbids claiming completion of unconfirmed actions; UI fallback text removed in favour of
  the model's informed reply.
- Verification: covered by the same agent-loop test; string audit in `store.ts`.

### BUG-003 · high · Product is not a desktop application (lifecycle owned by Terminal + Chrome)
- Evidence: `start-mac.command` (foreground `npm start`, Chrome `--app` window, `open` fallback to
  a browser tab), `stop-mac.command` (kill by port).
- Consequences: closing Terminal kills the assistant; closing the window loses the UI; no tray, no
  notifications, no launch-at-login, no update path.
- Fix: real Electron shell added (`desktop-app/electron/`): main process owns the Next.js server as
  a child process with health checks + crash restart (3 attempts, backoff), Tray with Show/Quit,
  close-to-tray, configurable global shortcut (default `CmdOrCtrl+Shift+J`), single-instance lock,
  native notifications, launch-at-login toggle, clean child shutdown. Renderer sandboxed
  (contextIsolation on, nodeIntegration off, strict CSP).
- Verification: `electron/main.cjs` + `server-manager.cjs` pass `node --check`; lifecycle logic
  covered by `tests/server-manager.test.ts` (port pick, health wait, restart backoff with fake
  spawn); real DMG/NSIS builds require macOS/Windows runners — documented in RELEASE_CHECKLIST.

### BUG-004 · medium · No global shortcut to summon JARVIS from other apps
- Evidence: only the Python voice bridge has global hotkeys (macOS right-option/right-command,
  Windows F8 via `install-global-voice.bat`); the UI itself cannot be summoned.
- Fix: Electron `globalShortcut` (default `CmdOrCtrl+Shift+J`, editable in
  `~/.jarvis53/config.json`, conflict detection with helpful error), plus tray menu and
  `Command 53` chord kept working inside the app.
- Verification: code review + `node --check`; physical-device check listed in RELEASE_CHECKLIST.

### BUG-005 · medium · No coding-agent tool coverage
- Evidence: registry has no command execution, no project inspection, no content edit, no content
  search. "Build me a program" can only produce single `drive.write`/`files.write` files.
- Fix: four new tools implemented for macOS + Windows with the same safety pipeline:
  `dev.run_command` (high risk, explicit confirm, 120s timeout, output cap, cwd pinned to a
  resolved path), `dev.inspect_project` (low), `files.edit` (medium; exact find/replace with
  occurrence accounting; refuses ambiguity), `files.search_content` (low; ripgrep→grep→
  Select-String fallback chain). Registry, prompts, and worker `ALLOWED_TOOLS`/`TOOL_CATALOG`
  updated together.
- Verification: `tests/tools.test.ts` covers `files.edit` semantics and run-command guard rails.

### BUG-006 · medium · Duplicated/conflicting model defaults between components
- Evidence: desktop `keys.ts:42` defaults Gemini to `gemini-3.8-flash`, worker `wrangler.jsonc`
  uses `gemini-2.5-flash`; `.env.example` also `gemini-3.8-flash`.
- Risk: a provider 404 on every Gemini call until someone edits env by hand; silent failover hides it.
- Fix: single documented default (`gemini-2.5-flash` — a real GA model id) in desktop defaults and
  env template; admin can override via `GEMINI_MODEL`. Config table added to ARCHITECTURE_DECISIONS.
- Verification: grep across tree returns one default.

### BUG-007 · low · UI fallback text overstates tool progress
- Evidence: `store.ts:380` — `res.say || (events.length ? 'Done, sir.' : "I'm on it.")` shows
  "Done, sir." even when every tool card is an error.
- Fix: fallback text replaced by neutral "Action finished — see the result cards." only when the
  model returned an empty string; error cards render their own text.
- Verification: string-level check in tests (`tests/store-text.test.ts`).

### BUG-008 · low · `files.write` handler uses a fragile double-write fallback
- Evidence: `handlers-mac.ts` `filesWrite` — `fs.appendFile(..., append ? 'utf8' : undefined as never)`
  then a `.catch` re-write. Works, but relies on an `undefined as never` cast and a duplicate call.
- Fix: single explicit branch — `append ? fs.appendFile(p, "\n"+content, "utf8") : fs.writeFile(p, content, "utf8")` — identical on Windows handlers.
- Verification: typecheck + tool unit test writes/appends in a temp dir.

### BUG-009 · low · `system.unmute` advertised on Windows in handlers but registry says macOS-only
- Evidence: `registry.ts:43` `os:['mac']` vs Windows handler coverage table; catalog shown to the
  model is platform-filtered so impact is cosmetic, but Windows users lose a working tool.
- Fix: registry updated to `['mac','win']` after confirming the PowerShell handler exists.
- Verification: registry/platform consistency test in `tests/tools.test.ts`.

## B. Control plane (Cloudflare Worker)

### BUG-101 · medium · Activation error message mandates a "UPI/bank transaction reference"
- Evidence: `src/index.js:218`.
- Fix: "A payment transaction reference is required for manual verification." (UPI removed
  product-wide; see BUG-201.)
- Verification: worker smoke test asserts the new copy and rejects refs shorter than 4 chars.

### BUG-102 · medium · `paymentUpiId` setting seeded by migration and editable via admin API
- Evidence: `migrations/0001_init.sql:86`, `src/index.js:126,346`.
- Fix: `0002_remove_upi.sql` deletes the setting row; worker no longer reads/writes it;
  `publicConfig` returns payment instructions only.
- Verification: smoke test asserts `/api/activation/request` GET contains no `upiId` key.

### BUG-103 · low · Admin dashboard hardcodes UPI wording in the approve confirmation
- Evidence: `admin.js:149` "…in your bank/UPI app…".
- Fix: neutral wording ("in your bank app or payment app").
- Verification: grep for `upi` in worker public assets returns zero hits.

### BUG-104 · low · Health endpoint version string drifts from package
- Evidence: `src/index.js:530` hardcodes `version: '2.8.0'`.
- Fix: version injected via a single `VERSION` constant now matching `package.json` (2.9.0).
- Verification: smoke test asserts health reports 2.9.0.

## C. Public site

### BUG-105 · low · Activation form carries UPI-specific copy and placeholder
- Evidence: `public-site/index.html:418,428`, `assets/js/main.js:721,736`.
- Fix: generic "payment/transaction reference" copy; `UPI ID:` prefix removed from the
  instructions renderer.
- Verification: grep for `upi` across `public-site/` returns zero hits (case-insensitive).

### BUG-106 · low · Download links pinned to v2.7.3 artifacts
- Fix: links updated to the v2.9.0 artifacts; `SHA256SUMS.txt` regenerated from the new ZIPs.
- Verification: `sha256sum -c` passes inside `public-site/downloads/`.

## D. Security review (no exploitable bug found; recorded for completeness)

- SEC-OK-1: Provider keys never sent to the renderer; `maskKey()` returns a fixed bullet string
  (`keys.ts:150-153`).
- SEC-OK-2: Worker stores provider keys AES-GCM-encrypted with a setup-generated key; admin
  sessions hashed at rest; login rate-limited per IP hash; audit trail on privileged actions.
- SEC-OK-3: `proxy.ts` blocks foreign hosts (DNS-rebinding guard), enforces same-origin on unsafe
  methods, 404s the admin area unless operator mode, and hard-disables desktop-only endpoints in
  hosted mode.
- SEC-OK-4: Desktop tool exec uses argv arrays (`execFile`) or escaped script literals; blocklist
  sandbox blocks system roots; no raw concatenation of user input into shells found.
- SEC-OK-5: CSV export escapes formula-prefixed cells (`adminExport`).
- SEC-IMPROVE (implemented): Electron shell runs with `contextIsolation: true`,
  `nodeIntegration: false`, `sandbox: true`, strict CSP, and a minimal IPC surface
  (`window.j53.notify`, `window.j53.getLauncherConfig`). No remote content is loaded.

## E. Unresolved / requires owner environment

- UNRES-1: macOS signing/notarization and Windows Authenticode need owner certificates; builds
  ship unsigned until then (documented workaround steps included).
- UNRES-2: Live Cloudflare deploy, D1 remote migration and custom-domain checks require the
  owner's Cloudflare account (`SETUP-CLOUDFLARE.command` unchanged flow, `npm test` gate added
  before deploy).
- UNRES-3: Physical-device verification matrix (mic permissions, global shortcut conflicts,
  tray behaviour) is listed in RELEASE_CHECKLIST and cannot be executed from this sandbox.
- UNRES-4: Local LLM (Ollama) integration is deliberately out of scope for v2.9.0 (roadmap R-3);
  the "no silent local fallback" policy is preserved.
