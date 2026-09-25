# Generates SatoruPlaceholder.rbxmx: an R15 block rig (15 parts + Motor6Ds) with white hair, a blindfold
# Accessory named "Blindfold", a ProximityPrompt and a small server script that casts the domain from it.
import math, html
ref=[0]
def rid(): ref[0]+=1; return 'RBX%d'%ref[0]
def cf(x=0,y=0,z=0,rx=0,ry=0,rz=0):
    cx,sx=math.cos(rx),math.sin(rx); cy,sy=math.cos(ry),math.sin(ry); cz,sz=math.cos(rz),math.sin(rz)
    # CFrame.Angles(rx,ry,rz) = Rx*Ry*Rz
    Rx=[[1,0,0],[0,cx,-sx],[0,sx,cx]]; Ry=[[cy,0,sy],[0,1,0],[-sy,0,cy]]; Rz=[[cz,-sz,0],[sz,cz,0],[0,0,1]]
    mm=lambda A,B:[[sum(A[i][k]*B[k][j] for k in range(3)) for j in range(3)] for i in range(3)]
    R=mm(mm(Rx,Ry),Rz)
    return (x,y,z,R)
def cfxml(name,c):
    x,y,z,R=c
    return '<CoordinateFrame name="%s"><X>%g</X><Y>%g</Y><Z>%g</Z><R00>%g</R00><R01>%g</R01><R02>%g</R02><R10>%g</R10><R11>%g</R11><R12>%g</R12><R20>%g</R20><R21>%g</R21><R22>%g</R22></CoordinateFrame>'%(name,x,y,z,*R[0],*R[1],*R[2])
def col(r,g,b): return (0xFF<<24)|(r<<16)|(g<<8)|b
MAT={'smooth':272,'fabric':1312,'neon':288}
def part(name,pos,size,color,mat='smooth',anchored=False,transp=0,collide=True,massless=False,cls='Part',extra=''):
    r=rid()
    props=['<string name="Name">%s</string>'%name, cfxml('CFrame',cf(*pos)), '<Vector3 name="size"><X>%g</X><Y>%g</Y><Z>%g</Z></Vector3>'%size,
           '<Color3uint8 name="Color3uint8">%d</Color3uint8>'%col(*color), '<token name="Material">%d</token>'%MAT[mat],
           '<bool name="Anchored">%s</bool>'%str(anchored).lower(), '<float name="Transparency">%g</float>'%transp, '<bool name="CanCollide">%s</bool>'%str(collide).lower(),
           '<bool name="Massless">%s</bool>'%str(massless).lower(), '<token name="TopSurface">0</token>', '<token name="BottomSurface">0</token>', '<token name="shape">1</token>']
    return r,'<Item class="%s" referent="%s"><Properties>%s%s</Properties>'%(cls,r,''.join(props),extra)
def joint(cls,name,p0,p1,c0,c1):
    return '<Item class="%s" referent="%s"><Properties><string name="Name">%s</string><Ref name="Part0">%s</Ref><Ref name="Part1">%s</Ref>%s%s</Properties></Item>'%(cls,rid(),name,p0,p1,cfxml('C0',c0),cfxml('C1',c1))
SKIN=(245,214,188); CLOTH=(24,26,40); PANTS=(18,19,28); HAIR=(238,242,248); BAND=(14,12,16); SHOE=(12,12,14)
G=3.0  # HumanoidRootPart centre height above the ground
P={}
def body(name,off,size,color,mat='smooth',**kw):
    r,x=part(name,(off[0],G+off[1],off[2]),size,color,mat,**kw); P[name]=[r,x,[]]; return r
body('HumanoidRootPart',(0,0,0),(2,2,1),(163,162,165),anchored=True,transp=1,collide=False)
body('LowerTorso',(0,-0.8,0),(2,0.4,1),CLOTH,'fabric')
body('UpperTorso',(0,0.2,0),(2,1.6,1),CLOTH,'fabric')
body('Head',(0,1.5,0),(1.2,1.2,1.2),SKIN)
for s,sx in (('Right',1),('Left',-1)):
    body(s+'UpperArm',(1.5*sx,0.371,0),(1,1.169,1),CLOTH,'fabric')
    body(s+'LowerArm',(1.5*sx,-0.224,0),(1,1.052,1),CLOTH,'fabric')
    body(s+'Hand',(1.5*sx,-0.85,0),(1,0.3,1),SKIN)
    body(s+'UpperLeg',(0.5*sx,-1.45,0),(1,0.9,1),PANTS,'fabric')
    body(s+'LowerLeg',(0.5*sx,-2.3,0),(1,0.8,1),PANTS,'fabric')
    body(s+'Foot',(0.5*sx,-2.85,0),(1,0.3,1),SHOE)
