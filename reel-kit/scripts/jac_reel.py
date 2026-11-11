#!/usr/bin/env python3
"""Jac signature reel renderer: captions + SFX + intro + outro on a raw talking video.

Usage:
  python3 scripts/jac_reel.py RAW.mp4 words.json plan.json OUT.mp4

words.json: [{"w","s","e"}] word timestamps (faster-whisper).
plan.json:  {"phrases": [{"i":[first,last], "hero":[idx,...], "slot": optional int}],
             "felt": word_index (riser lands here, Charge sparkle), "outro_hold": 1.4}

Signature (SIGNATURE.md): Inter Black main words + Instrument Serif Italic hero word,
words blur in one by one, blocks land scattered (never over the face band), hero glows cream.
SFX: Camera Flash (intro), Click (phrase), FOCUS (hero), Riser -> Charge (felt line),
Jolt Build Up (outro). Everything is a starting value.
"""
import json, math, subprocess, sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1080, 1920, 30
KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SANS = "/usr/share/fonts/opentype/inter/Inter-Black.otf"
SERIF = os.path.join(KIT, "assets/fonts/instrumentserif/InstrumentSerif-Italic.ttf")
SFX = os.path.join(KIT, "assets/sfx/jac")
SANS_PX, SERIF_PX = 66, 150
WHITE, CREAM = (255, 255, 255), (255, 236, 200)
ENTER = 0.20      # blur-in seconds per word
MAX_W = 820       # block width limit (keeps right 12% clear)
# Scatter slots: (x anchor, y top, align). Upper band = above the head, lower band = chest.
SLOTS = [(90, 150, "l"), (990, 1180, "r"), (540, 230, "c"), (90, 1230, "l"),
         (990, 170, "r"), (540, 1160, "c"), (120, 280, "l"), (960, 1260, "r")]

def ease(t): t = min(max(t, 0), 1); return t * t * (3 - 2 * t)

sans = ImageFont.truetype(SANS, SANS_PX)
serif = ImageFont.truetype(SERIF, SERIF_PX)

