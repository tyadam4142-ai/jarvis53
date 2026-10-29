#!/bin/bash
cd "$(dirname "$0")" || exit 1
bash ./PUBLISH-TO-GITHUB.sh
STATUS=$?
printf '\nPublish script ended with exit code %s. You can close this window or copy any error text back into ChatGPT.\n' "$STATUS"
read -r -p 'Press Return to close this window…' _
exit "$STATUS"
