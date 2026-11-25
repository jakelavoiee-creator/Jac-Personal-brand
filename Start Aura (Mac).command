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
if [ ! -d node_modules ]; then
  echo "First start: installing Aura (takes a few minutes, only once)…"
  npm install || { read -n 1 -s -r -p "Install failed — press any key to close."; exit 1; }
fi
echo ""
echo "Starting Aura Studio… it opens in your browser at http://localhost:5173"
echo "Leave this window open while you work. Close it to stop Aura."
(sleep 5; open "http://localhost:5173") &
npm run dev -- --port 5173
