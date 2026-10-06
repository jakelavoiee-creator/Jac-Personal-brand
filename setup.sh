#!/usr/bin/env bash
# One-step setup + health check for the youtube-watch and aura-miami-clips skills.
# Usage: bash setup.sh
set -u
ok()   { printf "  \033[32mOK\033[0m   %s\n" "$1"; }
miss() { printf "  \033[31mMISSING\033[0m %s\n     -> %s\n" "$1" "$2"; MISSING=1; }
MISSING=0

echo "Installing Python packages..."
python3 -m pip install -q --upgrade "yt-dlp[default]" "opencv-python-headless<5" faster-whisper 2>&1 | grep -v -i "warning" || true

echo "Checking..."
command -v python3 >/dev/null && ok "python3" || miss "python3" "Mac: brew install python | Windows: winget install Python.Python.3.12"
command -v ffmpeg  >/dev/null && ok "ffmpeg"  || miss "ffmpeg"  "Mac: brew install ffmpeg | Windows: winget install ffmpeg"
ffmpeg -hide_banner -filters 2>/dev/null | grep -q " ass " && ok "ffmpeg captions (libass)" \
  || miss "ffmpeg built with libass" "reinstall ffmpeg from brew/winget (the full build)"
python3 -c "import yt_dlp" 2>/dev/null && ok "yt-dlp" || miss "yt-dlp" "python3 -m pip install yt-dlp"
python3 -c "import cv2; cv2.CascadeClassifier" 2>/dev/null && ok "face tracking (opencv)" \
  || miss "opencv 4.x" "python3 -m pip install 'opencv-python-headless<5'"
python3 -c "import faster_whisper" 2>/dev/null && ok "whisper (local transcription)" \
  || echo "  --   faster-whisper not installed (optional; Gemini or YouTube captions are used instead)"
[ -n "${GEMINI_API_KEY:-}" ] && ok "GEMINI_API_KEY set" \
  || echo "  --   GEMINI_API_KEY not set (optional; needed for 'find the best moment' and caption fallback)"

echo "Testing YouTube access..."
if python3 -m yt_dlp --no-warnings --skip-download --print title "https://www.youtube.com/watch?v=uL2ztWv70wE" 2>/dev/null | grep -qi carrey; then
  ok "YouTube reachable"
else
  miss "YouTube access" "if it says 'sign in to confirm', ask Claude to use --cookies-from-browser chrome"
fi

echo
if [ "$MISSING" = 0 ]; then
  echo "Ready. Open Claude Code in this folder and say:"
  echo "  \"Extract the Jim Carrey 'you can fail at what you don't want' moment from his 2014 MUM commencement speech.\""
else
  echo "Fix the MISSING items above, then run: bash setup.sh"
fi
