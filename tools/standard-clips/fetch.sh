#!/usr/bin/env bash
# Download every source video + its English auto-captions (word-level timing) listed in clips.json.
# Cloud sessions: set YT_COOKIES_FILE to a logged-in cookies.txt and run the bgutil PO-token
# server (bgutil-ytdlp-pot-provider); it needs www.google.com reachable. Locally neither is needed.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p sources
# no-certifi: system trust store (cloud proxy CA). web_safari + bgutil token = HLS up to 1080p (web is SABR-only).
args=(--no-warnings --compat-options no-certifi --sleep-requests 1 --extractor-args "youtube:player_client=web_safari")
[ -n "${YT_COOKIES_FILE:-}" ] && args+=(--cookies "$YT_COOKIES_FILE")
command -v node >/dev/null && ! command -v deno >/dev/null && args+=(--js-runtimes node --remote-components ejs:github)

plans=("${@:-clips.json}")   # ./fetch.sh [clips.json clips2.json ...]
ids=$(python3 -c "import json,sys;print(' '.join(sorted({c['youtube'] for p in sys.argv[1:] for c in json.load(open(p))['clips']})))" "${plans[@]}")
for id in $ids; do
  if [ ! -f "sources/$id.mp4" ]; then
    yt-dlp "${args[@]}" -f "bv*[height<=1080]+ba/b" \
      --merge-output-format mp4 -o "sources/$id.%(ext)s" "https://www.youtube.com/watch?v=$id"
  fi
  if [ ! -f "sources/$id.en.vtt" ]; then
    yt-dlp "${args[@]}" --skip-download --ignore-no-formats-error --write-auto-subs --sub-langs "en-orig" \
      --sub-format vtt -o "sources/$id.%(ext)s" "https://www.youtube.com/watch?v=$id"
    [ -f "sources/$id.en-orig.vtt" ] && mv "sources/$id.en-orig.vtt" "sources/$id.en.vtt"
  fi
done
echo "sources ready in $(pwd)/sources"
