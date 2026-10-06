#!/usr/bin/env python3
"""clips.py - hunt, scan and render branded motivational clips for Aura Miami.

  hunt    find source videos (interviews, speeches, podcasts) per theme
  scan    read captions only (no video download) and rank quotable moments
  extract cut a moment: speaker framed 9:16, captions only (the default deliverable)
  render  branded variant (grade, hook, credit, watermark, end card) - only when asked
  themes  list themes and their seed searches

Builds on the youtube-watch skill (yt.py) for downloading/transcription.
Requires ffmpeg (with libass) and `pip install yt-dlp`.
"""
import argparse
import json
import math
import os
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
for cand in (HERE.parents[1] / "youtube-watch" / "scripts",
             Path.home() / ".claude/skills/youtube-watch/scripts"):
    if (cand / "yt.py").exists():
        sys.path.insert(0, str(cand))
        break
try:
    import yt  # noqa: E402  (youtube-watch skill)
except ImportError:
    sys.exit("error: needs the youtube-watch skill next to this one (.claude/skills/youtube-watch)")

OUT = Path(os.environ.get("AURA_CLIPS_DIR", "aura-clips"))
FONT_DIR = Path(os.environ.get("AURA_FONT_DIR", Path.home() / ".cache" / "aura-clips" / "fonts"))
# Brand palette: black and white only.
WHITE, SOFT, INK = "#FFFFFF", "#D2D2D2", "#0A0A0A"

# ------------------------------------------------------------------ themes
# Seed searches favor ORIGINAL long-form sources (interviews, speeches, podcasts):
# better quotes, cleaner audio, and not someone else's edit.
THEMES = {
    "mindset": {
        "queries": ["entrepreneur mindset interview full", "Naval Ravikant wealth mindset podcast",
                    "Alex Hormozi mindset interview", "Steve Jobs interview passion",
                    "Jay-Z interview business mindset"],
        "words": ["mindset", "discipline", "fear", "comfort", "risk", "build", "work", "focus",
                  "obsessed", "standard", "excuse", "decision", "habit", "consistent", "patience"],
    },
    "encouragement": {
        "queries": ["Denzel Washington speech dreams", "Will Smith motivation interview fear",
                    "Steve Harvey jump speech", "Kobe Bryant interview mentality",
                    "Les Brown speech dreams"],
        "words": ["dream", "keep going", "quit", "fail", "failure", "believe", "never give up",
                  "hard", "pain", "struggle", "worth it", "proud", "rise", "strong", "faith"],
    },
    "becoming-an-entrepreneur": {
        "queries": ["how I started my business interview founder", "Sara Blakely starting Spanx story",
                    "Daymond John start a business advice", "quit my job start business interview",
                    "Gary Vaynerchuk advice young entrepreneurs"],
        "words": ["start", "business", "job", "boss", "quit", "idea", "customer", "money", "freedom",
                  "own", "company", "founder", "bet on yourself", "nobody", "permission"],
    },
    "higher-self": {
        "queries": ["Jim Carrey speech higher self", "Joe Dispenza future self", "Eckhart Tolle presence talk",
                    "Alan Watts who you really are", "Wayne Dyer intention speech"],
        "words": ["self", "soul", "higher", "become", "identity", "version of you", "awareness",
                  "ego", "presence", "consciousness", "spirit", "inner", "truth", "purpose", "who you are"],
    },
    "do-what-you-love": {
        "queries": ["Steve Jobs Stanford commencement do what you love", "Jim Carrey commencement speech",
                    "Alan Watts what if money was no object", "Oprah purpose speech",
                    "Denzel Washington commencement speech"],
        "words": ["love", "passion", "happy", "happiness", "joy", "purpose", "meaning", "calling",
                  "heart", "money was no object", "life", "fulfilled", "settle", "regret", "alive"],
    },
    "meditation": {
        "queries": ["meditation explained interview stillness", "Eckhart Tolle stillness",
                    "Naval Ravikant meditation", "Joe Dispenza meditation explained",
                    "Ram Dass be here now talk"],
        "words": ["breath", "breathe", "still", "stillness", "silence", "present", "now", "mind",
                  "thoughts", "peace", "calm", "observe", "meditate", "meditation", "awareness"],
    },
    "abundance": {
        "queries": ["Bob Proctor abundance mindset", "Wayne Dyer abundance", "Tony Robbins abundance",
                    "Rev Ike money mindset", "Neville Goddard assumption lecture"],
        "words": ["abundance", "wealth", "money", "receive", "deserve", "worthy", "gratitude",
                  "grateful", "scarcity", "attract", "rich", "prosper", "flow", "enough", "give"],
    },
    "manifestation": {
        "queries": ["Neville Goddard imagination creates reality", "Jim Carrey manifestation check story",
                    "Joe Dispenza manifest", "Denzel Washington visualize",
                    "Muhammad Ali interview believe"],
        "words": ["manifest", "visualize", "imagine", "imagination", "believe", "feel it",
                  "already", "universe", "energy", "vibration", "assume", "law of attraction",
                  "see it", "speak it", "become"],
    },
}

