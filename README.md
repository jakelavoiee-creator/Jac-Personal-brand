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

### `aura-miami-clips`: speaker clips → branded B&W reels

Finds known people talking about entrepreneur mindset, encouragement, the higher self, doing what you love, meditation, abundance and manifestation. It ranks their most quotable 15–45s moments and renders 1080×1920 black-and-white Aura Miami reels (hook, captions, credit, watermark, end card). Requires `youtube-watch`.

```bash
S=.claude/skills/aura-miami-clips/scripts
python3 $S/clips.py hunt --theme manifestation higher-self        # find source videos
python3 $S/clips.py scan URL1 URL2 --theme manifestation           # rank moments from captions
python3 $S/clips.py render URL --start 754 --end 786 \
  --hook "IT ALREADY HAPPENED" --credit "Jim Carrey" --preview      # post-ready reel
```
Options: `--logo aura-white.png` uses the real wordmark; `--color` gives muted color instead of B&W.
