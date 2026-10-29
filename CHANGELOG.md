# Changelog — JARVIS 53

All notable changes to the JARVIS 53 platform (desktop app, control plane, public site).
This project follows semantic versioning; dates are UTC.

## [2.9.0] — 2026-10-28

### Added — real desktop application (desktop app)
- **Electron shell** (`desktop-app/electron/`): native window, tray/menu-bar presence,
  close-to-tray with background execution, single-instance lock, configurable global summon
  shortcut (default `CmdOrCtrl+Shift+J`, conflict detection), native notifications, launch-at-login
  toggle, application menu with Command Bar shortcut.
- **Supervised local service** (`electron/server-manager.cjs`): the Next.js server runs as a child
  of the app (ELECTRON_RUN_AS_NODE) on a free high port (≥35553), with health polling, automatic
  restart (3 attempts, linear backoff), recovery notifications, and clean SIGTERM shutdown.
- **Sandboxed renderer**: `contextIsolation`, `nodeIntegration:false`, `sandbox:true`, strict CSP,
  window-open/will-navigate guards, minimal IPC surface (`j53.notify`, `j53.getLauncherConfig`,
  `j53.onCommandBar`).
- **electron-builder packaging** (`electron-builder.yml`): DMG + ZIP targets for macOS arm64/x64,
  NSIS for Windows x64, branding, asar with unpacked native modules (sharp/Prisma).
- **GitHub Actions release pipeline** (`.github/workflows/release.yml`): typecheck + unit tests +
  build on tagged releases for both OSes, control-plane tests, artifacts attached to the GitHub
  Release; optional signing/notarization via repository secrets.

### Added — coding agent capabilities (desktop app)
- **Agent loop with tool-result feedback** (`runAgentLoop`): the model now receives the REAL
  outcome of every action (done / error / confirm_required / unsupported) and can react — fix a
  failed path, retry, or report honestly. Hard-bounded turns (`JARVIS_AGENT_MAX_TURNS`, default 3)
  with a stall guard; no fabricated success is possible end-to-end.
- Hosted mode gets one bounded follow-up call carrying the real tool report so its reply reflects
  what actually happened on the customer's machine.
- **New tools** (macOS + Windows + Linux where pure Node): `dev.run_command` (high-risk, approved,
  cwd-pinned, 120 s timeout, real exit code + stdout/stderr), `dev.inspect_project` (bounded tree +
  manifests), `files.edit` (exact-text in-place edit with occurrence accounting), and
  `files.search_content` (ripgrep → grep → Select-String chain). Tool count 74 → 78.
- System prompts teach the create → verify → fix loop and forbid claiming unexecuted work.
- Desktop tests (`bun test`): 21 tests / 287 assertions covering parsing, the loop plumbing, new
  tool semantics, registry integrity, and the path sandbox.

### Changed — security hardening
- `isPathSafe` now recognizes Windows-style paths on any host (blocklist applied from the raw path,
  closing a resolve()-evasion gap) in addition to the host-platform blocklist.
- Electron security baseline (see Added) as defense in depth on top of the existing `proxy.ts`
  host allow-list, CSRF guard and hosted-mode lockdown — all preserved unchanged.

### Changed — desktop lifecycle scripts
- `start-mac.command` / `start-windows.bat` remain supported as the classic launch path; the
  Electron app is now the recommended customer entry point.

### Fixed
- BUG-001/BUG-002: tool results never reached the model; AI file writes dead-ended at
  "confirmation required" with no awareness. Fixed by the agent loop (above).
- BUG-004: no global shortcut to summon JARVIS from other apps.
- BUG-005: no command-execution/project-inspection/file-edit tools.
- BUG-006: conflicting Gemini default models between components → unified on `gemini-2.5-flash`.
- BUG-007: UI said "Done, sir." even when every tool failed → neutral, card-driven truth.
- BUG-008: fragile `files.write` double-write fallback → single explicit branch.
- BUG-009: `system.unmute` was macOS-only in the registry despite having a working Windows handler.
- BUG-104/BUG-014: stale hardcoded versions in health endpoints → single source of truth (2.9.0).

### Removed — UPI (product-wide)
- Desktop: UPI ID display/copy button in Activation, "UPI UTR" placeholders, "UPI/bank" error copy,
  `paymentUpiId` setting + `JARVIS_UPI_ID` env, admin UPI field, schema comment.
- Control plane: `paymentUpiId` from `publicConfig`/settings API/admin page/migration seed
  (cleanup migration `0002_remove_upi.sql` deletes the stored row).
- Public site: UPI references in the activation form copy/placeholder and the instructions renderer.
- The subscription remains a single all-in-one plan with **manual payment verification**: a
  customer-submitted reference is not proof of payment; only admin approval activates access.

### Verified in this release (see docs/VALIDATION-REPORT.md)
- `tsc --noEmit` clean; `next build` compiles (30 routes); 21/21 desktop tests; 9/9 worker tests.
- Live-server acceptance: real file creation (95 B on disk), approval gate (`confirm_required`),
  confirmed execution with real `exit code: 0` + stdout, real in-place edit reflected in the next
  run, content search hit, `rm -rf /` refused.

## [2.8.0] — 2026-10-26 (baseline package)
- Cloudflare control plane: D1-backed customers/settings/announcements/audit, encrypted AI-key
  vault, manual payment review, rate limits, CSV export, admin dashboard, public site + activation
  form, six worker smoke tests, setup/publish scripts.

## [2.7.3] — earlier
- Customer desktop web app (Next.js), 74 local automation tools, JARVIS Drive, activation flow,
  multi-provider AI key pool, global voice companion (Python).