# Generic signals of a clip that stops the scroll and earns a save/share
HOOKS = ["most people", "the truth is", "here's the thing", "the reason", "nobody", "if you",
         "i want you", "listen", "the secret", "let me tell you", "the problem is", "you have to",
         "you don't", "stop", "the difference", "what if", "one day", "remember", "everybody"]
POWER = ["you", "your", "never", "always", "everything", "nothing", "life", "dream", "fear",
         "free", "freedom", "believe", "purpose", "love", "become", "power", "energy", "universe",
         "success", "fail", "win", "work", "soul", "truth", "real"]
CONTRAST = ["not because", "but", "instead", "the difference", "rather than", "most people",
            "the ones who", "either", "until"]
NOISE = ["um", "uh", "you know what i mean", "sort of", "kind of"]
ADS = ["sponsor", "subscribe", "link in", "promo code", "patreon", "today's episode", "brought to you",
       "comment", "dm me", "my course", "my guide", "follow me"]  # someone else's CTA kills the clip
COMPILATION = ["compilation", "motivational video", "best motivational", "motivation 20",
               "speech compilation", "#shorts", "eye opening"]


def theme_list(names):
    if not names or names == ["all"]:
        return list(THEMES)
    bad = [n for n in names if n not in THEMES]
    if bad:
        yt.die(f"unknown theme(s) {bad}; choose from: {', '.join(THEMES)}")
    return names


# ------------------------------------------------------------------ hunt

def cmd_hunt(a):
    seen, rows = set(), []
    queries = [(t, q) for t in theme_list(a.theme) for q in THEMES[t]["queries"]]
    queries += [("custom", q) for q in a.query or []]
    for theme, q in queries:
        print(f"[hunt] {theme}: {q}", file=sys.stderr)
        try:
            out = yt.run(yt.ytdlp() + ["--flat-playlist", "-J", f"ytsearch{a.n}:{q}"]).stdout
        except subprocess.CalledProcessError as e:
            print(f"  search failed: {(e.stderr or '')[-200:]}", file=sys.stderr)
            continue
        for e in json.loads(out).get("entries", []):
            vid = e.get("id")
            dur = e.get("duration") or 0
            if not vid or vid in seen or not (a.min_minutes * 60 <= dur <= a.max_minutes * 60):
                continue
            seen.add(vid)
            title = (e.get("title") or "")
            views = e.get("view_count") or 0
            score = math.log10(views + 10)
            score -= 2.5 * any(c in title.lower() for c in COMPILATION)  # avoid re-cutting others' edits
            score += 0.5 * any(k in title.lower() for k in ("interview", "podcast", "speech", "commencement", "talk"))
            rows.append({"theme": theme, "score": round(score, 2), "title": title,
                         "channel": e.get("channel") or e.get("uploader"), "duration": yt.ts(dur),
                         "views": views, "url": f"https://www.youtube.com/watch?v={vid}"})
    rows.sort(key=lambda r: -r["score"])
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / "candidates.json"
    dest.write_text(json.dumps(rows, indent=1))
    for i, r in enumerate(rows[:a.top], 1):
        print(f"{i:2}. [{r['theme']}] {r['title']}\n    {r['channel']} | {r['duration']} | "
              f"{r['views']:,} views | score {r['score']}\n    {r['url']}")
    print(f"\n[hunt] {len(rows)} candidates -> {dest}", file=sys.stderr)


# ------------------------------------------------------------------ scan

def video_id(url):
    m = re.search(r"(?:v=|youtu\.be/|shorts/|embed/|live/)([\w-]{11})", url)
    return m.group(1) if m else yt.slugify(url)[-24:]


