import numpy as np, os, math
from PIL import Image
from scipy.ndimage import gaussian_filter, map_coordinates
N=512; OUT='img'
def fn(h,w,s,seed):
    r=np.random.default_rng(seed); a=np.zeros((h,w)); amp=1
    for sc in s:
        n=gaussian_filter(r.standard_normal((h,w)),sc,mode='wrap'); a+=n/n.std()*amp; amp*=0.5
    return a
for k in range(4):
    g=np.random.default_rng(100+k)
    ys,xs=np.mgrid[0:N,0:N].astype(float)+0.5; dx,dy=(xs-N/2)/N,(ys-N/2)/N
    r=np.hypot(dx,dy); th=np.arctan2(dy,dx)
    # blob radius varies with angle: lobes + spikes (splash arms)
    ang=np.linspace(-np.pi,np.pi,720,endpoint=False)
    rad=0.16+0.04*np.sin(ang*3+g.uniform(0,6))+0.03*np.sin(ang*5+g.uniform(0,6))
    for _ in range(g.integers(7,13)):
        c=g.uniform(-np.pi,np.pi); w=g.uniform(0.04,0.12); L=g.uniform(0.08,0.24)
        rad+=L*np.exp(-(np.angle(np.exp(1j*(ang-c)))/w)**2)
    rad=gaussian_filter(rad,2,mode='wrap')
    ri=map_coordinates(rad,[((th+np.pi)/(2*np.pi)*720)%720],order=1,mode='wrap')
    edge=fn(N,N,[3,8],200+k)*0.012
    m=np.clip((ri+edge-r)/0.004,0,1)
    # droplets flung out along the arms
    for _ in range(int(g.integers(40,80))):
        a=g.uniform(-np.pi,np.pi); d=g.uniform(0.2,0.47); s=g.uniform(0.004,0.02)*(1.2-d)
        cx,cy=math.cos(a)*d,math.sin(a)*d
        m=np.maximum(m,np.clip((s-np.hypot(dx-cx,dy-cy))/0.003,0,1))
    # a few elongated drips
    for _ in range(int(g.integers(3,7))):
        a=g.uniform(-np.pi,np.pi); d0=g.uniform(0.18,0.26); L=g.uniform(0.06,0.16)
        ux,uy=math.cos(a),math.sin(a); t=np.clip((dx*ux+dy*uy-d0)/L,0,1)
        px,py=d0*ux+t*L*ux,d0*uy+t*L*uy; wdt=0.012*(1-t*0.7)
        seg=(dx*ux+dy*uy>d0-0.01)&(dx*ux+dy*uy<d0+L)
        m=np.maximum(m,np.where(seg,np.clip((wdt-np.hypot(dx-px,dy-py))/0.003,0,1),0))
    m=np.clip(m,0,1)
    glow=gaussian_filter(m,6)*0.45
    a=np.clip(np.maximum(m,glow),0,1)
    img=np.zeros((N,N,4)); img[...,:3]=np.clip(0.93+0.07*m[...,None]+0*img[...,:3],0,1); img[...,2]=1.0; img[...,3]=a
    img[...,:3]=np.where(m[...,None]>0.5,np.array([1,1,1]),np.array([0.85,0.93,1.0]))
    Image.fromarray((img*255).astype(np.uint8),'RGBA').save(os.path.join(OUT,'splash_%d.png'%(k+1)),optimize=True)
print('ok')
