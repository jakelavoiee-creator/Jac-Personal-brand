#!/usr/bin/env python3
"""Assemble a launch reel from clips, matching the reference edit.

Each shot is cover-cropped to 9:16, opens punched in and eases out (zoom-out),
then hard-cuts to the next. Click SFX land on listed times; a whoosh can mark
big transitions. Optional music bed underneath.

Usage: python3 build.py edit.json
"""
import json
import os
import subprocess
import sys

W, H, FPS = 1080, 1920, 30
HERE = os.path.dirname(os.path.abspath(__file__))


def shot_filter(i, s):
    dur = float(s["dur"])
    frames = max(1, round(dur * FPS))
    z0 = float(s.get("zoom_from", 1.12))
    z1 = float(s.get("zoom_to", 1.0))
    fx = float(s.get("focus_x", 0.5))
    fy = float(s.get("focus_y", 0.5))
    trim = f"trim=start={float(s.get('in', 0))}:duration={dur},setpts=PTS-STARTPTS,fps={FPS}"

    if s.get("fit") == "letterbox":
        # Full-width frame centered on black, as the reference does for the payoff ad.
        base = (
            f"{trim},scale=2*{W}:-2,"
            f"pad=2*{W}:2*{H}:(ow-iw)/2:(oh-ih)/2:color=black"
        )
    else:
        # Cover-crop to 9:16 around the focus point, at 2x for smooth sub-pixel zoom.
        base = (
            f"{trim},scale=2*{W}:2*{H}:force_original_aspect_ratio=increase,"
            f"crop=2*{W}:2*{H}:(iw-ow)*{fx}:(ih-oh)*{fy}"
        )

    # Slow, progressive zoom-out: constant speed from z0 to z1 across the whole shot.
    # Set "ease": true on a shot for the faster ease-out cubic instead.
    if s.get("ease"):
        zexpr = f"{z0}+({z1}-{z0})*(1-pow(1-min(on/{frames}\\,1)\\,3))"
    else:
        zexpr = f"{z0}+({z1}-{z0})*min(on/{frames}\\,1)"
    zoom = (
        f"zoompan=z='{zexpr}':d=1:"
        f"x='(iw-iw/zoom)*{fx}':y='(ih-ih/zoom)*{fy}':s={W}x{H}:fps={FPS}"
    )
    return f"[{i}:v]{base},setsar=1,{zoom},format=yuv420p[v{i}]"


def main(cfg_path):
    cfg = json.load(open(cfg_path))
    base_dir = os.path.dirname(os.path.abspath(cfg_path))
    shots = cfg["shots"]
    out = os.path.join(base_dir, cfg.get("output", "reel.mp4"))

    inputs, filters = [], []
    for i, s in enumerate(shots):
        inputs += ["-i", os.path.join(base_dir, s["file"])]
        filters.append(shot_filter(i, s))
    concat = "".join(f"[v{i}]" for i in range(len(shots))) + f"concat=n={len(shots)}:v=1:a=0"
    # Optional page-wide color grade (any ffmpeg video filter chain).
    grade = cfg.get("grade")
    filters.append(concat + (f",{grade}" if grade else "") + "[vg]")

    # Absolute times for SFX: shot start + per-shot click offsets.
    clicks, keys, whooshes, t = [], [], [], 0.0
    for s in shots:
        clicks += [t + float(c) for c in s.get("clicks", [])]
        keys += [t + float(k) for k in s.get("keys", [])]
        if s.get("whoosh"):
            whooshes.append(max(0.0, t - 0.18))
        t += float(s["dur"])
    total = t

    audio_labels = []
    n = len(shots)
    sfx_click = os.path.join(HERE, "sfx", "click.wav")
    sfx_whoosh = os.path.join(HERE, "sfx", "whoosh.wav")
    for k, ct in enumerate(clicks):
        inputs += ["-i", sfx_click]
        idx = n + k
        filters.append(f"[{idx}:a]adelay={int(ct * 1000)}:all=1,volume={cfg.get('click_volume', 0.9)}[c{k}]")
        audio_labels.append(f"[c{k}]")
    kbase = n + len(clicks)
    for k, kt in enumerate(keys):
        inputs += ["-i", os.path.join(HERE, "sfx", f"key{k % 5}.wav")]
        filters.append(f"[{kbase + k}:a]adelay={int(kt * 1000)}:all=1,volume={cfg.get('key_volume', 0.8)}[k{k}]")
        audio_labels.append(f"[k{k}]")
    base = kbase + len(keys)
    for k, wt in enumerate(whooshes):
        inputs += ["-i", sfx_whoosh]
        filters.append(f"[{base + k}:a]adelay={int(wt * 1000)}:all=1,volume={cfg.get('whoosh_volume', 0.6)}[w{k}]")
        audio_labels.append(f"[w{k}]")
    if cfg.get("music"):
        inputs += ["-i", os.path.join(base_dir, cfg["music"])]
        midx = base + len(whooshes)
        filters.append(
            f"[{midx}:a]atrim=start={cfg.get('music_in', 0)}:duration={total},asetpts=PTS-STARTPTS,"
            f"volume={cfg.get('music_volume', 0.5)},afade=t=out:st={max(0, total - 0.6)}:d=0.6[m]"
        )
        audio_labels.append("[m]")

    # Image overlays (logos, titles): pop in (scale 85% -> 100% + fade), hard cut out.
    vlabel = "vg"
    for k, ov in enumerate(cfg.get("overlays", [])):
        start, end = float(ov["start"]), float(ov["end"])
        width = int(ov.get("width", 860))
        y = float(ov.get("y", 0.3)) * H
        idx = inputs.count("-i")
        inputs += ["-loop", "1", "-t", f"{end - start}", "-i", os.path.join(base_dir, ov["file"])]
        filters.append(
            f"[{idx}:v]format=rgba,scale=w='{width}*(0.85+0.15*(1-pow(1-min(t/0.22\\,1)\\,3)))':h=-1:eval=frame,"
            f"fade=t=in:st=0:d=0.12:alpha=1,setpts=PTS+{start}/TB[ov{k}]"
        )
        filters.append(f"[{vlabel}][ov{k}]overlay=x=(W-w)/2:y={y}-h/2:eof_action=pass[vo{k}]")
        vlabel = f"vo{k}"
    filters.append(f"[{vlabel}]null[vout]")

    amap = []
    if audio_labels:
        filters.append(
            "".join(audio_labels)
            + f"amix=inputs={len(audio_labels)}:normalize=0:duration=longest,"
            f"apad,atrim=duration={total},aresample=48000,alimiter=limit=0.95[aout]"
        )
        amap = ["-map", "[aout]", "-c:a", "aac", "-b:a", "256k"]

    cmd = (
        ["ffmpeg", "-y", "-v", "error"] + inputs
        + ["-filter_complex", ";".join(filters), "-map", "[vout]"] + amap
        + ["-c:v", "libx264", "-preset", "slow", "-crf", "16", "-r", str(FPS),
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]
    )
    subprocess.run(cmd, check=True)
    print(f"wrote {out} ({total:.2f}s, {len(clicks)} clicks, {len(keys)} keys, {len(whooshes)} whooshes)")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "edit.json"))