def fetch_captions(url):
    """Captions only - seconds per video, no video download. Returns (segments, title)."""
    vid = video_id(url)
    work = OUT / "sources" / vid
    work.mkdir(parents=True, exist_ok=True)
    meta_f = work / "meta.json"
    if not list(work.glob("subs*.vtt")):
        subprocess.run(yt.ytdlp() + ["--skip-download", "--write-subs", "--write-auto-subs",
                                     "--sub-langs", "en.*,en", "--sub-format", "vtt",
                                     "--write-info-json", "-o", str(work / "subs"), url],
                       capture_output=True, text=True)
        info = work / "subs.info.json"
        if info.exists():
            m = json.loads(info.read_text())
            meta_f.write_text(json.dumps({k: m.get(k) for k in ("id", "title", "channel", "duration",
                                                                "view_count", "webpage_url")}, indent=1))
            info.unlink()
    vtts = sorted(work.glob("subs*.vtt"), key=lambda p: (".en." not in p.name, "orig" in p.name))
    title = json.loads(meta_f.read_text()).get("title") if meta_f.exists() else vid
    if not vtts:
        return None, title
    return yt.parse_vtt(vtts[0].read_text(errors="ignore")), title


def load_segments(src):
    """URL -> captions; local transcript.json (from yt.py watch) -> segments."""
    if yt.is_url(src):
        return fetch_captions(src)
    p = Path(src)
    if p.is_dir():
        p = p / "transcript.json"
    if p.suffix == ".json" and p.exists():
        return [(s["start"], s["end"], s["text"]) for s in json.loads(p.read_text())], p.parent.name
    yt.die(f"{src}: pass a YouTube URL or a transcript.json from `yt.py watch`")


def render_source(src):
    """What `render` should be pointed at: the URL, or the video behind a transcript.json."""
    if yt.is_url(src):
        return src
    meta = Path(src if Path(src).is_dir() else Path(src).parent) / "meta.json"
    if meta.exists():
        m = json.loads(meta.read_text())
        return m.get("webpage_url") or m.get("source_file") or src
    return src


def count(text, terms):
    return sum(len(re.findall(r"\b" + re.escape(t) + r"\b", text)) for t in terms)


def score_window(text, words_theme):
    t = text.lower()
    n = max(len(t.split()), 1)
    head = " ".join(t.split()[:10])
    parts = {
        "theme": 2.0 * count(t, words_theme),
        "hook": 3.0 * (count(head, HOOKS) > 0) + 0.5 * count(t, HOOKS),
        "address": 12.0 * count(t, ["you", "your", "you're", "yourself"]) / n,
        "power": 6.0 * count(t, POWER) / n,
        "contrast": 0.8 * count(t, CONTRAST),
        "noise": -1.5 * count(t, NOISE),
        "ads": -8.0 * (count(t, ADS) > 0),
    }
    return sum(parts.values()), {k: round(v, 1) for k, v in parts.items() if v}


def cmd_scan(a):
    themes = theme_list(a.theme)
    words = sorted({w for t in themes for w in THEMES[t]["words"]})
    report = ["# Ranked moments", "",
              "Scores are a caption-only pre-filter. **Verify every pick by watching it** "
              "(`yt.py watch` on a clip, or `clips.py render --preview`) before posting.", ""]
    all_moments = []
    for src in a.src:
        segs, title = load_segments(src)
        print(f"[scan] {title}: {len(segs or [])} caption segments", file=sys.stderr)
        if not segs:
            report += [f"## {title}", "_No captions available. Run `yt.py watch` (Whisper/Gemini) "
                       "and scan its transcript.json instead._", ""]
            continue
        cands = []
        for i in range(len(segs)):
            text, j = [], i
            while j < len(segs) and segs[j][1] - segs[i][0] <= a.max:
                text.append(segs[j][2])
                if segs[j][1] - segs[i][0] >= a.min:
                    s, parts = score_window(" ".join(text), words)
                    # prefer windows that end on a pause (natural sentence end)
                    gap = segs[j + 1][0] - segs[j][1] if j + 1 < len(segs) else 1.0
                    s += min(gap, 1.0) * 1.5
                    cands.append((s, segs[i][0], segs[j][1], " ".join(text), parts))
                j += 1
        cands.sort(key=lambda c: -c[0])
        picked = []
        for c in cands:  # non-overlapping best windows
            if all(c[2] <= p[1] or c[1] >= p[2] for p in picked):
                picked.append(c)
            if len(picked) == a.top:
                break
        rsrc = render_source(src)
        tx = "" if yt.is_url(src) else f' --transcript "{Path(src) if Path(src).suffix else Path(src) / "transcript.json"}"'
        report += [f"## {title}", f"{rsrc}", ""]
        for k, (s, st, en, text, parts) in enumerate(picked, 1):
            all_moments.append({"source": rsrc, "title": title, "start": round(st, 2), "end": round(en, 2),
                                "score": round(s, 1), "text": text, "signals": parts})
            report += [f"### {k}. {yt.ts(st)}-{yt.ts(en)} ({en - st:.0f}s) | score {s:.1f} | {parts}",
                       f"> {text}", "",
                       f"`clips.py render \"{rsrc}\" --start {st:.1f} --end {en:.1f}{tx} --hook \"...\" --credit \"...\"`", ""]
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "moments.md").write_text("\n".join(report))
    (OUT / "moments.json").write_text(json.dumps(all_moments, indent=1))
    print("\n".join(report))
    print(f"[scan] -> {OUT / 'moments.md'}", file=sys.stderr)


