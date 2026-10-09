#!/usr/bin/env python3
"""Render N text-hook variants of one Giorgi clip.
Each variant differs in: overlay text, text style, trim/length, zoom, speed, color grade. Original audio kept (atempo-matched to the speed change).
Usage: text_variants.py SRC.mp4 OUTDIR [VARIANTS.json] [PREFIX]
  VARIANTS.json: list of [id, goal, line1, line2, style, trim_start, out_len, zoom, speed, sat, bright]
  (defaults to the built-in table below). Fonts load from icon/tools/fonts/.
"""
import subprocess, sys, os, tempfile, json
SRC, OUT = sys.argv[1:3]
HERE = os.path.dirname(os.path.abspath(__file__))
ANTON = os.path.join(HERE, "fonts", "Anton-Regular.ttf")
MONT = os.path.join(HERE, "fonts", "Montserrat-ExtraBold.ttf")
PREFIX = sys.argv[4] if len(sys.argv) > 4 else "giorgi_txt"
# id, goal, line1, line2, style, trim_start, out_len, zoom, speed, sat, bright
V = [
 ("01","comments","WHAT'S HIS NAME?","WRONG ANSWERS ONLY","stroke_white_anton",0.00,11.2,1.00,1.00,1.00,0.00),
 ("02","follows","DAY 1 OF DANCING","UNTIL SHE TEXTS BACK","box_white_mont",0.10,10.9,1.04,1.00,1.06,0.01),
 ("03","shares","SEND THIS TO YOUR","GROUP CHAT. NO CONTEXT.","stroke_yellow_anton",0.15,10.6,1.00,1.03,1.04,0.00),
 ("04","shares","ME WALKING INTO WORK","AFTER A 3-DAY WEEKEND","stroke_white_mont",0.05,11.4,1.06,1.00,0.96,0.02),
 ("05","comments","RATE HIS MOVES 1-10","BE HONEST","box_black_mont",0.20,10.2,1.02,1.02,1.08,0.00),
 ("06","saves","SAVE THIS FOR WHEN","YOU NEED SEROTONIN","box_white_mont",0.00,9.8,1.03,1.04,1.02,0.01),
 ("07","shares","WHEN THE DJ PLAYS","YOUR SONG AT 2AM","stroke_white_anton",0.25,10.8,1.05,1.00,1.10,-0.01),
 ("08","comments","TAG SOMEONE WHO","DANCES EXACTLY LIKE THIS","stroke_yellow_anton",0.10,11.6,1.00,1.01,0.98,0.00),
 ("09","follows","FOLLOW TO SEE IF HE","GETS A GIRLFRIEND","box_black_mont",0.05,10.4,1.04,1.03,1.05,0.02),
 ("10","shares","ME AFTER ONE","ENERGY DRINK","stroke_white_mont",0.30,9.6,1.02,1.05,1.12,0.00),
]
def style(s):
    font = ANTON if s.endswith("anton") else MONT
    size = 98 if s.endswith("anton") else 74
    if s.startswith("box_white"):  return font,size,"fontcolor=black:box=1:boxcolor=white:boxborderw=22"
    if s.startswith("box_black"):  return font,size,"fontcolor=white:box=1:boxcolor=black@0.85:boxborderw=22"
    if s.startswith("stroke_yellow"): return font,size,"fontcolor=#FFE600:borderw=9:bordercolor=black"
    return font,size,"fontcolor=white:borderw=9:bordercolor=black"
if len(sys.argv) > 3: V = json.load(open(sys.argv[3]))
os.makedirs(OUT, exist_ok=True)
tmp = tempfile.mkdtemp()
for vid,goal,l1,l2,st,ss,ln,z,sp,sat,br in V:
    font,size,look = style(st)
    a=os.path.join(tmp,vid+"a.txt"); b=os.path.join(tmp,vid+"b.txt")
    open(a,"w").write(l1); open(b,"w").write(l2)
    gap = int(size*1.45)
    dt = f"fontfile={font}:fontsize={size}:{look}:x=(w-text_w)/2"
    vf = (f"setpts=PTS/{sp},scale=iw*{z}:-1,crop=1080:1920,eq=saturation={sat}:brightness={br},"
          f"drawtext={dt}:textfile={a}:y=h*0.56,drawtext={dt}:textfile={b}:y=h*0.56+{gap},fps=30,format=yuv420p")
    out = os.path.join(OUT, f"{PREFIX}{vid}_{goal}.mp4")
    subprocess.run(["ffmpeg","-v","error","-y","-ss",str(ss),"-i",SRC,"-vf",vf,"-t",str(ln),"-af",f"atempo={sp}","-c:a","aac","-b:a","192k",
                    "-c:v","libx264","-preset","medium","-crf","18","-movflags","+faststart",out],check=True)
    d = subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",out],capture_output=True,text=True).stdout.strip()
    print(vid,goal,f"{float(d):.1f}s",l1,"/",l2)
