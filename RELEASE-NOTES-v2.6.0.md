# JARVIS 53 — Release Notes v2.6.0

Dynamic Robotics · October 2026

v2.6.0 is a smoothness, reliability and continuity release. It makes J53 feel like a true desktop app on both macOS and Windows: it reopens instantly, remembers every conversation, works when the window is not in front, and talks to you from any application.

## Highlights

### Works outside the browser window
- The conversation is now background-proof: speech recognition parks itself when the window hides and automatically revives when you return — no more dead mic after switching apps.
- The typewriter reveal runs on wall-clock time, so replies finish instantly when you come back instead of crawling.
- The microphone level meter keeps running in background tabs (timer-driven, not rAF-driven).
- Holding Space while the window loses focus (alt-tab) safely sends what it captured instead of leaking a stuck mic.
- Launchers now open J53 in a **dedicated app window** (Chrome `--app=` on macOS/Windows, Edge fallback) — no browser tabs, no address bar.

### Openable any time
- Double-clicking the launcher while J53 is already running **reopens the window and re-attaches the voice companion** — it never kills your session or nags about port 3000.
- The HUD is now a PWA: installable manifest, maskable icons and a conservative service worker (never caches API or HTML, so updates always land).
- The boot sequence is faster and skippable with any key.

### Database-connected memory
- New `ChatMessage` table: your conversation survives restarts, reloads and crashes; the HUD rehydrates the last exchange automatically.
- New `Preference` table: theme, accent, glow, font, density and voice-reply settings sync to the local database per phone number.
- New endpoints: `/api/chat/history` (GET/POST/DELETE) and `/api/preferences` (GET/POST). Clearing the conversation clears the database too.

### New global voice hotkeys (macOS)
- The companion no longer uses **F8 on macOS** — macOS maps F8 to Play/Pause media. Hold **Right Option (⌥)** or **Right Command (⌘)** in any app instead.
- Windows keeps **F8**.
- Customize with `JARVIS_HOTKEY` (e.g. `right_command`, `right_ctrl`, `caps_lock`, `f1`–`f12`).
- Pressing Esc now cancels only the current clip — it can no longer silently kill the companion; the keyboard listener self-heals if the OS tears it down.

### Smoother, prettier HUD
- JARVIS replies render markdown (lists, code, links, tables) with a HUD-styled theme.
- New suggestion chips on the empty state — one click to run common commands.
- Smart auto-scroll that stops fighting you: it follows the stream only when you're already at the bottom, with a jump-to-latest pill.
- The arc reactor resolves theme colors through the computed stylesheet, so every theme (and custom accent) colors the reactor correctly — including the previously broken CSS-variable canvas colors.
- Appearance Lab closes with Escape; refined focus rings, glass panels, scrollbars and motion curves throughout.

### Under the hood
- Version unified at 2.6.0 across app, health endpoint, HUD, docs and website.
- Removed the `output: "standalone"` Next config that can break `next start` static serving on customer machines.
- Per-customer chat history slice is computed correctly before send (previous slice could drop or duplicate turns).

## Upgrade notes
- Run `start-mac.command` / `start-windows.bat` — the launcher applies the new database schema automatically (`prisma db push`).
- No action is needed for the hotkey change on Windows. On macOS, update any muscle memory from F8 to Right Option/Right Command.
- Existing conversations are not migrated (they were never persisted before this release).