# ------------------------------------------------------------------ fonts

FONTS = {  # family -> Google Fonts css2 query
    "Bebas Neue": "Bebas+Neue",
    "DM Sans": "DM+Sans:wght@700",
    "Cormorant Garamond": "Cormorant+Garamond:ital,wght@1,500",
    "Archivo Black": "Archivo+Black",  # heavy wide sans, closest match to the AURA wordmark
}


def ensure_fonts():
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    for fam, q in FONTS.items():
        dest = FONT_DIR / (fam.replace(" ", "") + ".ttf")
        if dest.exists():
            continue
        try:  # an old UA makes the css API hand back plain TTF urls
            css = urllib.request.urlopen(urllib.request.Request(
                f"https://fonts.googleapis.com/css2?family={q}", headers={"User-Agent": "Mozilla/4.0"}),
                timeout=30).read().decode()
            url = re.search(r"url\((https://[^)]+\.ttf)\)", css).group(1)
            dest.write_bytes(urllib.request.urlopen(url, timeout=60).read())
        except Exception as e:
            print(f"[fonts] couldn't fetch {fam} ({e}); falling back to a system font", file=sys.stderr)
    return FONT_DIR


# ------------------------------------------------------------------ render

def ass_color(hex_rgb, alpha=0):
    h = hex_rgb.lstrip("#")
    return f"&H{alpha:02X}{h[4:6]}{h[2:4]}{h[0:2]}"


def ass_time(t):
    t = max(0.0, t)
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


def ass_escape(s):
    return s.replace("\\", "").replace("{", "(").replace("}", ")").replace("\n", " ")


def chunk_captions(segs, n_words=4):
    """Split segments into short 2-4 word captions, timed by character share."""
    out = []
    for st, en, text in segs:
        words = text.split()
        if not words:
            continue
        groups = [words[i:i + n_words] for i in range(0, len(words), n_words)]
        total = sum(len(" ".join(g)) for g in groups) or 1
        t = st
        for g in groups:
            d = (en - st) * len(" ".join(g)) / total
            out.append((t, t + d, " ".join(g)))
            t += d
    return out


