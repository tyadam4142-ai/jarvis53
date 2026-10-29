# Installing JARVIS 53 on macOS

Applies to: JARVIS 53 v2.9.0 · macOS 12 Monterey or newer · Apple Silicon (M-series) and Intel Macs.

## Option A — recommended: the desktop application

1. Download `JARVIS53-macOS-AppleSilicon.dmg` (M1/M2/M3/M4) or `JARVIS53-macOS-Intel.dmg` from https://jarvis53.dynamicrobotics53.com.
2. Open the DMG and drag **JARVIS 53** into **Applications**.
3. Launch JARVIS 53 from Applications (⌘-Space → "JARVIS").
   - First launch: macOS may warn the app is from an unidentified developer. Right-click the app → **Open** → **Open** again. This is expected while the app ships unsigned (see below).
4. Sign in / activate with your phone number and the payment reference you submitted, or the activation token from the website.
5. Grant permissions when prompted:
   - **Microphone** — for hold-to-talk voice.
   - **Input Monitoring / Accessibility** — only for the system-wide voice companion.

### What the desktop app does automatically
- Starts and supervises the local AI service (127.0.0.1, random high port; logged to `~/.jarvis53/server.log`).
- Restarts the service automatically if it ever crashes (up to 3 attempts, then a clear notification).
- Keeps JARVIS running in the menu bar (tray) when you close the window — closing the window never kills a running task.
- Registers the global summon shortcut **⌘⇧J** (configurable, see below).
- Offers **Launch at login** in the tray menu.

### Global shortcut
Default: `Command + Shift + J` toggles JARVIS from any app. To change it:
1. Quit JARVIS 53 (tray → Quit).
2. Edit `~/.jarvis53/config.json` → `"shortcut": "CommandOrControl+Alt+J"` (any valid Electron accelerator).
3. Relaunch. If the shortcut is taken by another app, JARVIS tells you on startup.

### Signing note (read this)
Current builds are **unsigned test builds** until Dynamic Robotics completes Apple Developer ID
signing and notarization. Gatekeeper will show a one-time warning — that is expected and safe for
the official download from jarvis53.dynamicrobotics53.com. Signed, notarized builds remove this
step entirely (tracked in docs/RELEASE_CHECKLIST.md).

## Option B — the classic launcher (still supported)

1. Install Node.js 20.9+ from https://nodejs.org (LTS).
2. Unzip `JARVIS-53-Mac-v2.9.0.zip`.
3. Double-click `start-mac.command`. First run installs dependencies, prepares the database, and
   compiles (one time, ~2–4 minutes with internet).
4. The console window must stay open; it runs the assistant's local service.
5. Stop with `stop-mac.command`.

## First-run checklist
- [ ] Health check: in a terminal run `curl -s http://127.0.0.1:35553/api/health` (or the port shown in the app) — expect `"ok":true`.
- [ ] Activation accepted (green "ALL ACCESS GRANTED").
- [ ] Microphone permission granted (if using voice).
- [ ] Global shortcut responds while another app is focused.
- [ ] Tray icon visible; closing and reopening the window preserves your chat.

## Uninstall
1. Tray → Quit JARVIS 53.
2. Drag the app from Applications to Trash.
3. Optional: remove local data with `rm -rf ~/.jarvis53` and the app's saved folder
   (`~/Library/Application Support/JARVIS 53`). Your JARVIS Drive files live inside the app data
   folder — copy anything you need first.
