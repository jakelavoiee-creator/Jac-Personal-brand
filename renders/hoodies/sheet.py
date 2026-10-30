import sys
from PIL import Image, ImageDraw
names=sys.argv[2:]; out=sys.argv[1]
W,H=300,400
c=Image.new('RGB',(W*min(len(names),6),H*((len(names)+5)//6)),'white');d=ImageDraw.Draw(c)
for i,n in enumerate(names):
    im=Image.open(n+'.png').convert('RGB').resize((W,H))
    c.paste(im,((i%6)*W,(i//6)*H)); d.text(((i%6)*W+4,(i//6)*H+4),n,fill='red')
c.save(out)
