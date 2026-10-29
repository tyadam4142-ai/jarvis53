# JARVIS 53 — Release Checklist (v2.9.0)

Work top-to-bottom. Do not publish a build that skipped a section — record evidence next to each
item instead of trusting memory.

## 1. Version + source integrity
- [ ] `desktop-app/package.json` version = release version (2.9.0).
- [ ] `cloudflare-worker/package.json` version matches; `src/index.js` `VERSION` constant matches.
- [ ] `public-site/index.html` shows the new version and the new download filenames.
- [ ] `CHANGELOG.md` updated with the release date and every change.
- [ ] `sha256sum` of both customer ZIPs matches `public-site/downloads/SHA256SUMS.txt` and
      the root `FILES-SHA256SUMS.txt`.

## 2. Automated verification (must be green)
- [ ] `cd desktop-app && bunx tsc --noEmit` → 0 errors.
- [ ] `cd desktop-app && bun test tests/` → all pass (v2.9.0 baseline: 21 tests / 287 assertions).
- [ ] `cd desktop-app && npm run build` → "Compiled successfully".
- [ ] `cd cloudflare-worker && npm test` → all pass (v2.9.0 baseline: 9 tests).
- [ ] Runtime smoke: `next start` boots, `/api/health` returns `ok:true`, `version: 2.9.0`,
      `toolCount: 78`.
- [ ] Acceptance script (documented in VALIDATION-REPORT): files.write → files.edit →
      dev.run_command (confirmed) → real exit code 0 and real stdout; `rm -rf /` refused.

## 3. Desktop installers (GitHub Actions or local)
- [ ] Tag the release (`git tag v2.9.0 && git push --tags`) → `release` workflow runs.
- [ ] macOS job: `JARVIS-53-macOS-arm64-2.9.0.dmg` + `JARVIS-53-macOS-x64-2.9.0.dmg` produced.
- [ ] Windows job: `JARVIS53-Windows-x64-2.9.0-Setup.exe` produced.
- [ ] Worker test job green on the same commit.
- [ ] Artifacts attached to the GitHub Release with generated notes.

## 4. Physical-device matrix (cannot be automated — requires real hardware)
macOS:
- [ ] DMG installs; first launch Gatekeeper step documented in INSTALL_MACOS.md works.
- [ ] Window close hides to tray; background chat continues; restoring shows the finished result.
- [ ] ⌘⇧J summons JARVIS from Safari/Notes/VS Code; shortcut-conflict dialog appears if taken.
- [ ] Microphone + Input Monitoring prompts appear only when the relevant feature is used.
- [ ] Quit from tray stops the local service (check `lsof -i :<port>` is empty afterwards).
- [ ] Launch-at-login toggle survives reboot.
Windows:
- [ ] NSIS install/uninstall clean; SmartScreen path documented.
- [ ] Close-to-tray + background task + restore verified.
- [ ] Ctrl+Shift+J from another app; tray menu actions work.
- [ ] After uninstall, no orphan process remains on the service port.

## 5. Control-plane deployment
- [ ] Cloudflare Worker Builds deploys on push (`npm test` gate runs first).
- [ ] `wrangler d1 migrations apply jarvis53-shared-db --remote` executed (0001 + 0002).
- [ ] `https://53.jarvis53.dynamicrobotics53.com/api/health` → `ok:true`, `version:"2.9.0"`.
- [ ] Admin login works; AI Keys page lists the three providers; settings page has **no UPI field**.
- [ ] End-to-end: site activation with a test reference → pending appears in admin → approve →
      desktop app activates → expiry/cancel paths verified with a test customer → delete it.

## 6. Signing + notarization (owner prerequisites)
- [ ] Apple Developer ID Application certificate exported as `MAC_CERT_P12` (base64) +
      password secret; notarization secrets `MAC_APPLE_ID`, `MAC_APPLE_ID_PASSWORD`,
      `MAC_APPLE_ID_TEAM` set in the repo.
- [ ] Remove `identity: null` from `desktop-app/electron-builder.yml` or let the env override it.
- [ ] Windows Authenticode cert as `WIN_CERT_B64` + `WIN_CERT_PASSWORD`.
- [ ] After the first signed build: verify `codesign -dv --verbose=4` and `spctl -a` on macOS,
      `Get-AuthenticodeSignature` on Windows, then re-run the device matrix.

## 7. Publish
- [ ] Upload new ZIPs + `SHA256SUMS.txt` into `public-site/downloads/` (or attach installers from
      the GitHub Release and point the site at them).
- [ ] Deploy Cloudflare Pages; verify the live site shows the new version and activation works.
- [ ] Announce only after section 4 is done on at least one machine per OS.

## Rollback
- Keep the previous release's ZIPs/DMGs/EXE and `SHA256SUMS.txt` (rename with `-previous`).
- Workers: `npx wrangler rollback` restores the previous deployment instantly.
- D1: migrations are additive except `0002` (deletes one settings row) — restoring that row is a
  single INSERT if ever needed.
- Desktop customers: reinstall the previous ZIP/installer; local databases (`db/custom.db`) are
  forward-compatible and untouched by upgrades.
