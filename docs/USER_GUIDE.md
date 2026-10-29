# JARVIS 53 — User Guide

Welcome to J53 All Access by Dynamic Robotics. This guide covers the v2.9.0 desktop application.

## 1. Getting in
1. Launch **JARVIS 53**. The boot sequence runs, then the All Access gate appears.
2. Enter your international phone number and the transaction reference you received when you paid
   (the site shows current payment instructions). Submit, and wait for the administrator's manual
   verification — the screen polls until your access is granted.
3. Already activated on this machine before? JARVIS remembers your device token and opens straight away.
4. Support gave you a recovery token? Paste it in the "Activation token" field instead.

## 2. The HUD
- **Arc reactor orb** — shows JARVIS's state: idle, listening, thinking, speaking.
- **Console** — your conversation. Tool results appear as cards under each reply with their real
  output: green = done, red = error (with the actual message), shield = awaiting your approval.
- **⌘K / Ctrl+K** — command bar: jump to any tool or action.
- **Studio** — the JARVIS Drive (files JARVIS created), live site previews, downloads.
- **Comms** — draft WhatsApp/e-mail messages (always drafts; nothing sends by itself).
- **Support** — the concierge; it can open a human ticket when needed.
- **Customize** — themes, accent color, glow, fonts, density, voice replies.

## 3. Everyday abilities
- **Talk or type**: hold **Space** (in-window) or use your configured push-to-talk keys; or just type.
- **Global summon**: `⌘⇧J` (macOS) / `Ctrl+Shift+J` (Windows) from any app opens/hides JARVIS.
  Change it in `~/.jarvis53/config.json`.
- **Computer control** (65+ tools): launch and quit apps, volume, dark mode, battery/Wi-Fi status,
  window snapping, clipboard, media playback, notes, reminders, calendar, web search, weather,
  currency, Wikipedia, and more. Low-risk actions run automatically; risky ones show a shield card
  for one-tap approval.
- **Files that really exist**: ask JARVIS to create documents, scripts, or whole projects — files
  are written to disk (the card shows the exact path), and risky writes ask first.
- **The JARVIS Drive**: your private workspace inside JARVIS. Websites built by JARVIS preview
  instantly in Studio; everything is downloadable as a ZIP.
- **Coding work**: JARVIS can inspect a project, create or edit multiple files, run the program or
  its tests (you approve the command), read the real error output, fix mistakes, and report what
  actually happened — including failures.

## 4. How honest results work
Every result card is the truth from your machine: JARVIS cannot claim a file exists or a command
succeeded unless the tool actually returned success. If something failed, you see the error, and
JARVIS works from that same error — never from imagination. The route note under each reply shows
which AI provider handled it (OpenRouter / NVIDIA NIM / Google Gemini); if no provider is reachable,
JARVIS says so instead of quietly downgrading.

## 5. Background behaviour
- Closing the window hides JARVIS to the tray/menu bar — running tasks continue.
- Finished tasks produce a native notification; your chat and Drive are exactly as you left them
  when you return.
- Quit fully from the tray menu → **Quit JARVIS 53** (this cleanly stops the local service).
- Optional **Launch at login** is a tray-menu toggle.

## 6. Privacy and safety basics
- Your local AI service listens only on 127.0.0.1 — it is not reachable from the network.
- Activation tokens are stored as hashes; provider API keys live on the administrator's server,
  never inside the app bundle or your browser.
- JARVIS refuses system-critical and destructive operations; it drafts messages instead of sending
  them; it never asks for your card PIN or OTPs.
- Voice transcription for the optional system-wide companion runs on your machine.

## 7. Tips for best results
- One clear goal per request beats a paragraph of mixed intents.
- For coding: name the folder or let JARVIS inspect the project first; say "run it" when you want
  execution, and expect one approval tap for commands.
- Say "what's in my Drive" before asking to overwrite something.
- If JARVIS asked for approval and you changed your mind, ignore the card — nothing runs without you.
