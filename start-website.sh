#!/usr/bin/env bash
# Starts the kiosk website and opens it in your browser (macOS / Linux).
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

echo ""
echo "  McDonald's Kiosk - starting the website"
echo "  ======================================="
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "  Node.js was not found. Install it from https://nodejs.org and try again."
  exit 1
fi

if [ ! -d node_modules/express ]; then
  echo "  First run detected - installing dependencies..."
  npm install
fi

(
  sleep 2
  if command -v open >/dev/null 2>&1; then open http://localhost:3000
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open http://localhost:3000
  fi
) >/dev/null 2>&1 &

echo "  Server starting at http://localhost:3000"
echo "  Sign in: juan@email.com / user123  or  admin@mcdo.ph / admin123"
echo "  Press Ctrl+C to stop."
echo ""
node server.js
