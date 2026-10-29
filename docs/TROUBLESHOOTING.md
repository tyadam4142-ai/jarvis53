# JARVIS 53 — Troubleshooting

Symptom-first. Every fix is something a customer can do without editing source code.

## Installation and launch

### "Windows protected your PC" (SmartScreen)
Expected while builds are unsigned. Click **More info → Run anyway** — only for downloads from
jarvis53.dynamicrobotics53.com. Verify the file's SHA-256 against `SHA256SUMS.txt` if in doubt.

### macOS says the app "can't be opened because it is from an unidentified developer"
Right-click the app → **Open** → **Open**. One time only. Signed builds remove this step.

### "The JARVIS 53 service did not start"
1. Open the log: `~/.jarvis53/server.log` (macOS/Linux) or `%USERPROFILE%\.jarvis53\server.log` (Windows).
2. Common causes: a broken `.next` folder (reinstall the app), an antivirus quarantining the
   runtime, or a corrupt local database (see next entry).
3. The desktop app auto-retries 3 times; if it gives up you get a notification — quit and relaunch once.

### Database errors on start ("Prisma", "custom.db")
Close JARVIS, back up the `db/custom.db` file from the install folder, delete it, and relaunch —
the schema is recreated. You will need to re-activate (your access is tied to your phone number on
the central server, not to this file).

### Port already in use (classic launcher path)
`start-mac.command`/`start-windows.bat` clean a stuck port automatically. If it persists:
- macOS: `lsof -ti tcp:3000 | xargs kill`, then relaunch.
- Windows: `for /f "tokens=5" %a in ('netstat -aon ^| findstr :3000') do taskkill /PID %a /F`.
The Electron app does not use port 3000 — it picks a free high port starting at 35553.

## Activation and payments

### "Payment reference received… waiting for administrator verification"
Normal. The owner verifies payments manually; nothing activates until they approve it in the admin
dashboard. Check again later — the activation screen polls automatically.

### "This phone is already bound to another JARVIS installation"
Your number is tied to a different activation token. Use the original installation's token, or ask
support for a **Customers → Reset token**. Do not submit another payment.

### "Daily AI request limit reached"
The hosted AI fair-use cap (default 100 requests/day per account) reset at midnight UTC, or the
administrator can raise `CUSTOMER_DAILY_AI_LIMIT`.

## AI and tools

### "I couldn't reach any configured cloud AI provider"
JARVIS is honest: it did NOT silently switch to a basic engine. Either the provider keys are
missing/expired/rate-limited (admin fixes this under AI Keys on the admin site) or the internet is
down. The message quotes the real provider error.

### A file was supposed to be created but I don't see it
- Look at the tool card in the chat: it shows the exact path and byte size on success, or the real
  error (`status: error`) on failure.
- Medium-risk writes need one approval click — the card says so; approve it and the model is told
  the real outcome.
- Default sandbox: paths inside protected system locations are refused. Use your home folder or a
  project folder.

### "Run Command needs your explicit approval"
By design — shell commands are high-risk. Approve once per request. Commands that match protected
destructive patterns (`rm -rf /`, disk erasers, registry wipes…) are refused outright, even with
approval.

### A command failed and JARVIS said so
That is the system working: the real exit code and stderr are shown on the card and reported back
to the model, which fixes the code and retries within its turn budget.

## Desktop behaviour

### Window closed — is JARVIS still working?
Yes. Closing the window hides JARVIS to the tray; background tasks keep running and a native
notification reports completion. Truly quit from the tray menu → **Quit JARVIS 53**.

### Global shortcut does nothing
Another app owns it (e.g. some launcher or screen-capture tools use Ctrl+Shift+J / ⌘⇧J). JARVIS
shows a conflict warning on startup — change `"shortcut"` in `~/.jarvis53/config.json`
(Windows: `%USERPROFILE%\.jarvis53\config.json`) and relaunch.

### Voice: hold-to-talk works in the window but not system-wide
System-wide push-to-talk needs the optional native companion: run
`native/install-global-voice.command` (macOS) or `native\install-global-voice.bat` (Windows), then
grant Microphone + Input Monitoring (macOS) / Microphone (Windows). macOS hotkeys are Right
Option/Right Command; Windows is F8.

## Diagnostics cheat-sheet
| Check | macOS/Linux | Windows |
|---|---|---|
| Service log | `~/.jarvis53/server.log` | `%USERPROFILE%\.jarvis53\server.log` |
| Health check | `curl -s http://127.0.0.1:<port>/api/health` | `curl.exe -s http://127.0.0.1:<port>/api/health` |
| Config / shortcut | `~/.jarvis53/config.json` | `%USERPROFILE%\.jarvis53\config.json` |
| Version | health JSON `version` field | same |
| Listening port | `lsof -iTCP:<port> -sTCP:LISTEN` | `netstat -aon | findstr :<port>` |

Still stuck? Contact Dynamic Robotics support with the health JSON and the last 20 lines of
`server.log` — **never** paste API keys, your activation token, or payment details.
