import sys, os, json, subprocess, random
from PIL import Image, ImageDraw, ImageFont
W, H, FPS, DUR = 1080, 1920, 30, 3.6
BOLD = '/usr/share/fonts/opentype/inter/Inter-Bold.otf'
spec = json.loads(sys.argv[1]); out = sys.argv[2]
tmp = out + '_frames'; os.makedirs(tmp, exist_ok=True)

def wrap(draw, text, font, maxw):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if draw.textlength(t, font=font) <= maxw: cur = t
        else: lines.append(cur); cur = w
    lines.append(cur); return lines

f1 = ImageFont.truetype(BOLD, 84); f2 = ImageFont.truetype(BOLD, 72)
probe = ImageDraw.Draw(Image.new('RGB', (10, 10)))
L1 = wrap(probe, spec['l1'], f1, 900); L2 = wrap(probe, spec['l2'], f2, 900)
lh1, lh2, gap = 104, 92, 56
total_h = len(L1)*lh1 + gap + len(L2)*lh2
top = int(H*0.44 - total_h/2)
# word-by-word reveal schedule
words1 = spec['l1'].split(); words2 = spec['l2'].split()
t1, t2 = 0.40, 1.85
random.seed(3)
flick = [0.85, 0.15, 0.7, 0.05, 0.35, 0.0]  # lights flickering off in the first frames
for f in range(int(DUR*FPS)):
    t = f / FPS
    bg = 0
    if f < len(flick): bg = int(70 * flick[f])
    img = Image.new('RGB', (W, H), (bg, bg, bg))
    d = ImageDraw.Draw(img)
    def draw_block(lines, font, lh, y0, start, step, color):
        shown = max(0, int((t - start) / step) + 1) if t >= start else 0
        n = 0; y = y0
        for line in lines:
            ws = line.split(); vis = []
            for w in ws:
                if n < shown: vis.append(w)
                n += 1
            full_w = d.textlength(line, font=font); x = (W - full_w) / 2
            if vis: d.text((x, y), ' '.join(vis), font=font, fill=color)
            y += lh
        return y
    y = draw_block(L1, f1, lh1, top, t1, 0.11, (255, 255, 255))
    draw_block(L2, f2, lh2, y + gap, t2, 0.11, (255, 214, 150))
    img.save(f'{tmp}/{f:04d}.png')

# sound: low mains hum that dies with the flicker, then a quiet dark-room tone
hum = "aevalsrc='0.10*sin(2*PI*55*t)*lt(t,0.22)+0.05*sin(2*PI*110*t)*lt(t,0.22)+0.035*sin(2*PI*41*t)*(1-exp(-3*(t-0.25)))*gt(t,0.25)':s=48000:d=%.2f" % DUR
subprocess.run(['ffmpeg','-v','error','-y','-framerate',str(FPS),'-i',f'{tmp}/%04d.png','-f','lavfi','-i',hum,
  '-filter_complex','[1:a]afade=t=out:st=%.2f:d=0.3,pan=stereo|c0=c0|c1=c0[a]' % (DUR-0.3),
  '-map','0:v','-map','[a]','-c:v','libx264','-crf','16','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-shortest',out], check=True)
