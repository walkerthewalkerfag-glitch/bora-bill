import numpy as np, os, wave
from scipy.signal import butter, sosfilt, fftconvolve
SR=44100; OUT='snd'; os.makedirs(OUT,exist_ok=True)
rng=np.random.default_rng(3)
def T(d): return np.arange(int(d*SR))/SR
def lp(x,f,o=2): return sosfilt(butter(o,f,'low',fs=SR,output='sos'),x)
def hp(x,f,o=2): return sosfilt(butter(o,f,'high',fs=SR,output='sos'),x)
def bp(x,f1,f2,o=2): return sosfilt(butter(o,[f1,f2],'band',fs=SR,output='sos'),x)
def ir(dur,decay,seed,bright=6000):
    r=np.random.default_rng(seed); t=T(dur)
    L=lp(r.standard_normal(len(t)),bright)*np.exp(-t/decay); R_=lp(r.standard_normal(len(t)),bright)*np.exp(-t/decay)
    L[:int(0.01*SR)]*=np.linspace(0,1,int(0.01*SR)); R_[:int(0.01*SR)]*=np.linspace(0,1,int(0.01*SR))
    return L/np.abs(L).sum()*40, R_/np.abs(R_).sum()*40
def reverb(st,dur=3.5,decay=0.9,mix=0.35,seed=1,bright=6000):
    L,R_=ir(dur,decay,seed,bright); n=st.shape[0]
    wl=fftconvolve(st[:,0],L)[:n]; wr=fftconvolve(st[:,1],R_)[:n]
    return st*(1-mix)+np.stack([wl,wr],1)*mix
def pan(x,p): return np.stack([x*np.cos((p+1)*np.pi/4),x*np.sin((p+1)*np.pi/4)],1)
def place(buf,x,at):
    i=int(at*SR); n=min(len(x),len(buf)-i)
    if n>0: buf[i:i+n]+=x[:n]
def env(t,a,d): return np.minimum(t/a,1)*np.exp(-np.maximum(t-a,0)/d)
def bell(f,dur,decay,parts=((1,1),(2.76,0.5),(5.4,0.25),(8.93,0.12))):
    t=T(dur); x=sum(a*np.sin(2*np.pi*f*k*t)*np.exp(-t/(decay/(1+0.6*i))) for i,(k,a) in enumerate(parts))
    return x*np.minimum(t/0.004,1)
