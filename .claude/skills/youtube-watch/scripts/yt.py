#!/usr/bin/env python3
"""yt.py - give Claude eyes and ears for YouTube (or any local video).

Subcommands
  search  QUERY            find videos (title, channel, duration, views, url)
  watch   URL|FILE         download, transcribe, sample frames, build a timeline
  frame   SRC --at T       grab full-res still(s) at timestamp(s)
  clip    SRC --start --end  cut a segment (mp4, optional gif / 9:16 vertical)
  ask     URL|FILE "Q"     ask Gemini a question about the video (needs GEMINI_API_KEY)

Requires: ffmpeg/ffprobe on PATH, `pip install yt-dlp` for URLs.
Optional: `pip install faster-whisper` for videos without captions.
"""
import argparse
import base64
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

DEFAULT_OUT = Path(os.environ.get("YT_WATCH_DIR", "yt-watch"))


# ---------------------------------------------------------------- helpers

def die(msg):
    sys.exit(f"error: {msg}")


def need(tool, hint):
    if not shutil.which(tool):
        die(f"{tool} not found. {hint}")


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, text=True, capture_output=True, **kw)


def is_url(s):
    return bool(re.match(r"https?://", s))


def slugify(s, n=60):
    s = re.sub(r"[^\w\s-]", "", s).strip().lower()
    return re.sub(r"[\s_-]+", "-", s)[:n] or "video"


def ts(sec):
    sec = max(0.0, float(sec))
    h, rem = divmod(int(sec), 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def parse_time(t):
    """'90', '1:30', '0:01:30.5' -> seconds."""
    parts = [float(p) for p in str(t).split(":")]
    sec = 0.0
    for p in parts:
        sec = sec * 60 + p
    return sec


def duration(path):
    out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
               "-of", "default=nw=1:nk=1", str(path)]).stdout.strip()
    return float(out)


def ytdlp():
    need("yt-dlp", "Install with: pip install yt-dlp")
    return ["yt-dlp", "--no-warnings", "--no-playlist"]


# ---------------------------------------------------------------- search

def cmd_search(a):
    out = run(ytdlp() + ["--flat-playlist", "-J", f"ytsearch{a.n}:{a.query}"]).stdout
    entries = json.loads(out).get("entries", [])
    for i, e in enumerate(entries, 1):
        dur = ts(e["duration"]) if e.get("duration") else "?"
        views = f"{e['view_count']:,}" if e.get("view_count") else "?"
        url = e.get("url") or f"https://www.youtube.com/watch?v={e.get('id')}"
        print(f"{i}. {e.get('title')}\n   {e.get('channel') or e.get('uploader')} | {dur} | {views} views\n   {url}")


# ---------------------------------------------------------------- acquire

def acquire(src, out_root, max_height=720):
    """Return (workdir, video_path, meta). Downloads URLs; copies nothing for local files."""
    if is_url(src):
        meta = json.loads(run(ytdlp() + ["-J", src]).stdout)
        work = out_root / f"{slugify(meta.get('title', ''))}-{meta.get('id', 'x')}"
        work.mkdir(parents=True, exist_ok=True)
        video = work / "video.mp4"
        if not video.exists():
            subprocess.run(ytdlp() + [
                "-f", f"bv*[height<={max_height}]+ba/b[height<={max_height}]/b",
                "--merge-output-format", "mp4", "-o", str(video), src], check=True)
        # captions (manual preferred, auto as fallback) - cheap, no download of video needed
        subprocess.run(ytdlp() + [
            "--skip-download", "--write-subs", "--write-auto-subs",
            "--sub-langs", "en.*,en", "--sub-format", "vtt",
            "-o", str(work / "subs"), src], capture_output=True)
        keep = {k: meta.get(k) for k in (
            "id", "title", "channel", "uploader", "upload_date", "duration",
            "view_count", "like_count", "description", "chapters", "webpage_url", "tags")}
    else:
        video = Path(src).resolve()
        if not video.exists():
            die(f"no such file: {src}")
        work = out_root / slugify(video.stem)
        work.mkdir(parents=True, exist_ok=True)
        keep = {"title": video.stem, "source_file": str(video), "duration": duration(video)}
    (work / "meta.json").write_text(json.dumps(keep, indent=2))
    return work, video, keep


# ---------------------------------------------------------------- transcript

