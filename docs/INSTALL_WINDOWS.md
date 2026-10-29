# Installing JARVIS 53 on Windows

Applies to: JARVIS 53 v2.9.0 · Windows 10 (1903+) / Windows 11 · 64-bit.

## Option A — recommended: the desktop application

1. Download `JARVIS53-Windows-x64-Setup.exe` from https://jarvis53.dynamicrobotics53.com.
2. Run the installer. Because the build is not yet Authenticode-signed, SmartScreen shows
   **"Windows protected your PC"** → click **More info** → **Run anyway**. This is expected for
   unsigned builds downloaded from the official site (see the signing note below).
3. Choose the install folder (default is fine), finish the wizard. Desktop and Start-menu
   shortcuts are created.
4. Launch **JARVIS 53** from the Start menu.
5. Activate with your phone number + payment reference (or the activation token from the website).
6. Windows privacy prompts:
   - **Microphone access** — allow it for voice (Settings → Privacy & security → Microphone).

### What the desktop app does automatically
- Runs and supervises the local AI service on 127.0.0.1 (log: `%USERPROFILE%\.jarvis53\server.log`).
- Restarts the service if it crashes (3 attempts with backoff, then a clear notification).
- Sits in the system tray when you close the window — closing the window never stops a task.
- Global summon shortcut **Ctrl+Shift+J** (configurable via `%USERPROFILE%\.jarvis53\config.json`).
- Optional **Launch at login** from the tray menu.

### Signing note
Builds are **unsigned test builds** until an Authenticode certificate is configured in the release
pipeline (docs/RELEASE_CHECKLIST.md). SmartScreen's warning is the expected consequence; only
download JARVIS from jarvis53.dynamicrobotics53.com and compare the SHA-256 sums published next to
the download links.

## Option B — the classic launcher (still supported)

1. Install Node.js 20.9+ LTS from https://nodejs.org.
2. Unzip `JARVIS-53-Windows-v2.9.0.zip` (e.g. to `C:\JARVIS53`).
3. Double-click `start-windows.bat`. The first run installs dependencies, prepares the database,
   and compiles (one time, ~2–4 minutes with internet).
4. Keep the console window open while using JARVIS; run `stop-windows.bat` to stop.

## First-run checklist
- [ ] Health check in PowerShell: `curl.exe -s http://127.0.0.1:35553/api/health` — expect `"ok":true`.
- [ ] Activation accepted.
- [ ] Microphone allowed (voice users).
- [ ] Ctrl+Shift+J works while another app has focus.
- [ ] Tray icon visible; chat history survives hiding/restoring the window.

## Uninstall
1. Tray → Quit JARVIS 53.
2. Windows Settings → Apps → **JARVIS 53** → Uninstall.
3. Optional: delete `%USERPROFILE%\.jarvis53` (logs/config) and the app data folder
   (`%APPDATA%\JARVIS 53`). Copy any JARVIS Drive files you want to keep first.