def write(name,st,peak=0.9):
    st=st/np.abs(st).max()*peak
    d=(np.clip(st,-1,1)*32767).astype('<i2')
    w=wave.open(os.path.join(OUT,name),'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes()); w.close()
    print(name, round(len(st)/SR,2),'s')
# ------------------------------------------------------------------ cast (3.6 s): reverse swell -> impact at 1.35 s -> glass chord + choir
D=3.6; buf=np.zeros((int(D*SR),2)); OPEN=1.35
t=T(OPEN)
sw=rng.standard_normal(len(t)); cut=200*np.exp(np.log(30)*(t/OPEN)**2)
# time-varying lowpass by blocks
blk=1024; y=np.zeros_like(sw)
for i in range(0,len(sw),blk):
    c=float(min(cut[i],18000)); y[i:i+blk]=lp(sw[max(0,i-4096):i+blk],c)[-len(sw[i:i+blk]):]
swell=y*(t/OPEN)**3*0.9
ph=2*np.pi*np.cumsum(60+340*(t/OPEN)**2.5)/SR
whoosh=np.sin(ph)*(t/OPEN)**4*0.35
place(buf,pan(swell,-0.2)+pan(whoosh,0.2),0)
rb=bell(329.63,1.3,0.6)[::-1]*0.35; place(buf,pan(rb,0.4),OPEN-len(rb)/SR)
# impact
ti=T(2.2)
sub=np.sin(2*np.pi*np.cumsum(30+30*np.exp(-ti/0.25))/SR)*np.exp(-ti/0.9)*1.3
dong=bell(55,2.2,1.4)*0.9
glass=sum(bell(f,2.2,1.1,((1,1),(2.0,0.3),(3.01,0.15)))*a for f,a in ((1318.5,0.35),(1661.2,0.28),(1975.5,0.25),(2637,0.12)))
shimmer=hp(rng.standard_normal(len(ti)),6000)*np.exp(-ti/0.6)*0.2
imp=pan(sub+dong,0)+pan(glass,0.3)*0.9+pan(glass[::1],-0.3)*0.6+np.stack([shimmer,np.roll(shimmer,300)],1)
place(buf,imp,OPEN)
# choir pad (A minor add9), vowel-ish formants, from the impact to the end
tc=T(D-OPEN); pad=np.zeros(len(tc))
for f in (110,220,261.63,329.63,493.88):
    for dt in (-0.18,0.0,0.21):
        ff=f*(1+dt/100); saw=2*((ff*tc)%1)-1; pad+=saw*0.12
pad=bp(pad,300,900)+0.6*bp(pad,1100,1700)
pad*=np.minimum(tc/0.6,1)*np.exp(-np.maximum(tc-1.2,0)/0.8)*0.5
place(buf,np.stack([pad,np.roll(pad,441)],1),OPEN)
buf=reverb(buf,4.0,1.1,0.4,5)
write('pv_domain_cast.wav',buf)
# ------------------------------------------------------------------ void loop (8 s seamless)
L=8.0; F=1.5; tl=T(L+F); x=np.zeros((len(tl),2))
for f,a,p in ((55,0.5,-0.3),(55.125,0.4,0.3),(82.5,0.25,0),(110,0.18,-0.5),(164.875,0.1,0.5)):
    x+=pan(np.sin(2*np.pi*f*tl)*a*(0.8+0.2*np.sin(2*np.pi*tl/L)),p)
wind=lp(hp(rng.standard_normal(len(tl)),400),2500)*(0.5+0.5*np.sin(2*np.pi*tl/4))**2*0.25
x+=np.stack([wind,np.roll(wind,2000)],1)
g=np.random.default_rng(9)
for k in range(14):
    at=g.uniform(0,L+F-2.5); f=g.choice([659.25,783.99,987.77,1318.5,1567.98,1975.53])
    b=bell(f,2.4,0.9,((1,1),(2.0,0.2),(3.0,0.1)))*g.uniform(0.05,0.14)
    place(x,pan(b,g.uniform(-0.8,0.8)),at)
x=reverb(x,4.0,1.4,0.45,7,4000)
n=int(L*SR); f_=int(F*SR); out=x[:n].copy(); fade=np.linspace(0,1,f_)[:,None]
out[:f_]=x[:f_]*fade+x[n:n+f_]*(1-fade)
write('pv_void_loop.wav',out,0.8)
# ------------------------------------------------------------------ overload loop for trapped targets (4 s seamless): data chatter
L=4.0; F=0.5; tl=T(L+F); x=np.zeros((len(tl),2))
g=np.random.default_rng(11)
for k in range(260):
    at=g.uniform(0,L+F-0.1); f=g.uniform(900,5200); d=g.uniform(0.008,0.06); tt=T(d)
    kind=g.random()
    if kind<0.5: s=np.sign(np.sin(2*np.pi*f*tt))
    elif kind<0.8: s=np.sin(2*np.pi*(f+g.uniform(-2000,2000)*tt/d)*tt)
    else: s=g.standard_normal(len(tt))
    s*=np.minimum(tt/0.002,1)*np.exp(-tt/(d*0.5))*g.uniform(0.05,0.2)
    place(x,pan(s,g.uniform(-1,1)),at)
hum=np.sin(2*np.pi*120*tl)*0.04+hp(g.standard_normal(len(tl)),7000)*0.03
x+=np.stack([hum,hum],1)
x=np.round(x*48)/48   # bit crush
x=reverb(x,1.2,0.3,0.25,13)
n=int(L*SR); f_=int(F*SR); out=x[:n].copy(); fade=np.linspace(0,1,f_)[:,None]
out[:f_]=x[:f_]*fade+x[n:n+f_]*(1-fade)
write('pv_void_overload.wav',out,0.7)
# ------------------------------------------------------------------ collapse (2.2 s): short reverse suck -> glass shatter + thump
D=2.2; buf=np.zeros((int(D*SR),2)); HIT=0.45
t=T(HIT); suck=lp(rng.standard_normal(len(t)),3000)*(t/HIT)**3*0.6; place(buf,pan(suck,0),0)
th_=T(1.2); thump=np.sin(2*np.pi*np.cumsum(40+60*np.exp(-th_/0.05))/SR)*np.exp(-th_/0.35)
place(buf,pan(thump,0),HIT)
g=np.random.default_rng(15)
for k in range(70):
    at=HIT+abs(g.normal(0,0.12)); f=g.uniform(2500,9000); d=g.uniform(0.05,0.4)
    s=bell(f,d,d*0.3,((1,1),(1.52,0.5),(2.31,0.3)))*g.uniform(0.05,0.2)
    place(buf,pan(s,g.uniform(-1,1)),at)
cr=hp(g.standard_normal(int(0.25*SR)),2500)*np.exp(-T(0.25)/0.05)*0.6
place(buf,np.stack([cr,np.roll(cr,200)],1),HIT)
buf=reverb(buf,2.5,0.7,0.35,17)
write('pv_domain_end.wav',buf)