def parse_vtt(text):
    """Parse VTT into [(start, end, text)], collapsing YouTube's rolling auto-caption duplicates."""
    # line-based: YouTube cues contain whitespace-only lines, so blank-line splitting drops text
    timing = re.compile(r"(\d+:\d+:\d+\.\d+|\d+:\d+\.\d+) --> (\d+:\d+:\d+\.\d+|\d+:\d+\.\d+)")
    cues, out, cur = [], [], None
    for raw in text.splitlines():
        m = timing.search(raw)
        if m:
            cur = (parse_time(m.group(1)), parse_time(m.group(2)), [])
            cues.append(cur)
            continue
        line = re.sub(r"<[^>]+>", "", raw).strip()
        if cur is not None and line and not line.isdigit():  # skip numeric cue ids
            cur[2].append(line)
    cues = [c for c in cues if c[2]]
    seen_last = ""
    for start, end, lines in cues:
        # auto-captions repeat the previous line on top; keep only genuinely new lines
        new = [l for l in lines if l != seen_last]
        if not new:
            continue
        txt = " ".join(new)
        seen_last = lines[-1]
        if out and out[-1][2] == txt:
            out[-1] = (out[-1][0], end, txt)
        else:
            out.append((start, end, txt))
    return out


def whisper_transcribe(video, work):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        return None, "no captions and faster-whisper not installed (pip install faster-whisper)"
    wav = work / "audio.wav"
    run(["ffmpeg", "-y", "-v", "error", "-i", str(video), "-ac", "1", "-ar", "16000", str(wav)])
    try:
        model = WhisperModel(os.environ.get("WHISPER_MODEL", "base.en"), compute_type="int8")
        segs, _ = model.transcribe(str(wav), vad_filter=True)
        return [(s.start, s.end, s.text.strip()) for s in segs], "whisper"
    except Exception as e:  # model download blocked, etc.
        return None, f"whisper failed: {e}"
    finally:
        wav.unlink(missing_ok=True)


def get_transcript(work, video):
    vtts = sorted(work.glob("subs*.vtt"), key=lambda p: (".en." not in p.name, "orig" in p.name))
    if vtts:
        return parse_vtt(vtts[0].read_text(errors="ignore")), f"captions ({vtts[0].name})"
    return whisper_transcribe(video, work)


# ---------------------------------------------------------------- frames

def scene_changes(video, threshold):
    p = subprocess.run(["ffmpeg", "-i", str(video), "-vf", f"select='gt(scene,{threshold})',showinfo",
                        "-f", "null", "-"], capture_output=True, text=True)
    return [float(x) for x in re.findall(r"pts_time:([\d.]+)", p.stderr)]


def pick_times(dur, max_frames, scenes):
    """Even coverage plus scene cuts, thinned so no two picks are closer than the spacing allows."""
    step = max(dur / max_frames, 1.0)
    times = [i * step for i in range(int(dur / step) + 1)]
    times += [s + 0.3 for s in scenes]  # just after the cut, once the new shot has settled
    times = sorted(t for t in times if t < dur - 0.1)
    min_gap = step * 0.5
    picked = []
    for t in times:
        if not picked or t - picked[-1] >= min_gap:
            picked.append(t)
    return picked


def grab(video, t, dest, width=None):
    vf = ["-vf", f"scale={width}:-2"] if width else []
    run(["ffmpeg", "-y", "-v", "error", "-ss", f"{t:.3f}", "-i", str(video),
         "-frames:v", "1", *vf, "-q:v", "3", str(dest)])


def contact_sheets(frames, work, cols=4, rows=4):
    """Tile labelled thumbnails into sheets Claude can read in one image each."""
    sheets = []
    per = cols * rows
    for i in range(0, len(frames), per):
        chunk = frames[i:i + per]
        listfile = work / "frames" / f".sheet{i // per}.txt"
        listfile.write_text("".join(f"file '{p.resolve()}'\n" for _, p in chunk))
        dest = work / f"sheet_{i // per + 1:02d}.jpg"
        run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(listfile),
             "-vf", f"scale=320:-2,tile={cols}x{rows}:padding=4:color=black", "-frames:v", "1",
             "-q:v", "3", str(dest)])
        listfile.unlink()
        sheets.append((chunk[0][0], chunk[-1][0], dest))
    return sheets


