import numpy as np, os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.ndimage import gaussian_filter, map_coordinates
OUT='img'; os.makedirs(OUT,exist_ok=True)
rng=np.random.default_rng(7)
def save(a,name):
    a=np.clip(a,0,1)
    Image.fromarray((a*255+0.5).astype(np.uint8), 'RGBA' if a.shape[2]==4 else 'RGB').save(os.path.join(OUT,name),optimize=True)
def fnoise(h,w,scales,seed):
    r=np.random.default_rng(seed); acc=np.zeros((h,w)); amp=1; tot=0
    for s in scales:
        n=gaussian_filter(r.standard_normal((h,w)),s,mode='wrap'); n/=n.std()+1e-9
        acc+=n*amp; tot+=amp; amp*=0.55
    return acc/tot
N=1024
# ------------------------------------------------------------ sky faces (seam-proof: base depends only on elevation, features kept off the edges)
FACES={'ft':None,'bk':None,'lf':None,'rt':None,'up':None,'dn':None}
u=(np.arange(N)+0.5)/N*2-1
U,V=np.meshgrid(u,u)            # V: +1 at bottom of image
def elevation(face):
    if face=='up': return 1/np.sqrt(U*U+V*V+1)
    if face=='dn': return -1/np.sqrt(U*U+V*V+1)
    return -V/np.sqrt(U*U+V*V+1)
def base_color(y):
    # deep indigo void; faint violet haze around the horizon, darker at the zenith
    top=np.array([0.012,0.010,0.035]); mid=np.array([0.055,0.030,0.105]); low=np.array([0.020,0.012,0.040])
    t=np.clip(y,-1,1)[...,None]
    haze=np.exp(-(t/0.28)**2)
    c=np.where(t>0, top*(t)+mid*(1-t), low*(-t)+mid*(1+t))
    return c+haze*np.array([0.05,0.02,0.07])
def add_stars(img,count,seed,margin=3,bright=1.0):
    r=np.random.default_rng(seed)
    for _ in range(count):
        x,y=r.integers(margin,N-margin,2)
        b=(r.random()**3)*bright*0.9+0.08
        tint=r.choice([np.array([1,1,1]),np.array([0.8,0.88,1]),np.array([1,0.85,0.95]),np.array([0.85,1,1])])
        s=r.random()
        if s<0.9:
            img[y,x]+=tint*b
        else:
            rad=1.2+r.random()*1.6
            ys,xs=np.mgrid[-4:5,-4:5]
            g=np.exp(-(xs**2+ys**2)/(2*rad*rad))[...,None]*tint*b*1.2
            y0,x0=max(y-4,0),max(x-4,0)
            img[y0:y+5,x0:x+5]+=g[(y0-(y-4)):, (x0-(x-4)):][:img[y0:y+5,x0:x+5].shape[0],:img[y0:y+5,x0:x+5].shape[1]]
            # tiny diffraction cross
            if rad>2.2:
                L=int(6+rad*3)
                for d in range(-L,L+1):
                    f=math.exp(-abs(d)/(L*0.35))*b*0.5
                    if 0<=x+d<N: img[y,x+d]+=tint*f
                    if 0<=y+d<N: img[y+d,x]+=tint*f
def add_galaxy(img,cx,cy,size,seed,tilt,rot,col_a,col_b):
    r=np.random.default_rng(seed)
    h=int(size*1.3); ys,xs=np.mgrid[-h:h,-h:h].astype(float)
    ca,sa=math.cos(rot),math.sin(rot)
    xr=(xs*ca+ys*sa); yr=(-xs*sa+ys*ca)/tilt
    rr=np.sqrt(xr**2+yr**2)/size; th=np.arctan2(yr,xr)
    arms=0.5+0.5*np.cos(2*(th-2.6*np.log(rr+0.05)))
    noise=gaussian_filter(r.standard_normal(xs.shape),2)
    dens=np.exp(-rr*3.2)*(0.35+0.65*arms**2)*(1+0.35*noise)+np.exp(-(rr/0.08)**2)*1.4
    dens=np.clip(dens,0,None)
    col=(col_a[None,None]*np.exp(-rr*5)[...,None]+col_b[None,None]*(1-np.exp(-rr*5))[...,None])
    patch=dens[...,None]*col*0.55
    y0,x0=cy-h,cx-h
    img[y0:y0+2*h,x0:x0+2*h]+=patch
