"""Swipe-hook ad factory.
Builds a library of short clips, then renders ads:
  [N swipe clips, each joined by a slide-up swipe + click]  ->  swipe into official product video + end card.
Usage:
  python3 factory.py prep                 # build normalized clip library + click sound
  python3 factory.py render START COUNT   # render ads START..START+COUNT-1
"""
import sys, os, json, random, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
U = '/root/.claude/uploads/23e76b59-4414-52e3-ab03-18db807ebcf1'
def up(suffix): return next(os.path.join(U, f) for f in os.listdir(U) if f.endswith(suffix))
SRC = {'swipe': lambda: up('.mp4') if False else next(os.path.join(U, f) for f in os.listdir(U) if f.startswith('7b097abb')),
       'vid1': lambda: up('-vid1.mp4'), 'vid4': lambda: up('-vid4.mp4'), 'vid5': lambda: up('-vid5.mp4')}
PRODUCT = os.path.join(HERE, '..', '..', 'lantern-video', 'official-product-video-with-endcard.mp4')
LIB = os.path.join(HERE, 'library'); OUT = os.path.join(HERE, 'out')
# id, source, start, end, opener?, note
CLIPS = [
 ('L01','swipe', 0.00, 2.20, True,  'Is the world ending? / national power outage'),
 ('L02','vid4',  0.00, 2.00, True,  'Is a major blackout coming to the United States'),
 ('L03','vid5',  0.00, 1.80, True,  'Doomsday supplies for my family'),
 ('L04','swipe', 2.40, 3.20, False, 'Nationwide ground stop on all planes'),
 ('L05','swipe', 3.40, 4.60, False, 'Cyber attacks are happening left and right'),
 ('L06','swipe', 4.70, 5.15, False, 'Fox 5 breaking: all flights are...'),
 ('L07','swipe', 5.70, 6.12, False, 'Trying to stay hopeful'),
 ('L08','vid4', 95.50, 98.20, False, 'Pentagon: 90 days completely off-grid (Fox report)'),
 ('L09','vid4',102.30,106.00, False, 'Countries urging citizens to get food & water'),
 ('L10','vid1',  7.00, 9.00, False, 'Fortress America graphic'),
 ('L11','vid1', 45.50, 47.50, False, 'Aldi stores: doors could not open'),
 ('L12','vid5',  5.00, 7.10, False, 'People said I am overreacting'),
 ('L13','vid5', 11.30, 13.70, False, 'I got more (car trunk)'),
]
D = 0.18  # swipe duration
def run(cmd): subprocess.run(cmd, check=True)
def dur(p): return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',p]).decode())

def prep():
    os.makedirs(LIB, exist_ok=True)
    for cid, src, s, e, _, _ in CLIPS:
        run(['ffmpeg','-v','error','-y','-ss',f'{s}','-to',f'{e}','-i',SRC[src](),
             '-vf','fps=30,scale=1080:1920:flags=lanczos,setsar=1','-af','aresample=48000,aformat=channel_layouts=stereo',
             '-c:v','libx264','-crf','16','-preset','veryfast','-pix_fmt','yuv420p','-c:a','pcm_s16le',f'{LIB}/{cid}.mov'])
    # one swipe click used on every cut
    run(['ffmpeg','-v','error','-y','-f','lavfi','-i',
         "aevalsrc='0.55*sin(2*PI*2300*t)*exp(-170*t)+0.35*(random(0)*2-1)*exp(-420*t)':s=48000:d=0.06",
         '-af','highpass=f=900,pan=stereo|c0=c0|c1=c0',f'{LIB}/click.wav'])
    print('library ready:', len(CLIPS), 'clips')

def plan(k):
    rnd = random.Random(1000 + k)
    n = 4 + (k - 1) % 6                      # 4,5,6,7,8,9,4,5,...
    openers = [c for c in CLIPS if c[4]]; rest = [c for c in CLIPS if not c[4]]
    first = rnd.choice(openers)
    others = rnd.sample([c for c in CLIPS if c is not first], n - 1)
    return [first] + others

def render(k):
    os.makedirs(OUT, exist_ok=True)
    seq = plan(k); files = [f'{LIB}/{c[0]}.mov' for c in seq] + [PRODUCT]
    durs = [dur(f) for f in files]
    inputs = sum([['-i', f] for f in files], []) + ['-i', f'{LIB}/click.wav']
    fc, vlast, alast, t = [], '[0:v]', '[0:a]', durs[0]
    for i in range(1, len(files)):
        off = t - D
        fc.append(f'{vlast}[{i}:v]xfade=transition=slideup:duration={D}:offset={off:.3f}[v{i}]')
        fc.append(f'{alast}[{i}:a]acrossfade=d={D}[a{i}]')
        vlast, alast = f'[v{i}]', f'[a{i}]'
        t = t + durs[i] - D
    cuts, acc = [], durs[0]
    for i in range(1, len(files)):
        cuts.append(acc - D); acc += durs[i] - D
    nclk = len(cuts); ci = len(files)
    fc.append(f'[{ci}:a]asplit={nclk}' + ''.join(f'[c{j}]' for j in range(nclk)))
    for j, c in enumerate(cuts):
        ms = int(c * 1000); fc.append(f'[c{j}]adelay={ms}|{ms}[cd{j}]')
    fc.append(f'{alast}' + ''.join(f'[cd{j}]' for j in range(nclk)) + f'amix=inputs={nclk+1}:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[aout]')
    name = f'{OUT}/lantern-swipe-{k:03d}.mp4'
    run(['ffmpeg','-v','error','-y',*inputs,'-filter_complex',';'.join(fc),'-map',vlast,'-map','[aout]',
         '-c:v','libx264','-crf','23','-preset','veryfast','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart',name])
    hook = cuts[-1]
    rec = {'video': os.path.basename(name), 'swipes': len(seq), 'hook_seconds': round(hook, 2),
           'clips': [c[0] for c in seq], 'total_seconds': round(dur(name), 2)}
    with open(f'{OUT}/manifest.jsonl', 'a') as fh: fh.write(json.dumps(rec) + '\n')
    print(rec)

if __name__ == '__main__':
    if sys.argv[1] == 'prep': prep()
    else:
        a, n = int(sys.argv[2]), int(sys.argv[3])
        for k in range(a, a + n): render(k)
