#!/bin/bash
cd "$(dirname "$0")" || exit 1
printf '\nJARVIS 53 — FREE CLOUDFLARE SETUP\n'
printf 'Public website: https://jarvis53.dynamicrobotics53.com\n'
printf 'Admin/API:      https://53.jarvis53.dynamicrobotics53.com\n'
printf 'Shared database: Cloudflare D1\n\n'
printf 'Choose what to do:\n'
printf '  1) Set up Cloudflare admin/API + shared database (first step)\n'
printf '  2) Publish the website and Worker source to your GitHub repository\n'
printf '  3) Open the step-by-step setup guide\n\n'
read -r -p 'Enter 1, 2 or 3: ' CHOICE
case "$CHOICE" in
  1) bash ./SETUP-CLOUDFLARE.sh; STATUS=$? ;;
  2) bash ./PUBLISH-TO-GITHUB.sh; STATUS=$? ;;
  3) open ./README-FIRST.md 2>/dev/null || true; STATUS=0 ;;
  *) printf 'Please run START-HERE.command again and choose 1, 2 or 3.\n'; STATUS=2 ;;
esac
printf '\nFinished with exit code %s. If there is an error, copy only the error text—not any password, API token or secret.\n' "$STATUS"
read -r -p 'Press Return to close this window…' _
exit "$STATUS"
