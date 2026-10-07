# Jac-Personal-brand

## Skills

### `youtube-watch`: Claude can watch, learn from, and clip videos

Lets Claude Code search YouTube, watch any video (transcript + timestamped frames + contact sheets), cut clips/stills/GIFs, and turn tutorials into new reusable skills.

**Setup**: run `bash setup.sh` (installs packages, checks everything, tests YouTube access). Manual equivalent:
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

### `aura-miami-clips`: find and extract speaker clips

Searches YouTube for known people speaking on mindset, entrepreneurship, the higher self, doing what you love, meditation, abundance and manifestation, and finds the strongest moments. It extracts each one as a **clean 9:16 clip**: the crop follows the speaker's face, captions are burned in, and nothing else is added. Requires `youtube-watch`.

```bash
pip install yt-dlp "opencv-python-headless<5"
S=.claude/skills/aura-miami-clips/scripts
python3 $S/clips.py hunt --theme do-what-you-love                  # search YouTube
python3 $S/clips.py scan URL1 URL2 --theme do-what-you-love         # rank moments from captions
python3 $S/clips.py extract "https://www.youtube.com/watch?v=uL2ztWv70wE" \
  --start 11:17 --end 12:01 --preview                              # clean clip + captions
```
Options: `--frame original` keeps source framing; `--no-captions` gives the raw cut.

### `awakening-carousels`: dark athletic awakening carousels (personal brand)

Builds Instagram carousels for the ages 18–24 awakening story. It pulls images from a Pinterest board or local photos into a tagged library and matches an image to each slide's meaning. Every image is graded into one look (near-black, cold steel, grain), and the type is small, light and lowercase. Requires Pillow (`pip install pillow`).

```bash
C=.claude/skills/awakening-carousels/scripts/carousel.py
python3 $C pull https://www.pinterest.com/<user>/<board>/     # or: python3 $C add ~/Pictures/training
python3 $C untagged                                           # then tag each image by meaning
python3 $C render brand/awakening-carousels/specs/age-18-the-crack.json
python3 $C grid                                               # preview the profile grid
```
Story chapters per age: `.claude/skills/awakening-carousels/references/story-map.md`.
