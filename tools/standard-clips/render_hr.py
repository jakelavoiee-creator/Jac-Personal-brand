#!/usr/bin/env python3
"""AURA "moment" reels - the locked AURA template (modelled on @hustlersrevivalofficial).

  one famous moment, ~12-25s, one truth
  canvas    black 9:16, the 16:9 clip untouched (original colour) across the middle
  open      the eye opens from the middle out ("intro": "fade" on a reel for the old fade-up)
  captions  one word at a time in one column on the side away from the face ("caption_side" to force);
            small serif buildup, key words big in bold grotesk
  type      condensed Times New Roman italic (buildup words) + Akzidenz-Grotesk bold caps (impact words,
            punchline) - see brandfonts.py; end card locked
  punchline the key line as big stacked caps, right-aligned
  mark      AURA logo, solid white, bottom-centre on the footage, every frame (not on the end card)
  end       TOO CREATIVE(TM) / FOR NINE TO FIVE, centred in the footage area, AURA mark beneath

    python3 render_hr.py moments.json [id ...]          # 4K (2160x3840) by default
    python3 render_hr.py moments.json --hd [id ...]     # 1080x1920

Punchline markup: lines separated by "/" ([ ] around a letter is accepted and ignored),
e.g. "HOW HIGH / [I] CAN FLY". Optional per-moment "punch_align": "right" (default) | "center".
"""
import html
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render as v1  # noqa: E402
import brandfonts as bf  # noqa: E402
import reels  # noqa: E402

HERE = Path(__file__).resolve().parent
FONTS = HERE / "assets" / "fonts"
BEBAS = FONTS / "BebasNeue-Regular.ttf"   # (previous caption face)
SERIF, GROTESK, SERIF_SCALE = bf.SERIF, bf.GROTESK, bf.SERIF_SCALE   # captions + punchline
COND = FONTS / "Oswald-Bold.ttf"          # end card (locked)
FPS, END_LEN, FADE_IN = 30, 2.2, 0.35
CAP_SIZE = 120                           # captions: Bebas Neue Regular, one word at a time
# impact sizing: the buildup words stay smaller, the words that land the sentence go big
SIZE_SMALL, SIZE_MID, SIZE_BIG = 58, 70, 124    # small serif italic buildup / serif / big grotesk caps key words
FILLER = set("""a an the and or but so if of to in on at by for with from as is are was were be been being am
i you he she it we they me him her us them my your his its our their this that these those there here
do does did have has had will would can could should shall may might must just like um uh yeah okay oh
what when where who how which then than also very really because about into out up down over not no
i'm you're it's that's don't i've you've we're they're there's let's gonna wanna gotta""".split())
IMPACT = set("""never always everything nothing impossible god dream dreams fail failure fear love truth purpose
believe faith greatness discipline success successful happiness pain freedom""".split())

S = 2                                    # 2 = 4K (2160x3840), 1 = 1080x1920
W, H = 1080 * S, 1920 * S
FOOT_H = W * 9 // 16
FOOT_Y = (H - FOOT_H) // 2


def set_scale(s):
    global S, W, H, FOOT_H, FOOT_Y
    S, W, H = s, 1080 * s, 1920 * s
    FOOT_H = W * 9 // 16
    FOOT_Y = (H - FOOT_H) // 2


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, cwd=HERE)
    if r.returncode:
        raise RuntimeError(f"ffmpeg failed:\n{r.stderr[-1500:]}")


def stacked(d, lines, size, align, box_w, box_h, shadow=True):
    """Draw stacked Bebas Neue caps (draws on d)."""
    cond = goth = ImageFont.truetype(str(GROTESK), size)
    parsed = []
    for line in lines:
        parts = [(m.group(1), goth) if m.group(1) else (m.group(2), cond)
                 for m in re.finditer(r"\[([^\]])\]|([^\[]+)", line)]
        parsed.append((parts, sum(d.textlength(t, font=f) for t, f in parts)))
    cap = -cond.getbbox("H", anchor="ls")[1]
    gap = int(cap * 0.30)
    block = len(parsed) * cap + (len(parsed) - 1) * gap
    base = (box_h - block) // 2 + cap
    top, xs = base - cap, []
    for parts, width in parsed:
        x = (box_w - width - int(box_w * 0.07) if align == "right" else int(box_w * 0.07) if align == "left"
             else (box_w - width) / 2)
        xs += [x, x + width]
        for t, f in parts:
            if shadow:
                d.text((x + 2 * S, base + 3 * S), t, font=f, fill=(0, 0, 0, 140), anchor="ls")
            d.text((x, base), t, font=f, fill=(255, 255, 255, 255), anchor="ls")
            x += d.textlength(t, font=f)
        base += cap + gap
    return min(xs) / box_w, top / box_h, max(xs) / box_w, (top + block) / box_h