def label_frame(src, t, dest):
    """Thumbnail with a burned-in timestamp so every tile is self-identifying."""
    label = ts(t).replace(":", r"\:")
    run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-vf",
         f"scale=320:-2,drawtext=text='{label}':x=6:y=6:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.8",
         "-q:v", "3", str(dest)])


# ---------------------------------------------------------------- watch

def cmd_watch(a):
    need("ffmpeg", "Install ffmpeg (brew install ffmpeg / apt install ffmpeg).")
    work, video, meta = acquire(a.src, Path(a.out), a.max_height)
    dur = duration(video)
    print(f"[watch] {meta.get('title')} ({ts(dur)}) -> {work}")

    transcript, how = get_transcript(work, video)
    if transcript:
        (work / "transcript.txt").write_text("\n".join(f"[{ts(s)}] {t}" for s, _, t in transcript))
        (work / "transcript.json").write_text(json.dumps(
            [{"start": round(s, 2), "end": round(e, 2), "text": t} for s, e, t in transcript], indent=1))
    print(f"[watch] transcript: {how if transcript else 'NONE - ' + str(how)}")

    scenes = scene_changes(video, a.scene) if a.scene > 0 else []
    times = pick_times(dur, a.max_frames, scenes)
    fdir = work / "frames"
    fdir.mkdir(exist_ok=True)
    for old in fdir.glob("*.jpg"):
        old.unlink()
    frames = []
    for t in times:
        full = fdir / f"t{int(t * 1000):08d}.jpg"
        grab(video, t, full, width=a.frame_width)
        thumb = fdir / f"t{int(t * 1000):08d}_thumb.jpg"
        label_frame(full, t, thumb)
        frames.append((t, thumb))
    for old in work.glob("sheet_*.jpg"):
        old.unlink()
    sheets = contact_sheets(frames, work)
    for _, p in frames:
        p.unlink()  # thumbs only needed for the sheets
    print(f"[watch] {len(times)} frames ({len(scenes)} scene cuts), {len(sheets)} contact sheets")

    write_timeline(work, meta, dur, times, scenes, transcript, how, sheets)
    print(f"[watch] READ NEXT: {work / 'timeline.md'}")


def write_timeline(work, meta, dur, times, scenes, transcript, how, sheets):
    L = [f"# {meta.get('title')}", ""]
    for k in ("channel", "upload_date", "view_count", "like_count", "webpage_url", "source_file"):
        if meta.get(k):
            L.append(f"- **{k}**: {meta[k]}")
    L += [f"- **duration**: {ts(dur)}", f"- **transcript source**: {how}",
          f"- **scene cuts** ({len(scenes)}): " + ", ".join(ts(s) for s in scenes[:80]), ""]
    if meta.get("chapters"):
        L += ["## Chapters", *[f"- {ts(c['start_time'])} {c['title']}" for c in meta["chapters"]], ""]
    if meta.get("description"):
        L += ["## Description", meta["description"][:1500], ""]
    L += ["## Contact sheets (open these to *see* the video)"]
    L += [f"- `{p.name}`: {ts(a)} - {ts(b)}" for a, b, p in sheets]
    L += ["", "Full-res stills: `frames/tMMMMMMMM.jpg` (milliseconds).", "",
          "## Timeline (frame time -> what was said up to the next frame)"]
    bounds = times + [dur]
    for i, t in enumerate(times):
        said = ""
        if transcript:
            said = " ".join(x for s, _, x in transcript if t <= s < bounds[i + 1]) or "..."
        L.append(f"- **{ts(t)}** `frames/t{int(t * 1000):08d}.jpg` - {said}")
    if not transcript:
        L += ["", "_No audio transcript. Read on-screen captions/text from the contact sheets._"]
    (work / "timeline.md").write_text("\n".join(L) + "\n")


# ---------------------------------------------------------------- frame / clip

def resolve_video(src, out_root):
    if is_url(src):
        return acquire(src, out_root)[:2]
    p = Path(src)
    if not p.exists():
        die(f"no such file: {src}")
    work = out_root / slugify(p.stem)
    work.mkdir(parents=True, exist_ok=True)
    return work, p


def cmd_frame(a):
    need("ffmpeg", "Install ffmpeg.")
    work, video = resolve_video(a.src, Path(a.out))
    (work / "stills").mkdir(exist_ok=True)
    for t in a.at:
        sec = parse_time(t)
        dest = work / "stills" / f"still_{int(sec * 1000):08d}.png"
        grab(video, sec, dest)
        print(dest)