def add_ink(img,cx,cy,size,seed,strength=0.55):
    # soft white "ink wash" patch: fractal noise masked by a blotchy radial falloff
    h=int(size); ys,xs=np.mgrid[-h:h,-h:h].astype(float)
    rr=np.sqrt(xs**2+ys**2)/size
    n=fnoise(2*h,2*h,[size/10,size/22,size/50],seed)
    m=np.clip(1-rr,0,1)**1.5
    d=np.clip((n*0.6+m*1.3-0.55)*1.6,0,1)*m
    d=gaussian_filter(d,3)
    patch=d[...,None]*np.array([0.92,0.94,1.0])*strength
    img[cy-h:cy+h,cx-h:cx+h]=img[cy-h:cy+h,cx-h:cx+h]*(1-d[...,None]*0.5)+patch*1.5
fid=0
for face in FACES:
    fid+=1
    y=elevation(face)
    img=base_color(y)
    # faint large-scale nebula mottling, kept away from the edges (fades out near the border)
    edge=np.clip(np.minimum(np.minimum(U+1,1-U),np.minimum(V+1,1-V))/0.25,0,1)[...,None]
    neb=np.clip(fnoise(N,N,[90,40,16],100+fid),0,None)[...,None]
    img+=neb*edge*np.array([0.05,0.018,0.07])*(0.4 if face=='dn' else 1)
    if face in ('ft','bk','lf','rt'):
        add_stars(img,2600,fid,bright=1.0)
        # galaxies and ink patches fully inside the face (margin) so no seam can cut them
        g=np.random.default_rng(50+fid)
        for k in range(2):
            size=int(g.integers(45,90))
            cx=int(g.integers(size*1.3+20,N-size*1.3-20)); cy=int(g.integers(size*1.3+20,N//2+60))
            add_galaxy(img,cx,cy,size,60+fid*3+k,g.uniform(0.25,0.55),g.uniform(0,math.pi),np.array([1,0.9,0.95]),np.array([0.55,0.4,1.0]) if k==0 else np.array([1,0.45,0.75]))
        s=int(g.integers(150,220)); add_ink(img,int(g.integers(s+30,N-s-30)),int(g.integers(s+30,N-s-30)),s,80+fid,0.5)
    elif face=='up':
        add_stars(img,3000,fid,bright=1.1)
        add_ink(img,N//2+120,N//2-100,200,99,0.45)
        add_galaxy(img,300,720,70,77,0.45,1.0,np.array([1,0.95,0.9]),np.array([0.5,0.6,1]))
    else:
        add_stars(img,900,fid,bright=0.5)
    save(img,'sky_%s.png'%face)
# ------------------------------------------------------------ black hole layers (1024, centre = image centre)
C=N/2; R=N/2/3.0
ys,xs=np.mgrid[0:N,0:N].astype(float)+0.5
dx,dy=xs-C,ys-C; r=np.sqrt(dx*dx+dy*dy); th=np.arctan2(-dy,dx)   # th: 0 = east, +pi/2 = up
def aa_disc(rad,soft=1.2): return np.clip((rad-r)/soft+0.5,0,1)
# core: pure black disc + thin photon ring + soft inner glow
core=np.zeros((N,N,4))
disc=aa_disc(R)
glow=np.exp(-((r-R*1.025)/(R*0.02))**2)*1.0+np.exp(-((r-R*1.07)/(R*0.1))**2)*0.4
light=0.55+0.45*np.clip(np.sin(th)*0.8+0.4,0,1)       # brighter on top
gc=np.stack([0.85+0*r,0.9+0*r,1.0+0*r],-1)
rim=np.clip(glow*light,0,1.4)
core[...,:3]=gc*np.clip(rim,0,1)[...,None]
core[...,3]=np.clip(disc+rim*(1-disc),0,1)
core[...,:3]*= (1-disc)[...,None]
save(core,'bh_core.png')
# gas: feathery grey-blue annulus 1.2R..2.15R, swirled; lit upper right / left, dark bottom
lr=np.log(np.maximum(r,1)/R)
swirl=th+1.9*lr
n1=fnoise(N,N,[2,5,12],11)
# polar streaks: sample a noise field at (radius*k, swirl angle) so it stretches along the orbit
pn=gaussian_filter(np.random.default_rng(12).standard_normal((360,720)),(2.2,14),mode='wrap')+0.6*gaussian_filter(np.random.default_rng(13).standard_normal((360,720)),(6,40),mode='wrap')*3
pn/=pn.std()
ri=np.clip((r-R)/(R*1.3)*359,0,359); ai=((swirl%(2*np.pi))/(2*np.pi))*719
streak=map_coordinates(pn,[ri,ai],order=1,mode='wrap')
band=np.clip((r-R*1.15)/(R*0.12),0,1)*np.clip((R*2.15-r)/(R*0.55),0,1)
feather=np.clip((R*2.15-r)/(R*0.95),0,1)**1.6
dens=np.clip(0.42+0.5*streak+0.25*n1,0,1.2)*band*feather**0.8
dens=np.clip(dens,0,1)**1.2
lit=np.clip(0.15+0.95*np.clip(np.sin(th),0,1)**0.6+0.35*np.clip(np.cos(th-0.9),0,1)+0.25*np.clip(np.cos(th-2.4),0,1),0,1.2)
lit*=np.clip(0.05+0.95*((np.sin(th)+1)/2)**1.8,0,1)            # near black along the bottom
col=np.stack([0.62+0.2*n1*0,0.72+0*r,0.9+0*r],-1)
gas=np.zeros((N,N,4)); gas[...,:3]=np.clip(col*(0.35+0.75*lit[...,None]),0,1); gas[...,3]=np.clip(dens*(0.35+1.5*lit)*1.5,0,1)
save(gas,'bh_gas.png')
# outer ring at 2.2R: peach-gold top, white upper right, blue-white left, weak lower right
RR=R*2.2
ringd=np.exp(-((r-RR)/(R*0.022))**2)+0.35*np.exp(-((r-RR)/(R*0.09))**2)
def ang(a,w): return np.exp(-(np.angle(np.exp(1j*(th-a)))/w)**2)
peach=np.array([1.0,0.80,0.55]); white=np.array([1,1,1]); blue=np.array([0.72,0.85,1.0])
wp=ang(np.pi/2,0.8); ww=ang(np.pi/4,0.5); wb=ang(np.pi,0.9)+ang(3*np.pi/4,0.5)*0.6; weak=ang(-np.pi/4,0.7)
tot=wp+ww+wb+0.15
rc=(peach*wp[...,None]+white*ww[...,None]+blue*wb[...,None]+blue*0.15)/tot[...,None]
inten=np.clip(0.25+wp*0.9+ww*1.0+wb*0.8-weak*0.2,0.08,1.2)
ring=np.zeros((N,N,4)); ring[...,:3]=np.clip(rc,0,1); ring[...,3]=np.clip(ringd*inten,0,1)
save(ring,'bh_ring.png')
# smoke: pale blue-white cloud streaming off the ring's east side, cyan sparkles
sm=np.zeros((N,N,4))
xn=(xs-C)/R; yn=(ys-C)/R
plume=np.exp(-((yn+0.12*np.clip(xn-2.1,0,None)**1.4)/(0.22+0.3*np.clip(xn-2.0,0,None)))**2)*np.clip((xn-1.95)/0.3,0,1)*np.clip((2.95-xn)/0.35,0,1)
nn=np.clip(fnoise(N,N,[3,8,20],21)*0.5+0.6,0,1.4)
a=np.clip(plume*nn*1.2,0,1)*0.85
sm[...,:3]=np.array([0.82,0.9,1.0]); sm[...,3]=a
g=np.random.default_rng(22)
for _ in range(260):
    x=C+R*g.uniform(2.05,2.9); y=C+R*g.normal(-0.05,0.35)
    if not (4<x<N-4 and 4<y<N-4): continue
    rad=g.uniform(0.6,1.8); b=g.uniform(0.4,1)
    yy,xx=np.mgrid[-5:6,-5:6]; gg=np.exp(-(xx**2+yy**2)/(2*rad*rad))*b
    X,Y=int(x),int(y)
    sm[Y-5:Y+6,X-5:X+6,:3]=sm[Y-5:Y+6,X-5:X+6,:3]*(1-gg[...,None])+np.array([0.55,1,1])*gg[...,None]
    sm[Y-5:Y+6,X-5:X+6,3]=np.maximum(sm[Y-5:Y+6,X-5:X+6,3],gg)
save(sm,'bh_smoke.png')
# ------------------------------------------------------------ speed-line streak (512x64): sharp pink-white head on the right, magenta glow, tail fades left
W,H=512,64
ys2,xs2=np.mgrid[0:H,0:W].astype(float)+0.5
t=xs2/W; yc=(ys2-H/2)
head=np.clip((0.985-t)/0.015,0,1)
width=1.2+5.5*t**1.5
coreA=np.exp(-(yc/width)**2)*t**2.2*head
glowA=np.exp(-(yc/(width*3.2))**2)*t**1.6*head*0.55
st=np.zeros((H,W,4))
magenta=np.array([0.95,0.25,0.85]); pinkw=np.array([1,0.9,0.98])
wcore=np.clip(coreA*1.4,0,1)[...,None]
st[...,:3]=pinkw*wcore+magenta*(1-wcore)
st[...,3]=np.clip(coreA+glowA,0,1)
save(st,'streak.png')
# glitter sparkle (128) and speck (64)
S=128; ys3,xs3=np.mgrid[0:S,0:S].astype(float)+0.5; ax,ay=xs3-S/2,ys3-S/2; rr3=np.sqrt(ax*ax+ay*ay)
sp=np.exp(-(rr3/5)**2)+np.exp(-(np.abs(ay)/1.4))*np.exp(-np.abs(ax)/22)+np.exp(-(np.abs(ax)/1.4))*np.exp(-np.abs(ay)/22)+0.4*np.exp(-(rr3/14)**2)
gl=np.zeros((S,S,4)); gl[...,:3]=1; gl[...,3]=np.clip(sp,0,1); save(gl,'glitter.png')
S=64; ys4,xs4=np.mgrid[0:S,0:S].astype(float)+0.5; rr4=np.hypot(xs4-S/2,ys4-S/2)
spk=np.zeros((S,S,4)); spk[...,:3]=1; spk[...,3]=np.clip(np.exp(-(rr4/5)**2)+0.35*np.exp(-(rr4/14)**2),0,1); save(spk,'speck.png')
# overload noise tile (1024): dense white glyph marks, lines and data blocks
ov=Image.new('RGBA',(1024,1024),(0,0,0,0)); d=ImageDraw.Draw(ov)
fonts=[]
for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
    if os.path.exists(p):
        for sz in (14,20,30): fonts.append(ImageFont.truetype(p,sz))
chars='01∞∑∫∂√≈≠≡∆∇λΩπφψ#%&@$<>[]{}|/\\*+=^~ABCDEFGHIJKLMNOPQRSTUVWXYZ'
for _ in range(1400):
    x,y=int(rng.integers(0,1024)),int(rng.integers(0,1024)); a=int(rng.integers(90,255))
    k=rng.random()
    if k<0.55 and fonts: d.text((x,y),''.join(rng.choice(list(chars),int(rng.integers(1,7)))),font=fonts[int(rng.integers(len(fonts)))],fill=(255,255,255,a))
    elif k<0.8: d.line((x,y,x+int(rng.integers(20,260)),y),fill=(255,255,255,a),width=int(rng.integers(1,3)))
    elif k<0.93: d.rectangle((x,y,x+int(rng.integers(4,40)),y+int(rng.integers(2,12))),fill=(255,255,255,a))
    else: d.ellipse((x,y,x+int(rng.integers(6,30)),y+int(rng.integers(6,30))),outline=(255,255,255,a),width=2)
ov.save(os.path.join(OUT,'overload.png'),optimize=True)
print(sorted(os.listdir(OUT)))
