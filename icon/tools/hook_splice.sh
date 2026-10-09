#!/usr/bin/env bash
# Meme-hook splice: [viral hook clip] -> hard cut -> [Giorgi video]
# Usage: hook_splice.sh HOOK.mp4 GIORGI.mp4 OUT.mp4 [HOOK_START] [HOOK_END]
#   HOOK_START/HOOK_END in seconds (default: whole hook clip).
# Output: 1080x1920, 30fps, H.264 CRF 18, AAC 48k stereo, faststart (IG/TikTok-ready).
set -euo pipefail
HOOK=$1; MAIN=$2; OUT=$3; SS=${4:-0}; TO=${5:-}
TRIM="-ss $SS"; [ -n "$TO" ] && TRIM="$TRIM -to $TO"
FIT="scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,format=yuv420p"
AUD="aresample=48000,aformat=channel_layouts=stereo"
ffmpeg -v error -y $TRIM -i "$HOOK" -i "$MAIN" -filter_complex \
 "[0:v]$FIT[v0];[0:a]$AUD[a0];[1:v]$FIT[v1];[1:a]$AUD[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]" \
 -map "[v]" -map "[a]" -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k -movflags +faststart "$OUT"
echo "wrote $OUT ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")s)"
