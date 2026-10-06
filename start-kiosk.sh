#!/usr/bin/env bash
# Opens the offline single-file kiosk in a fullscreen app-style window.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
FILE="$HERE/dist/mcdo-kiosk-desktop.html"

if [ ! -f "$FILE" ]; then
  echo "Offline build not found. Run: npm run build:single"
  exit 1
fi

for BROWSER in \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
  "$(command -v google-chrome 2>/dev/null)" \
  "$(command -v chromium 2>/dev/null)" \
  "$(command -v msedge 2>/dev/null)"; do
  if [ -n "$BROWSER" ] && [ -x "$BROWSER" ]; then
    "$BROWSER" --app="file://$FILE" --kiosk --user-data-dir="${TMPDIR:-/tmp}/mcdo-kiosk-profile" &
    exit 0
  fi
done

echo "Chrome/Edge not found - opening in the default browser instead."
open "$FILE" 2>/dev/null || xdg-open "$FILE"