def sprite(text, font, color, glow):
    """Word sprite with soft glow (light = soul). Returns RGBA np array."""
    l, t, r, b = font.getbbox(text)
    pad = 40
    im = Image.new("RGBA", (r - l + pad * 2, b - t + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(im); d.text((pad - l, pad - t), text, font=font, fill=color + (255,))
    g = im.filter(ImageFilter.GaussianBlur(glow))
    ga = np.array(g).astype(np.float32); ga[..., 3] *= 0.85
    sh = im.filter(ImageFilter.GaussianBlur(6)); sa = np.array(sh).astype(np.float32)
    sa[..., :3] = 0; sa[..., 3] *= 0.55   # dark shadow for legibility
    base = np.array(im).astype(np.float32)
    out = over(over(sa, ga), base)
    return out, pad

def over(a, b):
    """b over a, straight alpha float arrays."""
    aa, ba = a[..., 3:] / 255, b[..., 3:] / 255
    oa = ba + aa * (1 - ba)
    rgb = (b[..., :3] * ba + a[..., :3] * aa * (1 - ba)) / np.maximum(oa, 1e-6)
    return np.concatenate([rgb, oa * 255], -1)

def layout(words, phrase, slot):
    """Place each word of a phrase: hero words on their own line in serif."""
    i0, i1 = phrase["i"]; hero = set(phrase.get("hero", []))
    lines, cur, curw = [], [], 0
    space = sans.getlength(" ")
    k = i0
    while k <= i1:
        if k in hero:
            if cur: lines.append(("s", cur)); cur, curw = [], 0
            span = [k]
            while k + 1 <= i1 and k + 1 in hero: k += 1; span.append(k)
            lines.append(("h", span)); k += 1; continue
        wlen = sans.getlength(words[k]["w"])
        if cur and curw + space + wlen > MAX_W: lines.append(("s", cur)); cur, curw = [], 0
        cur.append(k); curw += (space if curw else 0) + wlen; k += 1
    if cur: lines.append(("s", cur))
    x0, y, align = SLOTS[slot % len(SLOTS)]
    placed, stagger = [], 0
    for kind, idxs in lines:
        font = serif if kind == "h" else sans
        sp = font.getlength(" ")
        widths = [font.getlength(words[j]["w"]) for j in idxs]
        total = sum(widths) + sp * (len(idxs) - 1)
        total = min(total, 1080 * 0.88 - 40)
        if align == "l": x = x0 + stagger
        elif align == "r": x = x0 - total - stagger
        else: x = x0 - total / 2 + (stagger if len(placed) % 2 else -stagger)
        x = max(60, min(x, 1080 * 0.88 - total))
        lh = SERIF_PX * 0.95 if kind == "h" else SANS_PX * 1.12
        for j, wdt in zip(idxs, widths):
            placed.append({"j": j, "x": x, "y": y, "kind": kind})
            x += wdt + sp
        y += lh; stagger = 34 if stagger == 0 else 0
    return placed

def main(raw, words_p, plan_p, out):
    words = json.load(open(words_p)); plan = json.load(open(plan_p))
    phrases = plan["phrases"]
    dur_raw = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", raw]))
    hold = plan.get("outro_hold", 1.4)
    total = dur_raw + hold
    nf = int(total * FPS)
    # Build caption items
    items = []
    for n, ph in enumerate(phrases):
        start = words[ph["i"][0]]["s"]
        nxt = words[phrases[n + 1]["i"][0]]["s"] if n + 1 < len(phrases) else total - 0.9
        end = min(nxt, words[ph["i"][1]]["e"] + 1.6) if n + 1 < len(phrases) else nxt
        for p in layout(words, ph, ph.get("slot", n)):
            txt = words[p["j"]]["w"]
            spr, pad = sprite(txt, serif if p["kind"] == "h" else sans, CREAM if p["kind"] == "h" else WHITE, 16 if p["kind"] == "h" else 9)
            items.append({"t0": max(words[p["j"]]["s"] - 0.04, start), "t1": end, "x": int(p["x"] - pad),
                          "y": int(p["y"] - pad), "spr": spr, "hero": p["kind"] == "h"})
    # Intro/outro overlays are drawn per frame below.
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", raw,
           "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
    sfx = []  # (file, time, gain_db, trim)
    sfx.append(("Camera Flash.wav", 0.0, 0, 0.27))
    for n, ph in enumerate(phrases):
        t = words[ph["i"][0]]["s"]
        if ph["i"][0] not in ph.get("hero", []): sfx.append(("Click.wav", t, 2, 0))
        h = ph.get("hero", [])
        if h: sfx.append(("FOCUS.MP3", words[h[0]]["s"], -1, 0))
    if "felt" in plan:
        tf = words[plan["felt"]]["s"]
        sfx.append(("Riser.wav", max(0, tf - 1.70), -5, 0))
        sfx.append(("Charge.MP3", tf, 12, 0))
    sfx.append(("Jolt Build Up.wav", total - 1.40, -2, 0))
    for f, t, g, tr in sfx: cmd += ["-i", os.path.join(SFX, f)]
    # Video: upscale, intro punch-in (1.10 -> 1.0 over 0.5 s), freeze last frame for the outro hold.
    vf = (f"[0:v]scale={W}:{H}:flags=lanczos,unsharp=5:5:0.6,tpad=stop_mode=clone:stop_duration={hold},"
          f"scale=w='iw*(1+0.10*max(0,1-t/0.5)*max(0,1-t/0.5))':h=-2:eval=frame:flags=bicubic,"
          f"crop={W}:{H}:(iw-{W})/2:(ih-{H})/2,setsar=1,fps={FPS}[base];"
          f"[1:v]format=rgba[ov];[base][ov]overlay=0:0:format=auto,format=yuv420p[v]")
    af = [f"[0:a]apad=pad_dur={hold}[voice]"]
    labels = ["[voice]"]
    for k, (f, t, g, tr) in enumerate(sfx):
        ms = int(t * 1000)
        af.append(f"[{k+2}:a]atrim=start={tr},asetpts=PTS-STARTPTS,aformat=channel_layouts=stereo,volume={g}dB,adelay={ms}|{ms}[s{k}]")
        labels.append(f"[s{k}]")
    af.append("".join(labels) + f"amix=inputs={len(labels)}:normalize=0:duration=first,atrim=0:{total:.3f},loudnorm=I=-14:TP=-1.5:LRA=11[a]")
    cmd += ["-filter_complex", vf + ";" + ";".join(af), "-map", "[v]", "-map", "[a]",
            "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-c:a", "aac", "-b:a", "192k",
            "-t", f"{total:.3f}", "-movflags", "+faststart", out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    rr = np.sqrt((xx - W / 2) ** 2 + ((yy - H * 0.40) * 0.9) ** 2)
    for fi in range(nf):
        t = fi / FPS
        canvas = np.zeros((H, W, 4), np.float32)
        for it in items:
            if not (it["t0"] <= t < it["t1"]): continue
            e = ease((t - it["t0"]) / ENTER)
            x_out = ease((t - (it["t1"] - 0.12)) / 0.12)   # quick fade at exit
            spr = it["spr"]
            if e < 1:
                b = (1 - e) * 10
                im = Image.fromarray(spr.astype(np.uint8)).filter(ImageFilter.GaussianBlur(b))
                spr = np.array(im).astype(np.float32)
            a = e * (1 - x_out)
            y = it["y"] + int((1 - e) * 16)
            h_, w_ = spr.shape[:2]
            x0, y0 = max(it["x"], 0), max(y, 0)
            x1, y1 = min(it["x"] + w_, W), min(y + h_, H)
            if x1 <= x0 or y1 <= y0: continue
            s = spr[y0 - y:y1 - y, x0 - it["x"]:x1 - it["x"]].copy(); s[..., 3] *= a
            canvas[y0:y1, x0:x1] = over(canvas[y0:y1, x0:x1], s)
        # Intro: white flash fading out over 0.35 s.
        if t < 0.35:
            fl = np.zeros((H, W, 4), np.float32); fl[..., :3] = 255; fl[..., 3] = 255 * 0.9 * (1 - ease(t / 0.35))
            canvas = over(canvas, fl)
        # Outro: light iris closes to a point over the last 1.2 s, then a white pin flare.
        to = t - (total - 1.2)
        if to > 0:
            k = ease(to / 1.0)
            R = (1 - k) * 1300 + 1
            dark = np.clip((rr - R) / 60, 0, 1)
            ring = np.exp(-((rr - R) / (18 + 30 * (1 - k))) ** 2) * (0.6 + 0.4 * k)
            ov = np.zeros((H, W, 4), np.float32)
            ov[..., 0] = 255; ov[..., 1] = 236; ov[..., 2] = 200
            al = np.clip(dark * 255, 0, 255)
            col = np.stack([255 * ring, 236 * ring, 200 * ring], -1)
            ov[..., :3] = col / np.maximum(1e-6, np.clip(ring + dark, 1e-6, 1))[..., None] * np.clip(ring + dark, 0, 1)[..., None]
            ov[..., 3] = np.clip(al + ring * 255, 0, 255)
            canvas = over(canvas, ov)
        proc.stdin.write(np.clip(canvas, 0, 255).astype(np.uint8).tobytes())
    proc.stdin.close(); proc.wait()
    return proc.returncode

if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:5]))
