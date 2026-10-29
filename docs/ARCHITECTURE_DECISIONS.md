# JARVIS 53 — Architecture Decisions (v2.9.0)

Each decision lists options considered, the choice, and the evidence behind it.

## AD-1 · Desktop shell: Electron (chosen) vs Tauri vs "keep browser + scripts"

| Criterion (weight) | Electron | Tauri | Browser + scripts (status quo) |
|---|---|---|---|
| Reuse existing Node.js backend (high) | **perfect — same runtime, server becomes supervised child** | needs a Rust sidecar process supervisor or external node | already works but fragile |
| Background lifecycle independent of window (high) | **main process owns the server; windows are views** | good (Rust main) | poor — Terminal+Chrome lifetime coupling |
| Global shortcut + tray + notifications (high) | **first-class APIs** | good | none |
| Packaging of a Next.js + Prisma app (high) | **electron-builder bundles .next + node_modules; proven pattern** | sidecar binaries get complex with node deps | ZIP + npm install on customer machine |
| Customer-machine prerequisites (medium) | Node not needed at runtime (bundled) | no Node needed, but build complexity high | Node 20.9 + npm install + next build on first run |
| Binary size (low) | ~100–150 MB installed | ~10–20 MB | 0 |
| Team maintenance (medium: owner is JS-first) | **JS-only** | Rust + JS | JS |

**Decision: Electron.** The product is a Node.js application; Electron makes the Node runtime the
app itself instead of a prerequisite, gives first-class tray/shortcut/notification APIs, and keeps
the whole stack maintainable in JavaScript. Tauri's size advantage is real but its Rust sidecar
management for a Next.js+Prisma server adds failure modes that outweigh it here
(see COMPETITOR_RESEARCH §1 — OpenJarvis runs Tauri successfully, but their backend is Python/uv,
not a Node web server). Status-quo scripts remain supported as a fallback launch path.

## AD-2 · Process topology

```
JARVIS 53 (Electron main, privileged, sandboxed renderer)
 ├─ spawns & supervises: next start -H 127.0.0.1 -p <port>   (child process, auto-restart ≤3)
 ├─ Tray (Show JARVIS / Voice note / Launch at login / Quit)
 ├─ globalShortcut  (default CmdOrCtrl+Shift+J, user-editable config)
 ├─ BrowserWindow(s) → http://127.0.0.1:<port>  (contextIsolation, no node integration)
 └─ clean shutdown: SIGTERM child → stop voice companion → quit
```

- Port selection: preferred 35553, scans upward if busy; written to the launcher config so the
  voice bridge and docs stay consistent.
- Single instance via `app.requestSingleInstanceLock()`; second launch focuses the window.
- Close button hides to tray by default; `Quit` from tray/menu truly exits and kills children.
  (Config `closeAction: hide|quit` in `~/.jarvis53/config.json`.)

## AD-3 · Agent loop with tool-result feedback (the BUG-001/002 fix)

- `runAgentLoop` (in `src/lib/ai/provider.ts`, executed by `/api/chat` local mode):
  1. model turn → JSON `{say, actions[]}` (existing protocol, unchanged).
  2. each proposed action runs through the existing `runTool` safety pipeline
     (validate → platform check → risk gate → execute).
  3. outcomes (success, error, confirm_required, unsupported) are serialized into a compact
     tool-report message appended to the conversation; the model gets up to **2** additional turns
     to react (fix a path, report the real result, stop). Loop stops early when no actions are
     proposed or nothing new executed.
- Budget is hard-capped (`JARVIS_AGENT_MAX_TURNS`, default 3 total model turns) to bound cost.
- Hosted/worker mode is unchanged (it cannot run desktop tools; it returns `suggestedActions`,
  which the desktop executes and now reports back on a **second** hosted call — same loop, remote brain).

## AD-4 · Coding/file tool additions

`dev.run_command` (high risk), `dev.inspect_project` (low), `files.edit` (medium),
`files.search_content` (low) — see BUG-005. Design constraints:
- Execution is cwd-pinned to a resolved directory; output capped (8 KB stdout / 4 KB stderr);
  timeout 120 s; process group killed on timeout; exit code returned to the model verbatim.
- The model never receives a success it did not earn: the runner's `status`+`output` are the only
  truth source (Claude Code/Codex pattern).
- Risk tiers unchanged: medium/high actions still require the human confirm card unless the
  operator has enabled auto-approval for that tier in Admin (existing behaviour, now visible to
  the model through the loop).

## AD-5 · Model defaults unified

`gemini-2.5-flash` is the single shipped Gemini default (desktop defaults, `.env.example`, worker
vars). OpenRouter `z-ai/glm-5.3-flash` and NVIDIA `meta/llama-3.1-8b-instruct` keep working and
remain overridable per environment. Rationale: one supported default per provider eliminates the
404-on-fresh-install class of bug (BUG-006).

## AD-6 · Payments: manual verification, zero UPI surface

UPI-specific UI/API/settings/strings are removed product-wide; the data model keeps
`paymentRef` (generic transaction reference) and the pending→verify→approve flow. A customer-
submitted reference remains **not proof of payment**; only admin approval activates access.
Migration `0002_remove_upi.sql` cleans the D1 setting row. See BUG-201/BUG-101/BUG-102/BUG-103/BUG-105.

## AD-7 · Security posture for the Electron shell

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: on`.
- Strict CSP on the window; no remote content; navigation blocked outside the loopback origin.
- IPC surface: `j53.notify(title, body)` (task-completed notifications) and
  `j53.getLauncherConfig()` (port/shortcut info) only.
- Server stays bound to 127.0.0.1; `proxy.ts` host guard keeps DNS-rebinding protection.

## AD-8 · Versioning and artifacts

- Everything moves to **2.9.0** (desktop package, worker, health endpoints, docs, download
  artifacts, SHA256SUMS). Legacy v2.7.3 customer ZIPs are replaced in `public-site/downloads/`
  with regenerated v2.9.0 artifacts built from `desktop-app/` source.
