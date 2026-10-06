---
name: youtube-watch
description: Watch, learn from, and cut up YouTube videos (or any local video file). Use whenever the user shares a YouTube/video link or file, asks what a video says or shows, wants a breakdown of a video's hook/structure/editing, wants to find videos on a topic, wants to clip, trim, screenshot or GIF part of a video, or wants Claude to learn a skill from YouTube and save it as a reusable skill. Triggers: "watch this", "what's in this video", "break down this reel", "learn X from YouTube", "find videos about", "clip 1:20-1:45", "grab a frame", "make a GIF", "turn this tutorial into a skill".
---

# YouTube Watch

Gives you eyes (timestamped frames + contact sheets), ears (captions or Whisper transcript) and scissors (clips, stills, GIFs) for any video. Everything runs through one script:

```
python3 .claude/skills/youtube-watch/scripts/yt.py <command> ...
```

(If the skill is installed globally, the path is `~/.claude/skills/youtube-watch/scripts/yt.py`.)

Outputs land in `./yt-watch/<video-slug>/` (override with `--out DIR` before the command, or `YT_WATCH_DIR`).

## Setup (once)

- `ffmpeg` + `ffprobe` on PATH (`brew install ffmpeg` / `apt install ffmpeg`)
- `pip install yt-dlp` for URLs
- Optional: `pip install faster-whisper`, which transcribes videos that have no captions
- Optional: `GEMINI_API_KEY` (free at https://aistudio.google.com/apikey) for `ask`

If a command fails on a missing tool, install it and retry. Don't fall back to guessing what the video contains.

## Commands

| Command | Use it for |
|---|---|
| `search "query" -n 8` | Find candidate videos (title, channel, length, views, URL) |
| `watch URL_OR_FILE` | Full ingest: download → transcript → frames at even intervals + every scene cut → contact sheets → `timeline.md` |
| `frame SRC --at 1:23 95 0:02:10.5` | Full-res PNG stills at exact moments (into `stills/`) |
| `clip SRC --start 1:20 --end 1:45 [--vertical] [--gif] [--audio] [--name hook]` | Extract a segment as mp4 (into `clips/`); `--vertical` center-crops to 1080×1920 for Reels/TikTok/Shorts |
| `ask SRC "question"` | Gemini watches the whole video natively (YouTube URL, or local file <19MB) and answers |

`watch` options: `--max-frames 48` (raise for long or dense videos), `--scene 0.3` (lower = more cuts detected, 0 = off), `--max-height 720`.

## How to watch a video properly

1. Run `watch`. Then **read `timeline.md` first**. It has the metadata, chapters, description, scene cuts and a frame-by-frame merge of what was said.
2. **Open every contact sheet** (`sheet_01.jpg`, …) with the Read tool. Each tile is stamped with its timestamp. This is how you *see* the video: on-screen text, b-roll, screen recordings, edit style, the speaker's framing.
3. When a tile matters (code on screen, a slide, a UI), open the full-res still from `frames/` or grab an exact one with `frame`.
4. If there is no transcript, the timeline says so. Read burned-in captions from the sheets (sample denser with `--max-frames` if needed), or use `ask` for the audio.
5. Build your answer as **beats**: timestamp → what's on screen → what's said → what changed. Then read across the beats for structure. Report only what the frames and transcript show. Label anything inferred as inference, and anything sampling could have missed as a gap. Cite timestamps.

For long videos (>20 min), watch with chapters in mind. Run `watch` at the default budget for the overview, then `clip` the relevant chapter and `watch` the clip with a higher `--max-frames` to zoom in.

## Workflows

### Break down a video (content analysis)
Watch → beats → structure: **hook (0–3s)** · promise · retention devices · body sections · proof · CTA. Note pacing (cut frequency from the scene list), layouts, caption style, and on-screen assets. End with the 3 highest-signal observations, each with a timestamp.

### Extract parts
Find the moment in `timeline.md`, confirm it visually on the sheet, then `clip` with ~0.5s of padding either side. For social repurposing use `--vertical`. For a quick preview use `--gif`. For quotes or audio use `--audio`. Report the output paths.

### Learn a skill from YouTube → save it as a reusable skill
Use this when the user says "learn X from YouTube" or "turn this tutorial into a skill":
1. `search` the topic. Pick 2–4 videos from credible channels with substantive length (prefer tutorials over hype).
2. `watch` each one. Read the timelines and sheets, and open stills wherever code, settings or steps appear on screen.
3. Distill the method into concrete, ordered, checkable steps. Keep the exact commands, settings, numbers and gotchas. Where sources disagree, note it and say which you'd follow and why.
4. Write a new skill at `.claude/skills/<skill-name>/SKILL.md` using `references/skill-template.md`. Cite source videos with timestamps so every step can be traced.
5. Tell the user what the skill now enables and which parts came from inference rather than the videos.

## Notes
- Respect copyright: clips are for analysis, reference and the user's own repurposing decisions. Mention when re-uploading someone else's footage would need permission.
- Age-restricted, private or members-only videos need `yt-dlp --cookies-from-browser chrome`. Tell the user rather than working around it.
- Instagram, TikTok, X and Vimeo URLs usually work too (yt-dlp supports 1,000+ sites). If a download is blocked, ask the user to upload the file and run `watch` on the local path.
