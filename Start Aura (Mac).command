#!/bin/bash
# Double-click to start Aura Studio on a Mac. Keep this window open while you use it.
cd "$(dirname "$0")/aura-studio" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "Node.js is not installed yet."
  echo "Install the LTS version from https://nodejs.org, then double-click this file again."
  open "https://nodejs.org"
  read -n 1 -s -r -p "Press any key to close."
  exit 1
fi
node scripts/start.mjs || read -n 1 -s -r -p "Press any key to close."
