"""Batch 2: four new scroll recordings.
  python3 factory2.py prep
  python3 factory2.py series      # each recording: 4 swipes .. all swipes, in recorded order
  python3 factory2.py mix START COUNT   # shuffled mixes of old + new clips
Every ad: swipe clips (slide-up + click) -> official product video -> end card.
"""
import sys, os, json, random, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import factory as F
U = F.U
def rec(prefix): return next(os.path.join(U, f) for f in os.listdir(U) if f.startswith(prefix))
CROP = 'crop=1290:2293:0:251,'          # iPhone screen recording -> 9:16
# id, recording, start, end, note   (Simpsons, SpongeBob, Nov-17 and the Trump "declaration" swipes are left out)
NEW = {
 'A': ('128107af', [('A1',1.40,5.40,'Pentagon: bases ready for 90 days without civilian grid'),
                    ('A2',8.00,9.15,'Every creator on your timeline rn'),
                    ('A3',9.40,11.30,'Power grid fallout, part 1'),
                    ('A4',11.55,13.00,'This is just the start. Be prepared!'),
                    ('A5',13.25,14.33,'Is the world ending? I dont think so')]),
 'B': ('1a485686', [('B1',0.00,6.80,'What would you do if they brought the power grid down'),
                    ('B2',7.05,8.55,'Stick figure: the grid down'),
                    ('B3',8.85,10.00,'Heads up: keep 3 days of water and food'),
                    ('B4',10.25,12.10,'It is not all a cyber attack'),
                    ('B5',12.35,12.90,'Apple store: the latest'),
                    ('B6',13.15,13.65,'178 of the worlds biggest companies just got hacked'),
                    ('B7',13.90,14.20,'Banks now part of G7 AI attack drills'),
                    ('B8',14.45,14.75,'FBI warns of AI cyberattacks on banks'),
                    ('B9',15.00,15.60,'Four giants went down')]),
 'C': ('ac31f36e', [('C1',0.00,4.70,'News: potential 18-month US grid shutdown'),
                    ('C3',6.75,7.08,'Cyber attack'),
                    ('C4',7.30,8.15,'I dont know what the hackers are planning'),
                    ('C6',9.25,9.85,'Something big is coming'),
                    ('C7',10.10,10.38,'Is the UK ready for war? Were not ready'),
                    ('C8',10.60,10.88,'The system is collapsing'),
                    ('C9',11.08,11.28,'Cyberattack hit 17 major websites'),
                    ('C10',11.50,11.73,'Power grid panic'),
                    ('C12',12.60,13.02,'72 hour countdown'),
                    ('C14',13.80,14.08,'CNN: vulnerabilities easier to target')]),
 'D': ('b5e2a51d', [('D1',0.10,3.90,'178 major sites just got hacked'),
                    ('D2',4.15,7.60,'Grounded flights, Microsoft outage, Europe'),
                    ('D3',7.85,10.10,'Times: cyberattack targets BBC, Zoom, Ikea'),
                    ('D4',10.40,11.00,'OpenAI just used AI'),
                    ('D5',11.20,12.25,'Listen and pay attention: keep 3 days'),
                    ('D6',12.45,13.10,'How this past week was for all of us'),
                    ('D7',13.35,13.95,'Night street, lights out'),
                    ('D8',14.20,14.55,'Breaking: threats to US power grids'),
                    ('D9',14.80,15.05,'The internet is...')]),
}
OUT2 = os.path.join(F.HERE, 'out2')

def prep():
    os.makedirs(F.LIB, exist_ok=True)
    for key, (pfx, clips) in NEW.items():
        src = rec(pfx)
        for cid, s, e, _ in clips:
            pad = max(0.0, 0.55 - (e - s))   # very fast swipes: hold the last frame so every swipe is >= 0.55s
            F.run(['ffmpeg','-v','error','-y','-ss',f'{s}','-to',f'{e}','-i',src,
                   '-vf',CROP+f'fps=30,scale=1080:1920:flags=lanczos,setsar=1,tpad=stop_mode=clone:stop_duration={pad:.3f}',
                   '-af',f'aresample=48000,aformat=channel_layouts=stereo,apad=pad_dur={pad:.3f}',
                   '-c:v','libx264','-crf','16','-preset','veryfast','-pix_fmt','yuv420p','-c:a','pcm_s16le',f'{F.LIB}/{cid}.mov'])
    print('new clips ready:', sum(len(c) for _, c in NEW.values()))

def build(ids, name, label):
    os.makedirs(OUT2, exist_ok=True)
    mf = f'{OUT2}/manifest.jsonl'
    if os.path.exists(mf) and any(json.loads(l)['video'] == name + '.mp4' for l in open(mf)):
        print('skip', name, flush=True); return
    F.OUT = OUT2
    files = [f'{F.LIB}/{i}.mov' for i in ids] + [F.PRODUCT]
    durs = [F.dur(f) for f in files]
    inputs = sum([['-i', f] for f in files], []) + ['-i', f'{F.LIB}/click.wav']
    fc, vlast, alast, t, cuts = [], '[0:v]', '[0:a]', durs[0], []
    for i in range(1, len(files)):
        off = t - F.D; cuts.append(off)
        fc.append(f'{vlast}[{i}:v]xfade=transition=slideup:duration={F.D}:offset={off:.3f}[v{i}]')
        fc.append(f'{alast}[{i}:a]acrossfade=d={F.D}[a{i}]')
        vlast, alast = f'[v{i}]', f'[a{i}]'; t += durs[i] - F.D
    n, ci = len(cuts), len(files)
    fc.append(f'[{ci}:a]asplit={n}' + ''.join(f'[c{j}]' for j in range(n)))
    for j, c in enumerate(cuts):
        ms = int(c * 1000); fc.append(f'[c{j}]adelay={ms}|{ms}[cd{j}]')
    fc.append(f'{alast}' + ''.join(f'[cd{j}]' for j in range(n)) + f'amix=inputs={n+1}:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[aout]')
    path = f'{OUT2}/{name}.mp4'
    subprocess.run(['ffmpeg','-v','error','-y',*inputs,'-filter_complex',';'.join(fc),'-map',vlast,'-map','[aout]',
           '-c:v','libx264','-crf','23','-preset','superfast','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart',path], check=True, timeout=300)
    r = {'video': name + '.mp4', 'type': label, 'swipes': len(ids), 'hook_seconds': round(cuts[-1], 2),
         'clips': ids, 'total_seconds': round(F.dur(path), 2)}
    with open(f'{OUT2}/manifest.jsonl', 'a') as fh: fh.write(json.dumps(r) + '\n')
    print(r, flush=True)

def series():
    for key, (pfx, clips) in NEW.items():
        ids = [c[0] for c in clips]
        for k in range(4, len(ids) + 1):
            build(ids[:k], f'rec{key}-{k:02d}swipes', f'recording {key} in order')

def mix(a, count):
    old = [c[0] for c in F.CLIPS]
    new = [c[0] for _, cl in NEW.values() for c in cl]
    long_open = {'A1','B1','C1','D1','D2'}            # strong, longer openers
    openers = ['L01','L02','L03','A1','B1','C1','D1']
    pool = [i for i in old + new if i not in openers and i not in long_open]
    for k in range(a, a + count):
        rnd = random.Random(5000 + k)
        n = 4 + (k - 1) % 6
        first = rnd.choice(openers)
        build([first] + rnd.sample(pool, n - 1), f'mix-{k:03d}', 'mixed old + new')

if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'prep': prep()
    elif cmd == 'series': series()
    else: mix(int(sys.argv[2]), int(sys.argv[3]))