def build_ass(dur, layout, hook, credit, caps, handle, endcard, tagline, text_marks=True):
    W, H = 1080, 1920
    styles = [
        # name, font, size, colour, bold, italic, outline, shadow, alignment
        ("Hook", "Bebas Neue", 104, WHITE, 0, 0, 0, 0, 8),
        ("Cap", "DM Sans", 66, SOFT, 1, 0, 4, 1, 2),
        ("Credit", "Cormorant Garamond", 52, WHITE, 0, 1, 0, 0, 8),
        ("Mark", "Archivo Black", 40, WHITE, 0, 0, 0, 0, 3),
        ("End", "Archivo Black", 190, WHITE, 0, 0, 0, 0, 5),
        ("Tag", "Cormorant Garamond", 64, WHITE, 0, 1, 0, 0, 5),
        ("Handle", "DM Sans", 40, SOFT, 0, 0, 0, 0, 5),
    ]
    L = ["[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}", "WrapStyle: 0", "",
         "[V4+ Styles]",
         "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, "
         "Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, "
         "Shadow, Alignment, MarginL, MarginR, MarginV, Encoding"]
    for name, font, size, col, b, i, o, sh, al in styles:
        L.append(f"Style: {name},{font},{size},{ass_color(col)},{ass_color(col)},{ass_color('#000000')},"
                 f"{ass_color('#000000', 0x80)},{-1 if b else 0},{-1 if i else 0},0,0,100,100,"
                 f"{2 if name == 'Hook' else 0},0,1,{o},{sh},{al},90,90,0,1")
    L += ["", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]

    def ev(style, st, en, text, tags=""):
        L.append(f"Dialogue: 0,{ass_time(st)},{ass_time(en)},{style},,0,0,0,,{tags}{text}")

    if layout == "frame":   # 16:9 video sits in the middle band of a black canvas
        vid_h = round(W * 9 / 16)
        top = (H - vid_h) // 2 - 60
        hook_y, cap_y, credit_y = top - 330, top + vid_h + 70, top + vid_h + 260
        cap_align_tag = f"\\an8\\pos({W // 2},{cap_y})"
    else:                   # full-bleed vertical
        hook_y, credit_y = 230, 1540
        cap_align_tag = f"\\an2\\pos({W // 2},1480)"
    if hook:
        ev("Hook", 0, dur, ass_escape(hook.upper()), f"{{\\an8\\pos({W // 2},{hook_y})\\fad(250,0)}}")
    for st, en, text in caps:
        if st >= dur:
            break
        words = []
        for w in ass_escape(text).split():  # power words in pure white, the rest soft grey
            core = re.sub(r"[^\w']", "", w).lower()
            words.append(f"{{\\c{ass_color(WHITE)}}}{w}{{\\c{ass_color(SOFT)}}}" if core in POWER and core not in ("you", "your") else w)
        ev("Cap", st, min(en, dur), " ".join(words), f"{{{cap_align_tag}}}")
    if credit:
        ev("Credit", 0, dur, "— " + ass_escape(credit), f"{{\\alpha&H30&\\an8\\pos({W // 2},{credit_y})}}")
    if text_marks:
        ev("Mark", 0, dur, "AURA", f"{{\\alpha&H80&\\an3\\pos({W - 60},{H - 90})}}")
    if endcard:
        e0, e1 = dur, dur + endcard
        if text_marks:
            ev("End", e0, e1, "AURA", f"{{\\fad(300,0)\\an5\\pos({W // 2},{H // 2 - 60})}}")
        ev("Tag", e0 + 0.2, e1, ass_escape(tagline), f"{{\\fad(300,0)\\an5\\pos({W // 2},{H // 2 + 110})}}")
        if handle:
            ev("Handle", e0 + 0.4, e1, ass_escape(handle), f"{{\\fad(300,0)\\an5\\pos({W // 2},{H // 2 + 200})}}")
    return "\n".join(L) + "\n"


# AURA MONO: true black-and-white, deep blacks, crisp contrast, soft edge vignette
AURA_MONO = "hue=s=0,eq=contrast=1.28:brightness=-0.03:gamma=0.94,vignette=angle=PI/5"
# --color keeps natural color, muted, for footage that dies in mono
AURA_MUTED = "eq=contrast=1.15:brightness=-0.03:saturation=0.55:gamma=0.95,vignette=angle=PI/5"


