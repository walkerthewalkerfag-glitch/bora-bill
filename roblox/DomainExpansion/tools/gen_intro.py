import numpy as np
exec(open('gen_sounds.py').read().split('# ------------------------------------------------------------------ cast')[0])
D=1.9; buf=np.zeros((int(D*SR),2)); g=np.random.default_rng(21)
# low tension hum rising
t=T(D); hum=(np.sin(2*np.pi*48*t)+0.5*np.sin(2*np.pi*72.3*t))*np.minimum(t/0.4,1)*(0.12+0.1*t/D)
place(buf,pan(hum,0),0)
# heartbeat thumps
for at in (0.18,0.42,1.0,1.22):
    tt=T(0.35); th=np.sin(2*np.pi*np.cumsum(38+50*np.exp(-tt/0.03))/SR)*np.exp(-tt/0.09)*(0.7 if at in (0.18,1.0) else 0.45)
    place(buf,pan(th,0),at)
# cloth: blindfold pulled up (0.55-0.85), band-passed noise sweep
tc=T(0.34); n=g.standard_normal(len(tc)); cl=np.zeros_like(n); blk=512
for i in range(0,len(n),blk):
    f=900+2600*(i/len(n)); cl[i:i+blk]=bp(n[max(0,i-2048):i+blk],f*0.6,f*1.4)[-len(n[i:i+blk]):]
cl*=np.sin(np.pi*tc/0.34)**1.5*0.5
place(buf,pan(cl,-0.3),0.53)
# eyes: glassy "shing" + sparkle at 0.8
shing=sum(bell(f,1.0,0.35,((1,1),(2.01,0.3),(3.0,0.12)))*a for f,a in ((2093,0.3),(2637,0.25),(3136,0.2),(4186,0.12)))
sp=hp(g.standard_normal(int(0.6*SR)),7000)*np.exp(-T(0.6)/0.12)*0.12
place(buf,pan(shing,0.2),0.8); place(buf,np.stack([sp,np.roll(sp,150)],1),0.8)
# finger snap "tic" at 1.35: sharp click + short chime
tk=T(0.05); click=g.standard_normal(len(tk))*np.exp(-tk/0.004); click=hp(click,1800)*0.9
place(buf,pan(click,0.1),1.35)
ch=bell(1567.98,0.9,0.3,((1,1),(2.76,0.25)))*0.3; place(buf,pan(ch,0.3),1.35)
buf=reverb(buf,2.0,0.5,0.28,23)
write('pv_domain_intro.wav',buf)