def punchline_png(markup, path, align="right"):
    im = Image.new("RGBA", (W, FOOT_H), (0, 0, 0, 0))
    lines = [l.strip() for l in markup.split("/")]
    box = stacked(ImageDraw.Draw(im), lines, 80 * S if align != "center" else 120 * S, align, W, FOOT_H)
    im.save(path)
    return box


def logo_mark(logo, width):
    mark = v1.tint_logo(logo, "white", width)
    mark.putalpha(mark.getchannel("A").point(lambda v: int(v * 0.7)))
    return mark


def watermark_png(path, logo):
    """AURA mark, solid white, bottom-centre on the footage - visible the whole reel."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if logo:
        mark = v1.tint_logo(logo, "white", WATERMARK_W * S)
        im.paste(mark, ((W - mark.width) // 2, FOOT_Y + FOOT_H - mark.height - 28 * S), mark)
    im.save(path)


def end_card(path, logo):
    """TOO CREATIVE(TM) / FOR NINE TO FIVE centred in the footage area, AURA mark beneath."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype(str(COND), 50 * S)
    cy = FOOT_Y + FOOT_H // 2
    l1, l2 = "TOO CREATIVE", "FOR NINE TO FIVE"
    d.text((W // 2, cy - 4 * S), l1, font=f, fill="white", anchor="ms")
    w1 = d.textlength(l1, font=f)
    tm = ImageFont.truetype(str(COND), 15 * S)
    d.text((W // 2 + w1 / 2 + 2 * S, cy - 40 * S), "TM", font=tm, fill="white", anchor="ls")
    d.text((W // 2, cy + 52 * S), l2, font=f, fill="white", anchor="ms")
    if logo:
        mark = logo_mark(logo, 64 * S)
        im.paste(mark, ((W - mark.width) // 2, FOOT_Y + FOOT_H - mark.height - 12 * S), mark)
    im.convert("RGB").save(path)


def word_size(text, punch_words):
    w = text.lower().strip("'’\".,!?")
    if w in punch_words or w in IMPACT:
        return SIZE_BIG
    if w in FILLER or len(w) <= 2:
        return SIZE_SMALL
    return SIZE_MID


def face_track(src, start, length, keep, fps=3):
    """Sample the source and find faces. Returns [(output_time, [(x0, y0, x1, y1) normalised, padded])]."""
    try:
        import cv2
        import numpy as np
    except ImportError:
        print("  note: pip install \"opencv-python-headless<5\" to keep captions off faces")
        return []
    casc = [cv2.CascadeClassifier(cv2.data.haarcascades + n) for n in
            ("haarcascade_frontalface_default.xml", "haarcascade_profileface.xml")]
    w, h = 480, 270
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-t", f"{length:.3f}", "-i", src,
                          "-vf", f"fps={fps},scale={w}:{h},format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
    track = []
    for i in range(len(raw) // (w * h)):
        g = np.frombuffer(raw[i * w * h:(i + 1) * w * h], np.uint8).reshape(h, w)
        g = cv2.equalizeHist(g)
        boxes = []
        for c in casc:
            for flip in (False, True):
                img = cv2.flip(g, 1) if flip else g
                for (x, y, bw, bh) in c.detectMultiScale(img, 1.1, 6, minSize=(h // 9, h // 9)):
                    if flip:
                        x = w - x - bw
                    # pad: hair above, chin below, a little either side
                    boxes.append((max(0, (x - .2 * bw) / w), max(0, (y - .35 * bh) / h),
                                  min(1, (x + 1.2 * bw) / w), min(1, (y + 1.3 * bh) / h)))
        track.append((v1.remap(i / fps, keep), boxes))
    return track


def faces_at(track, t0, t1):
    near = [b for t, bs in track if t0 - 0.4 <= t <= t1 + 0.4 for b in bs]
    if not near and track:
        t, bs = min(track, key=lambda x: abs(x[0] - (t0 + t1) / 2))
        near = bs if abs(t - (t0 + t1) / 2) < 1.5 else []
    return near


def overlap(a, b):
    return max(0, min(a[2], b[2]) - max(a[0], b[0])) * max(0, min(a[3], b[3]) - max(a[1], b[1]))


def place(text, size, faces, prev=None):
    """Pick a caption centre (normalised in the footage) that keeps the word off every face."""
    big = size >= SIZE_BIG * S
    f = ImageFont.truetype(str(GROTESK if big else SERIF), size)
    tw = f.getlength(text if big else text.lower()) * (1 if big else SERIF_SCALE) / W + 0.03
    th = size * 0.78 / FOOT_H + 0.03
    def box(cx, cy):
        return (cx - tw / 2, cy - th / 2, cx + tw / 2, cy + th / 2)
    cands = [(0.5, 0.80), (0.5, 0.20)]
    for fx0, fy0, fx1, fy1 in faces:
        cands += [(0.5, fy1 + th / 2 + 0.02), (0.5, fy0 - th / 2 - 0.02),
                  (fx0 / 2, 0.5), ((1 + fx1) / 2, 0.5), (fx0 / 2, 0.8), ((1 + fx1) / 2, 0.8)]
    def fits(c):
        x0, y0, x1, y1 = box(*c)
        return x0 >= 0.02 and x1 <= 0.98 and y0 >= 0.03 and y1 <= 0.90   # stay clear of the AURA mark
    cands = [c for c in cands if fits(c)] or [(0.5, 0.80)]
    if prev in cands and not any(overlap(box(*prev), fb) for fb in faces):
        return prev                                                         # don't jump around if it still fits
    return min(cands, key=lambda c: sum(overlap(box(*c), fb) for fb in faces))


def face(big):
    """Impact words: grotesk bold caps. Everything else: condensed Times italic, lowercase."""
    if big:
        return f"\\fn{bf.family(GROTESK)}\\i0\\b0"
    return f"\\fn{bf.family(SERIF)}\\i1\\b0\\fscx{int(SERIF_SCALE * 100)}"


def word(text, big):
    return text.upper() if big else text.lower()


def caption_side(track, forced=None):
    """One side for the whole reel - the side away from the speaker's face. Returns (side, x0, x1) in footage units."""
    boxes = [b for _, bs in track for b in bs]
    if forced in ("left", "right"):
        side = forced
    else:
        cx = sorted((b[0] + b[2]) / 2 for b in boxes)[len(boxes) // 2] if boxes else 0.5
        side = "right" if cx <= 0.5 else "left"
    if side == "right":
        edge = sorted(b[2] for b in boxes)[int(len(boxes) * 0.9)] if boxes else 0.55
        return side, min(max(edge + 0.02, 0.52), 0.70), 0.97
    edge = sorted(b[0] for b in boxes)[int(len(boxes) * 0.1)] if boxes else 0.45
    return side, 0.03, max(min(edge - 0.02, 0.48), 0.30)


def fitted(text, size, region):
    """Shrink a word until it fits the caption column."""
    big = size >= SIZE_BIG * S
    while size > 30 * S:
        f = ImageFont.truetype(str(GROTESK if big else SERIF), size)
        w = f.getlength(text if big else text.lower()) * (1 if big else SERIF_SCALE)
        if w <= (region[2] - region[1]) * W:
            break
        size = int(size * 0.92)
    return size


def write_ass(chunks, path, dur, hide_from, hide_len=2.0, punch_words=frozenset(), track=(), region=None):
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: S,{bf.family(GROTESK)},{CAP_SIZE * S},&H00FFFFFF,&H00FFFFFF,&H00000000,&H78000000,0,0,0,0,100,100,0,0,1,0,{3 * S},5,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev, prev, hits = [], None, []
    for k, c in enumerate(chunks):
        t0 = c["t0"]
        t1 = chunks[k + 1]["t0"] if k + 1 < len(chunks) else min(dur, c["t1"] + 0.4)
        t1 = min(t1, c["t1"] + 0.5, dur)
        if hide_from is not None:                 # the punchline takes over while it's on screen
            if hide_from - 0.05 <= t0 < hide_from + hide_len:
                continue
            if t0 < hide_from < t1:                   # a caption already up gives way when it lands
                t1 = hide_from
        if t1 > t0:
            size = word_size(c["text"], punch_words) * S
            big = size >= SIZE_BIG * S
            size = fitted(c["text"], size, region)
            cx, cy = (region[1] + region[2]) / 2, 0.5     # one fixed column, beside the speaker
            if big:
                hits.append(t0)                               # a click lands on every key word
            ev.append(f"Dialogue: 0,{v1.ass_time(t0)},{v1.ass_time(t1)},S,,0,0,0,,"
                      f"{{\\an5\\pos({int(cx * W)},{FOOT_Y + int(cy * FOOT_H)})\\fs{size}{face(big)}}}{word(c['text'], big)}")
    Path(path).write_text(head + "\n".join(ev) + "\n", encoding="utf-8")
    return hits


EYE_LEN = 0.8         # seconds for the eye to open
WATERMARK_W = 120     # AURA mark width (px at 1080 wide), bottom-centre on the footage
SFX_VOL = 0.8         # intro sound (assets/sfx_intro.m4a) under the speech
CLICK_VOL, CLICK_LEAD = 0.7, 0.10   # click (assets/sfx_click.mp3) on each key word; its snap is 0.10s in
RISER_VOL, RISER_LEN = 1.8, 1.88    # riser (assets/sfx_riser.mp3) builds over the end card and ends with it
RISER_DELAY_MS = max(0, int((END_LEN - RISER_LEN) * 1000))


def eye_frames(tmp):
    """The picture opens from a line through the middle, top and bottom only (RGBA, footage-sized), one PNG per frame."""
    import numpy as np
    n = int(EYE_LEN * FPS)
    w, h = W // 2, FOOT_H // 2                                  # drawn at half size, scaled up in ffmpeg
    xs = (np.arange(w) - w / 2) / (w / 2)                       # -1..1 across
    ys = np.abs(np.arange(h) - h / 2)[:, None]                  # distance from the centre line
    for i in range(n):
        o = 1 - (1 - i / n) ** 3                                # ease-out: quick start, soft landing
        half = np.full(w, o * (h / 2 + 2))                      # straight edges: opens top and bottom only
        alpha = np.clip(ys - half[None, :], 0, 1)
        rgba = np.zeros((h, w, 4), np.uint8)
        rgba[..., 3] = (alpha * 255).astype(np.uint8)
        Image.fromarray(rgba, "RGBA").save(tmp / f"eye_{i:03d}.png", compress_level=1)
    return n


FILLERS = {"um", "uh", "uhm", "erm", "hmm", "mm", "mhm", "mmhmm", "mm-hmm", "uh-huh", "ah", "oh"}
ACKS = FILLERS | {"yeah", "yes", "yep", "right", "okay", "ok", "sure", "wow", "exactly", "true", "totally", "no",
                  "absolutely", "interesting", "nice", "love", "it", "that", "huh", "really"}


def speaker_only(ws):
    """Captions for the speaker only: drop YouTube's '>>' speaker-change marks, filler sounds, and the
    other person's short interjections (a few 'yeah / mm / right' words between two speaker changes)."""
    import html
    turns, cur = [], []
    for w in ws:
        text = html.unescape(w["w"]).replace("[&nbsp;__&nbsp;]", "").replace("\u00a0", " ").strip()
        if text.startswith(">>"):
            if cur:
                turns.append(cur)
            cur, text = [], text[2:].strip()
        if text:
            cur.append({**w, "w": text})
    if cur:
        turns.append(cur)
    out = []
    for i, turn in enumerate(turns):
        bare = [re_word(x["w"]) for x in turn]
        if len(turns) > 1 and len(turn) <= 3 and all(b in ACKS for b in bare):
            continue                                       # someone else saying "yeah", "mm", "right"
        out += [x for x, b in zip(turn, bare) if b not in FILLERS]
    return out


def find_span(ws, first, last, after=0.0):
    """Start / end time of the stretch from the words `first` to the words `last` in the transcript."""
    toks = [re_word(html.unescape(w["w"]).replace("’", "'")) for w in ws]
    f, l = [re_word(x) for x in first.split()], [re_word(x) for x in last.split()]
    i = next((k for k in range(len(toks)) if ws[k]["t"] >= after - 0.05 and toks[k:k + len(f)] == f), None)
    j = next((k for k in range(i or 0, len(toks)) if toks[k:k + len(l)] == l), None) if i is not None else None
    if i is None or j is None:
        raise SystemExit(f"couldn't find \"{first}\" ... \"{last}\" in the transcript - check the 'find' words")
    return ws[i]["t"] - 0.15, ws[j + len(l) - 1]["end"] + 0.25


def re_word(t):
    return re.sub(r"[^a-z'-]", "", t.lower())


def build(m, base, tmp, logo):
    src, vtt = str(reels.clip(m, base)), str(base / m["vtt"])
    a, b, off = v1.secs(m["start"]), v1.secs(m["end"]), v1.secs(m.get("src_offset", 0))
    if m.get("find"):                                      # cut by words: "find": ["first words", "last words"]
        a, b = find_span(v1.vtt_words(vtt), *m["find"], a)
    ws = speaker_only([w for w in v1.vtt_words(vtt) if a - 0.05 <= w["t"] < b])
    keep = v1.keep_segments(src, a - off, b - a, [w["t"] - a for w in ws])
    words = [{"w": w["w"], "t": v1.remap(w["t"] - a, keep), "end": v1.remap(w["end"] - a, keep)} for w in ws]
    dur = sum(kb - ka for ka, kb in keep)
    # one word per caption, held until the next word starts (or briefly after the last one)
    chunks = [{"t0": w["t"], "t1": max(w["end"], w["t"] + 0.12), "text": w["w"].strip(" ,.;:\"“”").upper()} for w in words if w["w"].strip(" ,.;:\"“”")]
    p_at = None
    if m.get("punch_from") and m.get("show_punchline"):   # the stacked punchline overlay is off by default
        cue = m["punch_from"].lower()
        hit = [w["t"] for w in words if w["w"].lower().strip(",.!?") == cue and w["t"] >= dur * 0.3]
        p_at = hit[0] if hit else None
    p_len = float(m.get("punch_len", 2.0))       # the punchline is a beat, not a takeover
    ass_rel = f"build/hr_{m['id']}.ass"
    # the key word: the one marked [X] in the punchline (e.g. "THE [T]IMING OF") goes big and bold
    key = re.search(r"\[(\w)\]([\w'’]*)", m.get("punchline", ""))
    punch_words = {(key.group(1) + key.group(2)).lower()} if key else set()
    punch_words |= {w.lower() for w in m.get("emphasis", [])}      # optional per-moment override
    track = face_track(src, a - off, b - a, keep)
    region = caption_side(track, m.get("caption_side"))
    clicks = write_ass(chunks, HERE / ass_rel, dur, p_at, p_len, punch_words, track, region)
    punch, endc, mark = tmp / "punch.png", tmp / "end.png", tmp / "mark.png"
    pfaces = faces_at(track, p_at, p_at + p_len) if p_at is not None else []
    best = None
    for align in ([m["punch_align"]] if m.get("punch_align") else [region[0]]):   # same side as the captions
        box = punchline_png(m.get("punchline", ""), punch, align)
        hit = sum(overlap(box, fb) for fb in pfaces)
        if best is None or hit < best[0]:
            best = (hit, align)
        if hit == 0:
            break
    if best[1] != align:
        punchline_png(m.get("punchline", ""), punch, best[1])
    end_card(endc, None)                                   # end card: slogan only, no AURA mark
    watermark_png(mark, logo)
    sel = "+".join(f"between(t,{a - off + ka:.3f},{a - off + kb:.3f})" for ka, kb in keep)
    g = [f"[0:v]select='{sel}',setpts=N/FRAME_RATE/TB,fps={FPS},scale={W}:{FOOT_H}:flags=lanczos,setsar=1,"
         f"pad={W}:{H}:0:{FOOT_Y}:black,format=yuv420p[v0]",
         f"[v0]null[vm]",
         f"[vm]subtitles={ass_rel}:fontsdir=build/fonts[v1]"]
    if p_at is not None:
        g.append(f"[1:v]format=rgba,fade=t=in:st=0:d=0.1:alpha=1,setpts=PTS+{p_at:.3f}/TB[pp]")
        g.append(f"[v1][pp]overlay=0:{FOOT_Y}:enable='between(t,{p_at:.3f},{p_at + p_len:.3f})':eof_action=repeat[v2]")
    else:
        g.append("[v1]null[v2]")
    eye = m.get("intro", "eye") == "eye"
    mix = ["[ba0]"]
    if eye:                                                # intro sound lands with the opening
        g.append(f"[5:a]aresample=48000,aformat=channel_layouts=stereo,volume={SFX_VOL}[sfx]")
        mix.append("[sfx]")
    if clicks:                                             # a click on every key word (its snap is 0.10s in)
        g.append(f"[6:a]aresample=48000,aformat=channel_layouts=stereo,volume={CLICK_VOL},asplit={len(clicks)}"
                 + "".join(f"[ck{i}]" for i in range(len(clicks))))
        for i, t in enumerate(clicks):
            ms = max(0, int((t - CLICK_LEAD) * 1000))
            g.append(f"[ck{i}]adelay={ms}|{ms}[cd{i}]")
            mix.append(f"[cd{i}]")
    g.append("".join(mix) + (f"amix=inputs={len(mix)}:duration=first:normalize=0[ba]" if len(mix) > 1 else "anull[ba]"))
    if eye:                                                # eye opens from the middle out
        g += [f"[4:v]scale={W}:{FOOT_H},format=rgba[lids]",
              f"[v2][lids]overlay=0:{FOOT_Y}:eof_action=pass,trim=duration={dur:.3f}[bodyx]",
              f"[bodyx][3:v]overlay=0:0,format=yuv420p[body]"]                # AURA mark above the lids
    else:
        g += [f"[v2]trim=duration={dur:.3f},fade=t=in:st=0:d={FADE_IN}[bodyx]",
              f"[bodyx][3:v]overlay=0:0,format=yuv420p[body]"]
    g += [
          f"[0:a]aselect='{sel}',asetpts=N/SR/TB,aresample=48000,loudnorm=I=-14:TP=-1.5:LRA=9,"
          f"afade=t=in:d=0.2,afade=t=out:st={dur - 0.15:.3f}:d=0.15[ba0]",
          f"[2:v]format=yuv420p,fade=t=out:st={END_LEN - 0.35}:d=0.35,setsar=1[ev]",
          f"[7:a]aresample=48000,aformat=channel_layouts=stereo,volume={RISER_VOL},"      # riser peaks as the card ends
          f"adelay={RISER_DELAY_MS}|{RISER_DELAY_MS},apad,atrim=duration={END_LEN}[ea]",
          "[body][ba][ev][ea]concat=n=2:v=1:a=1[v][a]"]
    eye_frames(tmp)
    out = reels.DONE / f"{m['id']}.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    run(["ffmpeg", "-v", "error", "-y", "-i", src, "-loop", "1", "-t", f"{dur:.3f}", "-i", str(punch),
         "-loop", "1", "-t", str(END_LEN), "-framerate", str(FPS), "-i", str(endc),
         "-loop", "1", "-t", f"{dur:.3f}", "-i", str(mark),
         "-framerate", str(FPS), "-i", str(tmp / "eye_%03d.png"),
         "-i", str(HERE / "assets" / "sfx_intro.m4a"),
         "-i", str(HERE / "assets" / "sfx_click.mp3"),
         "-i", str(HERE / "assets" / "sfx_riser.mp3"),
         "-filter_complex", ";".join(g), "-map", "[v]", "-map", "[a]", "-r", str(FPS),
         "-c:v", "libx264", "-crf", "16" if S == 2 else "17", "-preset", "slow", "-pix_fmt", "yuv420p",
         "-movflags", "+faststart", "-c:a", "aac", "-b:a", "256k", str(out)])
    print(f"[moment] {out}  {W}x{H}, {dur:.1f}s + {END_LEN}s end card")


def main():
    args = [a for a in sys.argv[1:] if a not in ("--hd", "--redo")]
    if not args:
        sys.exit(__doc__)
    set_scale(1 if "--hd" in sys.argv else 2)
    plan_path = (Path.cwd() / args[0]).resolve()
    plan = json.loads(plan_path.read_text())
    logo = str(plan_path.parent / plan["logo"]) if plan.get("logo") else None
    (HERE / "build").mkdir(exist_ok=True)
    bf.ass_fonts_dir(HERE / "build")
    print(bf.describe())
    skip = reels.skipped()
    todo = [m for m in plan["moments"] if (not args[1:] and m["id"] not in skip) or m["id"] in args[1:]]
    failed = []
    for i, m in enumerate(todo, 1):
        m.setdefault("out_dir", plan.get("out_dir", "out/moments"))
        out = reels.DONE / f"{m['id']}.mp4"
        if not args[1:] and out.exists() and "--redo" not in sys.argv:
            print(f"[{i}/{len(todo)}] {m['id']} already rendered - skipping (--redo to render again)")
            continue
        print(f"[{i}/{len(todo)}] {m['id']}")
        try:
            build(m, plan_path.parent, Path(tempfile.mkdtemp()), logo)
        except Exception as e:     # one bad clip shouldn't stop the batch
            failed.append(m["id"])
            print(f"  FAILED: {str(e).strip().splitlines()[-1] if str(e).strip() else e!r}")
    if failed:
        print("\nFailed (fix, then run again - finished reels are skipped):\n  " + "\n  ".join(failed))


if __name__ == "__main__":
    main()
