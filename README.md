# Jac-Personal-brand

## Skills

### `youtube-watch`: Claude can watch, learn from, and clip videos

Lets Claude Code search YouTube, watch any video (transcript + timestamped frames + contact sheets), cut clips/stills/GIFs, and turn tutorials into new reusable skills.

**Setup**
```bash
brew install ffmpeg          # or: apt install ffmpeg
pip install yt-dlp           # downloads + captions
pip install faster-whisper   # optional: transcribe videos without captions
export GEMINI_API_KEY=...    # optional: free key from aistudio.google.com/apikey, enables `ask` + transcribing caption-less videos
```

**Use it**: just talk to Claude in this repo:
- "Watch https://youtu.be/... and break down the hook and structure"
- "Clip 1:20–1:45 from that video as a vertical reel"
- "Learn how to color-grade in DaVinci Resolve from YouTube and make it a skill"

Or run the script directly:
```bash
python3 .claude/skills/youtube-watch/scripts/yt.py search "claude code skills" -n 5
python3 .claude/skills/youtube-watch/scripts/yt.py watch "https://youtu.be/VIDEO_ID"
python3 .claude/skills/youtube-watch/scripts/yt.py clip VIDEO --start 1:20 --end 1:45 --vertical --gif
python3 .claude/skills/youtube-watch/scripts/yt.py frame VIDEO --at 0:42 2:10
python3 .claude/skills/youtube-watch/scripts/yt.py ask "https://youtu.be/VIDEO_ID" "List every tool shown on screen"
```

To use it in every project, copy the folder to `~/.claude/skills/youtube-watch/`.