def cut_segment(src, start, end, work, name):
    """Return a local mp4 of exactly [start, end]. URLs download only that section."""
    dur = end - start
    raw = work / f".{name}.src.mp4"
    if yt.is_url(src):
        fmt = ["-f", "bv*[height<=1080]+ba/b[height<=1080]/b", "--merge-output-format", "mp4",
               "-o", str(raw), "--force-overwrites", src]
        # 1st try: only the section (fast). It streams through ffmpeg, which YouTube sometimes refuses,
        # so 2nd try: yt-dlp's own downloader for the whole video, then cut locally.
        p = subprocess.run(yt.ytdlp() + ["--download-sections", f"*{start:.2f}-{end:.2f}",
                                         "--force-keyframes-at-cuts"] + fmt, capture_output=True, text=True)
        if p.returncode == 0 and raw.exists():
            src_video, cut_ss = raw, 0.0
        else:
            print("[extract] section download refused; downloading the full video instead", file=sys.stderr)
            p2 = subprocess.run(yt.ytdlp() + fmt, capture_output=True, text=True)
            if p2.returncode != 0 or not raw.exists():
                out = p.stdout + p.stderr + p2.stdout + p2.stderr
                yt.die("YouTube download failed.\n" + (yt.explain_ytdlp_error(out) or out[-800:]) +
                       "\nFallback that always works: upload the video file and run extract on that file.")
            src_video, cut_ss = raw, start
    else:
        src_video, cut_ss = Path(src), start
    clip = work / f".{name}.cut.mp4"
    yt.run(["ffmpeg", "-y", "-v", "error", "-ss", f"{cut_ss:.3f}", "-i", str(src_video), "-t", f"{dur:.3f}",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-c:a", "aac", str(clip)])
    raw.unlink(missing_ok=True)
    return clip


def clip_captions(clip, src, start, end, transcript, work):
    """Short caption chunks timed to the clip. Order: given transcript, Whisper, Gemini, YouTube captions."""
    segs, how = None, ""
    if transcript:
        segs = [(s["start"] - start, s["end"] - start, s["text"]) for s in json.loads(Path(transcript).read_text())
                if s["end"] > start and s["start"] < end]
        how = "transcript.json"
    if segs is None:  # transcribe the clip itself: exact timing, punctuation
        segs, how = yt.whisper_transcribe(clip, work)
        if segs is None:
            segs, how = yt.gemini_transcribe(clip, work)
    if segs is None and yt.is_url(src):
        full, _ = fetch_captions(src)
        segs = [(s - start, e - start, t) for s, e, t in (full or []) if e > start and s < end] or None
        how = "youtube captions"
    return chunk_captions([(max(s, 0), max(e, 0), t) for s, e, t in segs or []], n_words=3), how


def cmd_render(a):
    yt.need("ffmpeg", "Install ffmpeg (with libass).")
    start, end = yt.parse_time(a.start), yt.parse_time(a.end)
    if end <= start:
        yt.die("--end must be after --start")
    dur = end - start
    name = a.name or f"{yt.slugify(a.credit or 'clip', 24)}-{int(start)}-{int(end)}"
    work = OUT / "renders"
    work.mkdir(parents=True, exist_ok=True)

    clip = cut_segment(a.src, start, end, work, name)
    caps, how = ([], "off") if a.no_captions else clip_captions(clip, a.src, start, end, a.transcript, work)
    if not a.no_captions and not caps:
        print(f"[render] no captions ({how}); rendering without", file=sys.stderr)

    # 3) layout + grade + text
    w, h = map(int, yt.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                            "stream=width,height", "-of", "csv=p=0", str(clip)]).stdout.strip().split(","))
    layout = a.layout if a.layout != "auto" else ("frame" if w / h >= 1.1 else "fill")
    grade = AURA_MUTED if a.color else AURA_MONO
    if layout == "frame":
        vid_h = round(1080 * 9 / 16)
        y = (1920 - vid_h) // 2 - 60
        vf = (f"[0:v]{grade},scale=1080:{vid_h}:force_original_aspect_ratio=increase,crop=1080:{vid_h},"
              f"setsar=1[v];color=c=0x0A0A0A:s=1080x1920:r=30:d={dur:.3f}[bg];[bg][v]overlay=0:{y}:shortest=1")
    else:
        vf = f"[0:v]{grade},scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30"
    endcard = 0 if a.no_endcard else a.endcard
    if endcard:
        vf += f",tpad=stop_mode=add:stop_duration={endcard}:color=0x0A0A0A"
    logo = a.logo or os.environ.get("AURA_LOGO")
    if logo and not Path(logo).exists():
        yt.die(f"logo not found: {logo}")
    ass = work / f".{name}.ass"
    ass.write_text(build_ass(dur, layout, a.hook, a.credit, caps, a.handle, endcard, a.tagline, text_marks=not logo))
    fonts = ensure_fonts()
    vf += f",ass='{ass}':fontsdir='{fonts}'"
    inputs = ["-i", str(clip)]
    if logo:  # real wordmark PNG (transparent, white): small watermark + big end-card mark
        inputs += ["-loop", "1", "-i", str(logo)]
        vf += ("[t];[1:v]format=rgba,split[l1][l2];[l1]scale=170:-1,colorchannelmixer=aa=0.5[wm];"
               "[l2]scale=620:-1[big];[t][wm]overlay=W-w-60:H-h-80:shortest=1[t2];"
               f"[t2][big]overlay=(W-w)/2:(H-h)/2-110:enable='gte(t,{dur:.3f})':shortest=1")
    vf += "[out]"
    dest = work / f"{name}.mp4"
    total = dur + endcard
    af = f"afade=t=out:st={max(dur - 0.4, 0):.2f}:d=0.4,apad=whole_dur={total:.3f}"
    yt.run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", vf, "-map", "[out]", "-map", "0:a?",
            "-af", af, "-t", f"{total:.3f}", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(dest)])
    clip.unlink()
    if not a.keep_ass:
        ass.unlink()
    print(f"[render] {layout} layout, captions: {how}, {total:.1f}s", file=sys.stderr)
    print(dest)
    if a.preview:
        sheet = dest.with_suffix(".preview.jpg")
        yt.run(["ffmpeg", "-y", "-v", "error", "-i", str(dest), "-vf",
                f"fps={6 / total:.4f},scale=270:-2,tile=6x1:padding=6", "-frames:v", "1", str(sheet)])
        print(sheet)