def J(name,p0,p1,c0,c1): P[p1][2].append(joint('Motor6D',name,P[p0][0],P[p1][0],cf(*c0),cf(*c1)))
J('Root','HumanoidRootPart','LowerTorso',(0,-0.8,0),(0,0,0))
J('Waist','LowerTorso','UpperTorso',(0,0.2,0),(0,-0.8,0))
J('Neck','UpperTorso','Head',(0,0.8,0),(0,-0.5,0))
for s,sx in (('Right',1),('Left',-1)):
    J(s+'Shoulder','UpperTorso',s+'UpperArm',(1*sx,0.563,0),(-0.5*sx,0.392,0))
    J(s+'Elbow',s+'UpperArm',s+'LowerArm',(0,-0.334,0),(0,0.261,0))
    J(s+'Wrist',s+'LowerArm',s+'Hand',(0,-0.501,0),(0,0.125,0))
    J(s+'Hip','LowerTorso',s+'UpperLeg',(0.5*sx,-0.2,0),(0,0.45,0))
    J(s+'Knee',s+'UpperLeg',s+'LowerLeg',(0,-0.45,0),(0,0.4,0))
    J(s+'Ankle',s+'LowerLeg',s+'Foot',(0,-0.4,0),(0,0.15,0))
# face decal (mouth shows under the blindfold)
P['Head'][2].append('<Item class="Decal" referent="%s"><Properties><string name="Name">face</string><Content name="Texture"><url>rbxasset://textures/face.png</url></Content><token name="Face">5</token></Properties></Item>'%rid())
# white spiky hair: blocks welded to the head
hair=[]
spikes=[(0,0.55,0.05,1.3,0.45,1.3,0,0,0)]
import random; rr=random.Random(3)
for i in range(11):
    a=i/11*2*math.pi
    x=math.cos(a)*0.42; z=math.sin(a)*0.42+0.05
    spikes.append((x,0.78+rr.uniform(0,0.15),z,0.42,0.6,0.42,-math.sin(a)*0.5,0,math.cos(a)*-0.5))
for i in range(5):
    spikes.append((rr.uniform(-0.3,0.3),0.95+rr.uniform(0,0.2),rr.uniform(-0.2,0.3),0.4,0.55,0.4,rr.uniform(-0.3,0.3),0,rr.uniform(-0.3,0.3)))
hx=''
for i,(x,y,z,w,h,d,rx,ry,rz) in enumerate(spikes):
    r,xml=part('Hair%d'%i,(x,G+1.5+y,z),(w,h,d),HAIR,collide=False,massless=True)
    xml+=joint('Weld','HairWeld',P['Head'][0],r,cf(x,y,z,rx,ry,rz),cf())
    hx+=xml+'</Properties></Item>'.replace('</Properties>','') if False else xml+'</Item>'
# blindfold accessory
hr_,hxml=part('Handle',(0,G+1.62,0),(1.26,0.3,1.26),BAND,'fabric',collide=False,massless=True)
hxml+=joint('Weld','AccessoryWeld',hr_,P['Head'][0],cf(),cf(0,0.12,0))+'</Item>'
acc='<Item class="Accessory" referent="%s"><Properties><string name="Name">Blindfold</string></Properties>%s</Item>'%(rid(),hxml)
# prompt + humanoid + demo script
prompt='<Item class="ProximityPrompt" referent="%s"><Properties><string name="Name">DomainPrompt</string><string name="ActionText">Testar Expansão de Domínio</string><string name="ObjectText">Satoru (placeholder)</string><float name="HoldDuration">0.3</float><float name="MaxActivationDistance">14</float><bool name="RequiresLineOfSight">false</bool></Properties></Item>'%rid()
P['HumanoidRootPart'][2].append(prompt)
hum='<Item class="Humanoid" referent="%s"><Properties><string name="Name">Humanoid</string><token name="RigType">1</token><float name="HipHeight">2</float><float name="MaxHealth">100</float><float name="Health">100</float><string name="DisplayName">Satoru (placeholder)</string></Properties><Item class="Animator" referent="%s"><Properties><string name="Name">Animator</string></Properties></Item></Item>'%(rid(),rid())
demo=open('src/../tools/placeholder_demo.luau').read()
script='<Item class="Script" referent="%s"><Properties><string name="Name">PlaceholderDemo</string><token name="RunContext">1</token><bool name="Disabled">false</bool><ProtectedString name="Source"><![CDATA[%s]]></ProtectedString></Properties></Item>'%(rid(),demo)
items=''.join(v[1]+''.join(v[2])+'</Item>' for v in P.values())
model_ref=rid()
out=('<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">'
     '<Item class="Model" referent="%s"><Properties><string name="Name">Satoru</string><Ref name="PrimaryPart">%s</Ref></Properties>%s%s%s%s%s</Item></roblox>')%(model_ref,P['HumanoidRootPart'][0],items,hx,acc,hum,script)
open('SatoruPlaceholder.rbxmx','w').write(out)
print('parts',len(P)+len(spikes)+1)
