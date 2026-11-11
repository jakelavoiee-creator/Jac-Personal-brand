#!/usr/bin/env python3
"""Turn one still image into an animated 9:16 b-roll clip.

Usage:
  python3 scripts/broll_motion.py IMAGE OUT.mp4 --dur 1.4 --recipe push --glow 0.5 --particles 40 --leak 0.3
Recipes: push (slow zoom in), pull (zoom out), drift (pan + tiny rotation), still (no camera move).
Optional: --depth DEPTH.png (white = near) adds 2.5D parallax. Everything is a starting value: tune per image.
"""
import argparse, subprocess, sys, math
import numpy as np, cv2

W, H, FPS = 1080, 1920, 30

def ease(t):  # smooth in-out
    return t * t * (3 - 2 * t)

def cover(img, scale_extra=1.30):
    """Resize to cover the frame with headroom for camera moves."""
    h, w = img.shape[:2]
    s = max(W * scale_extra / w, H * scale_extra / h)
    return cv2.resize(img, (int(w * s) + 1, int(h * s) + 1), interpolation=cv2.INTER_LANCZOS4)

def camera(big, depth_big, t, recipe, parallax, focus_y):
    bh, bw = big.shape[:2]
    e = ease(t)
    zoom = {"push": 1 / (1 + 0.12 * e), "pull": 1 / (1.12 - 0.12 * e), "drift": 1 / 1.06, "still": 1 / 1.04}[recipe]
    cw, ch = W * 1.30 * zoom / 1.30 * 1.0, H * 1.30 * zoom / 1.30 * 1.0
    cw, ch = W * zoom * 1.2, H * zoom * 1.2
    cx, cy = bw / 2, bh * focus_y
    rot = 0.0
    if recipe == "drift":
        cx += (e - 0.5) * 0.05 * bw
        cy += (e - 0.5) * 0.02 * bh
        rot = (e - 0.5) * 1.2
    cx = min(max(cx, cw / 2), bw - cw / 2)
    cy = min(max(cy, ch / 2), bh - ch / 2)
    sx, sy = cw / W, ch / H
    ang = math.radians(rot)
    M = np.array([[sx * math.cos(ang), -sx * math.sin(ang), cx - cw / 2 + 0],
                  [sy * math.sin(ang),  sy * math.cos(ang), cy - ch / 2 + 0]], dtype=np.float32)
    if depth_big is not None and parallax > 0:
        # shift near pixels more than far pixels, then crop
        shift = (e - 0.5) * parallax * bw
        yy, xx = np.mgrid[0:bh, 0:bw].astype(np.float32)
        mapx = xx - depth_big * shift
        warped = cv2.remap(big, mapx, yy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    else:
        warped = big
    return cv2.warpAffine(warped, M, (W, H), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT)

def bloom(frame, amount, t):
    if amount <= 0: return frame
    f = frame.astype(np.float32) / 255
    bright = np.clip(f - 0.55, 0, 1) * 2.2
    g = cv2.GaussianBlur(bright, (0, 0), 38)
    pulse = 0.85 + 0.15 * math.sin(2 * math.pi * 0.35 * t)  # slow breathing light
    out = 1 - (1 - f) * (1 - g * amount * pulse)  # screen blend
    return (np.clip(out, 0, 1) * 255).astype(np.uint8)

def leak(frame, amount, t, dur):
    if amount <= 0: return frame
    f = frame.astype(np.float32) / 255
    x0 = (-0.3 + 1.6 * (t / max(dur, 1e-3))) * W
    xx = np.arange(W, dtype=np.float32)[None, :]
    yy = np.arange(H, dtype=np.float32)[:, None]
    d = ((xx - x0) / (W * 0.45)) ** 2 + ((yy - H * 0.2) / (H * 0.5)) ** 2
    g = np.exp(-d)[..., None]
    warm = np.array([0.10, 0.45, 1.0], dtype=np.float32)  # BGR warm orange
    out = 1 - (1 - f) * (1 - g * warm * amount)
    return (np.clip(out, 0, 1) * 255).astype(np.uint8)

class Particles:
    def __init__(self, n, seed=7):
        r = np.random.default_rng(seed)
        self.n = n
        self.x = r.uniform(0, W, n); self.y = r.uniform(0, H, n)
        self.vy = -r.uniform(14, 48, n); self.vx = r.uniform(-8, 8, n)
        self.r = r.uniform(1.2, 4.2, n); self.ph = r.uniform(0, 6.28, n)
    def draw(self, frame, t):
        if self.n == 0: return frame
        layer = np.zeros((H, W), np.float32)
        for i in range(self.n):
            x = (self.x[i] + self.vx[i] * t) % W
            y = (self.y[i] + self.vy[i] * t) % H
            a = 0.35 + 0.35 * math.sin(2 * math.pi * 0.8 * t + self.ph[i])
            cv2.circle(layer, (int(x), int(y)), int(max(1, self.r[i])), float(max(a, 0)), -1, cv2.LINE_AA)
        layer = cv2.GaussianBlur(layer, (0, 0), 1.6)[..., None]
        f = frame.astype(np.float32) / 255
        warm = np.array([0.80, 0.93, 1.0], dtype=np.float32)
        out = 1 - (1 - f) * (1 - layer * warm)
        return (np.clip(out, 0, 1) * 255).astype(np.uint8)

def finish(frame, grain, vig, rng):
    f = frame.astype(np.float32)
    # warm cinematic tint (BGR): lift reds slightly, soften blue
    f[..., 2] *= 1.04; f[..., 0] *= 0.95
    if vig > 0:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = ((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - H / 2) / (H * 0.75)) ** 2
        f *= (1 - vig * np.clip(d, 0, 1))[..., None]
    if grain > 0:
        f += rng.normal(0, grain * 255, (H, W, 1)).astype(np.float32)
    return np.clip(f, 0, 255).astype(np.uint8)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("image"); ap.add_argument("out")
    ap.add_argument("--dur", type=float, default=1.4)
    ap.add_argument("--recipe", choices=["push", "pull", "drift", "still"], default="push")
    ap.add_argument("--glow", type=float, default=0.4)
    ap.add_argument("--particles", type=int, default=30)
    ap.add_argument("--leak", type=float, default=0.0)
    ap.add_argument("--grain", type=float, default=0.03, help="noise std, fraction of 255")
    ap.add_argument("--vignette", type=float, default=0.35)
    ap.add_argument("--depth", default=None)
    ap.add_argument("--parallax", type=float, default=0.02)
    ap.add_argument("--focus-y", type=float, default=0.5, help="0 top .. 1 bottom: where the subject sits")
    ap.add_argument("--desat", type=float, default=0.0, help="0 color .. 1 black and white")
    a = ap.parse_args()
    img = cv2.imread(a.image, cv2.IMREAD_COLOR)
    if img is None: sys.exit("cannot read image")
    big = cover(img)
    depth_big = None
    if a.depth:
        d = cv2.imread(a.depth, cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
        depth_big = cv2.resize(d, (big.shape[1], big.shape[0]))
    n = max(2, int(round(a.dur * FPS)))
    ff = subprocess.Popen(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24",
                           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p",
                           "-crf", "18", "-preset", "veryfast", a.out], stdin=subprocess.PIPE)
    parts = Particles(a.particles); rng = np.random.default_rng(3)
    for i in range(n):
        t = i / FPS; tn = i / (n - 1)
        fr = camera(big, depth_big, tn, a.recipe, a.parallax, a.focus_y)
        if a.desat > 0:
            g = cv2.cvtColor(cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY), cv2.COLOR_GRAY2BGR)
            fr = cv2.addWeighted(fr, 1 - a.desat, g, a.desat, 0)
        fr = bloom(fr, a.glow, t); fr = leak(fr, a.leak, t, a.dur)
        fr = parts.draw(fr, t); fr = finish(fr, a.grain, a.vignette, rng)
        ff.stdin.write(fr.tobytes())
    ff.stdin.close(); ff.wait()

if __name__ == "__main__":
    main()