def cmd_clip(a):
    need("ffmpeg", "Install ffmpeg.")
    work, video = resolve_video(a.src, Path(a.out))
    start, end = parse_time(a.start), parse_time(a.end)
    if end <= start:
        die("--end must be after --start")
    (work / "clips").mkdir(exist_ok=True)
    name = a.name or f"clip_{ts(start).replace(':', '')}-{ts(end).replace(':', '')}"
    vf = []
    if a.vertical:
        vf.append("crop='min(iw,ih*9/16)':ih,scale=1080:1920")
    dest = work / "clips" / f"{name}.mp4"
    cmd = ["ffmpeg", "-y", "-v", "error", "-ss", f"{start:.3f}", "-i", str(video), "-t", f"{end - start:.3f}"]
    if vf:
        cmd += ["-vf", ",".join(vf)]
    cmd += ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-movflags", "+faststart", str(dest)]
    run(cmd)
    print(dest)
    if a.gif:
        gif = dest.with_suffix(".gif")
        run(["ffmpeg", "-y", "-v", "error", "-i", str(dest), "-vf",
             f"fps=12,scale={a.gif_width}:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse",
             str(gif)])
        print(gif)
    if a.audio:
        mp3 = dest.with_suffix(".mp3")
        run(["ffmpeg", "-y", "-v", "error", "-i", str(dest), "-vn", "-q:a", "2", str(mp3)])
        print(mp3)


# ---------------------------------------------------------------- ask (Gemini)

def cmd_ask(a):
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        die("set GEMINI_API_KEY (free key: https://aistudio.google.com/apikey)")
    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    if is_url(a.src):
        part = {"file_data": {"file_uri": a.src}}  # Gemini reads YouTube URLs natively
    else:
        data = Path(a.src).read_bytes()
        if len(data) > 19 * 1024 * 1024:
            die("local file >19MB: clip it first (yt.py clip) or pass a YouTube URL")
        part = {"inline_data": {"mime_type": "video/mp4", "data": base64.b64encode(data).decode()}}
    body = {"contents": [{"parts": [part, {"text": a.question}]}]}
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": key})
    try:
        resp = json.load(urllib.request.urlopen(req, timeout=600))
    except urllib.error.HTTPError as e:
        die(f"Gemini {e.code}: {e.read().decode()[:500]}")
    print("".join(p.get("text", "") for c in resp.get("candidates", [])
                  for p in c.get("content", {}).get("parts", [])))


# ---------------------------------------------------------------- main

def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--out", default=str(DEFAULT_OUT), help="output root (default: ./yt-watch)")
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("search"); s.add_argument("query"); s.add_argument("-n", type=int, default=8)
    s.set_defaults(fn=cmd_search)

    w = sub.add_parser("watch"); w.add_argument("src")
    w.add_argument("--max-frames", type=int, default=48, help="frame budget (default 48)")
    w.add_argument("--scene", type=float, default=0.3, help="scene-cut threshold, 0 disables")
    w.add_argument("--frame-width", type=int, default=1280)
    w.add_argument("--max-height", type=int, default=720)
    w.set_defaults(fn=cmd_watch)

    f = sub.add_parser("frame"); f.add_argument("src"); f.add_argument("--at", nargs="+", required=True)
    f.set_defaults(fn=cmd_frame)

    c = sub.add_parser("clip"); c.add_argument("src")
    c.add_argument("--start", required=True); c.add_argument("--end", required=True)
    c.add_argument("--name"); c.add_argument("--vertical", action="store_true", help="center-crop to 9:16 1080x1920")
    c.add_argument("--gif", action="store_true"); c.add_argument("--gif-width", type=int, default=480)
    c.add_argument("--audio", action="store_true", help="also export mp3")
    c.set_defaults(fn=cmd_clip)

    q = sub.add_parser("ask"); q.add_argument("src"); q.add_argument("question")
    q.set_defaults(fn=cmd_ask)

    a = p.parse_args()
    try:
        a.fn(a)
    except subprocess.CalledProcessError as e:
        die(f"{' '.join(map(str, e.cmd[:3]))}... failed:\n{(e.stderr or '')[-1500:]}")


if __name__ == "__main__":
    main()