# ------------------------------------------------------------------ extract (clean)

def face_track(clip, dur, w, h, crop_w):
    """Crop x per shot so the speaker's face stays centered. Falls back to center."""
    center = (w - crop_w) / 2
    try:
        import cv2
        cv2.CascadeClassifier  # removed in OpenCV 5
    except (ImportError, AttributeError):
        print("[extract] needs pip install 'opencv-python-headless<5' for face tracking; using center crop",
              file=sys.stderr)
        return [(0.0, center)]
    # alt2 handles close-ups, beards and caps best; the others catch what it misses
    dets = [cv2.CascadeClassifier(cv2.data.haarcascades + f) for f in (
        "haarcascade_frontalface_alt2.xml", "haarcascade_frontalface_default.xml", "haarcascade_profileface.xml")]
    cuts = [0.0]
    for t in yt.scene_changes(clip, 0.15):  # sensitive, but ignore sub-second flickers
        if t - cuts[-1] >= 1.0 and t < dur - 0.5:
            cuts.append(t)
    cuts.append(dur)
    cap = cv2.VideoCapture(str(clip))
    plan = []
    for a, b in zip(cuts, cuts[1:]):
        xs, t = [], a + 0.15
        while t < b:
            cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
            ok, frame = cap.read()
            if ok:
                scale = 640 / frame.shape[1]
                small = cv2.cvtColor(cv2.resize(frame, None, fx=scale, fy=scale), cv2.COLOR_BGR2GRAY)
                faces = []
                for i, det in enumerate(dets):
                    faces = list(det.detectMultiScale(small, 1.1, 4, minSize=(30, 30)))
                    if not faces and i == 2:  # profile cascade only sees left-facing; try mirrored
                        mirrored = det.detectMultiScale(cv2.flip(small, 1), 1.1, 4, minSize=(30, 30))
                        faces = [(small.shape[1] - x - fw, y, fw, fh) for x, y, fw, fh in mirrored]
                    if faces:
                        break
                if faces:
                    fx, fy, fw, fh = max(faces, key=lambda f: f[2] * f[3])  # biggest face = speaker
                    xs.append((fx + fw / 2) / scale)
            t += max((b - a) / 12, 0.25)
        x = sorted(xs)[len(xs) // 2] - crop_w / 2 if xs else (plan[-1][1] if plan else center)
        plan.append((a, min(max(x, 0), w - crop_w)))
    cap.release()
    return plan


def cmd_extract(a):
    """The clip, the speaker clearly framed, captions only. Nothing else added."""
    yt.need("ffmpeg", "Install ffmpeg (with libass).")
    start, end = yt.parse_time(a.start), yt.parse_time(a.end)
    if end <= start:
        yt.die("--end must be after --start")
    dur = end - start
    name = a.name or f"clip-{int(start)}-{int(end)}"
    work = OUT / "extracts"
    work.mkdir(parents=True, exist_ok=True)
    clip = cut_segment(a.src, start, end, work, name)
    caps, how = ([], "off") if a.no_captions else clip_captions(clip, a.src, start, end, a.transcript, work)

    w, h = map(int, yt.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                            "stream=width,height", "-of", "csv=p=0", str(clip)]).stdout.strip().split(","))
    if a.frame == "vertical" and w / h > 9 / 16 + 0.01:
        crop_w = int(h * 9 / 16) // 2 * 2
        plan = face_track(clip, dur, w, h, crop_w)
        x = str(int(plan[-1][1]))
        for i in range(len(plan) - 2, -1, -1):  # piecewise x: one framing per shot
            x = f"if(lt(t,{plan[i + 1][0]:.3f}),{int(plan[i][1])},{x})"
        vf = f"crop={crop_w}:{h}:'{x}':0,scale=1080:1920:flags=lanczos,setsar=1"
        W, H = 1080, 1920
        framing = f"vertical, face-tracked over {len(plan)} shot(s)"
    else:
        vf, W, H, framing = "setsar=1", w, h, "original frame"
    if caps:
        ass = work / f".{name}.ass"
        size = round(H * 0.036) if H > W else round(H * 0.06)
        L = ["[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}", "WrapStyle: 0", "",
             "[V4+ Styles]",
             "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, "
             "Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
             "Alignment, MarginL, MarginR, MarginV, Encoding",
             f"Style: Cap,DM Sans,{size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,"
             f"{max(size // 14, 3)},1,2,{W // 12},{W // 12},{round(H * 0.22)},1", "",
             "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        L += [f"Dialogue: 0,{ass_time(st)},{ass_time(min(en, dur))},Cap,,0,0,0,,{ass_escape(t)}"
              for st, en, t in caps if st < dur]
        ass.write_text("\n".join(L) + "\n")
        vf += f",ass='{ass}':fontsdir='{ensure_fonts()}'"
    dest = work / f"{name}.mp4"
    yt.run(["ffmpeg", "-y", "-v", "error", "-i", str(clip), "-vf", vf, "-c:v", "libx264", "-preset", "medium",
            "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(dest)])
    clip.unlink()
    if caps:
        ass.unlink()
    print(f"[extract] {framing}, captions: {how if caps else 'none (' + how + ')'}, {dur:.1f}s", file=sys.stderr)
    print(dest)
    if a.preview:
        sheet = dest.with_suffix(".preview.jpg")
        yt.run(["ffmpeg", "-y", "-v", "error", "-i", str(dest), "-vf",
                f"fps={5 / dur:.4f},scale=270:-2,tile=5x1:padding=6", "-frames:v", "1", str(sheet)])
        print(sheet)


def cmd_themes(_):
    for t, d in THEMES.items():
        print(f"{t}\n  searches: " + " | ".join(d["queries"]))


def main():
    global OUT
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--out", default=str(OUT))
    sub = p.add_subparsers(dest="cmd", required=True)

    h = sub.add_parser("hunt"); h.add_argument("--theme", nargs="*", default=["all"])
    h.add_argument("--query", nargs="*", help="extra searches, e.g. a specific speaker")
    h.add_argument("-n", type=int, default=6, help="results per search")
    h.add_argument("--top", type=int, default=25)
    h.add_argument("--min-minutes", type=float, default=2); h.add_argument("--max-minutes", type=float, default=180)
    h.set_defaults(fn=cmd_hunt)

    s = sub.add_parser("scan"); s.add_argument("src", nargs="+", help="YouTube URLs or transcript.json files")
    s.add_argument("--theme", nargs="*", default=["all"]); s.add_argument("--top", type=int, default=6)
    s.add_argument("--min", type=float, default=15); s.add_argument("--max", type=float, default=45)
    s.set_defaults(fn=cmd_scan)

    r = sub.add_parser("render"); r.add_argument("src")
    r.add_argument("--start", required=True); r.add_argument("--end", required=True)
    r.add_argument("--hook", help="on-screen title, e.g. 'THEY WON'T GET IT UNTIL IT'S DONE'")
    r.add_argument("--credit", help="speaker name, shown on screen (always credit)")
    r.add_argument("--handle", default=os.environ.get("AURA_HANDLE", "@aura.miamii"))
    r.add_argument("--tagline", default="Keep dreaming.")
    r.add_argument("--logo", help="transparent white AURA wordmark PNG (or set AURA_LOGO); default is a type mark")
    r.add_argument("--color", action="store_true", help="muted color instead of the default black-and-white grade")
    r.add_argument("--layout", choices=["auto", "frame", "fill"], default="auto")
    r.add_argument("--transcript", help="transcript.json covering the source (absolute times)")
    r.add_argument("--no-captions", action="store_true")
    r.add_argument("--endcard", type=float, default=1.6); r.add_argument("--no-endcard", action="store_true")
    r.add_argument("--name"); r.add_argument("--preview", action="store_true", help="also write a 6-frame preview strip")
    r.add_argument("--keep-ass", action="store_true")
    r.set_defaults(fn=cmd_render)

    x = sub.add_parser("extract", help="clean clip: speaker framed, captions only, nothing else added")
    x.add_argument("src"); x.add_argument("--start", required=True); x.add_argument("--end", required=True)
    x.add_argument("--frame", choices=["vertical", "original"], default="vertical",
                   help="vertical = 9:16 crop that follows the speaker's face (default); original = source framing")
    x.add_argument("--transcript"); x.add_argument("--no-captions", action="store_true")
    x.add_argument("--name"); x.add_argument("--preview", action="store_true")
    x.set_defaults(fn=cmd_extract)

    t = sub.add_parser("themes"); t.set_defaults(fn=cmd_themes)

    a = p.parse_args()
    OUT = Path(a.out)
    try:
        a.fn(a)
    except subprocess.CalledProcessError as e:
        yt.die(f"{' '.join(map(str, e.cmd[:3]))}... failed:\n{(e.stderr or '')[-1500:]}")


if __name__ == "__main__":
    main()
