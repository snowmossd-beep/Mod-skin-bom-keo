import UnityPy,glob,os,sys,copy,json,struct,numpy as np,lz4.block
import UnityPy.helpers.CompressionHelper as CH
from UnityPy.helpers.MeshHelper import MeshHandler
from UnityPy.streams import EndianBinaryReader
from PIL import Image
SRC=sys.argv[1];PLAT=sys.argv[2];LABEL=sys.argv[3];DEVNAME=sys.argv[4];OUT=sys.argv[5]
WALL_NAME='IceWall_Bunker_New_Spirit24_D';GREN_NAME='3P_EW_GlooShield_Spirit24_D'
CHUNK=131072
state={'regions':[],'comp_off':None}
def hc(d): return lz4.block.compress(d,mode='high_compression',compression=16,store_size=False)
def my_chunk_compress(data,flag):
    sw=flag&0x3F
    spans=[(a,b) for a,b in state['regions']]
    comp=bytearray();info=[];p=0;n=len(data);cstart={}
    while p<n:
        ln=min(CHUNK,n-p);seg=data[p:p+ln]
        raw=any(p<b and p+ln>a for a,b in spans)
        if not raw:
            c=hc(seg)
            if len(c)>=ln: raw=True
        cstart[p]=len(comp)
        if raw: comp.extend(seg);info.append((ln,ln,flag^sw))
        else: comp.extend(c);info.append((ln,len(c),flag))
        p+=ln
    state['cstart']=cstart;state['total_comp']=len(comp)
    return bytes(comp),info
CH.chunk_based_compress=my_chunk_compress
import UnityPy.files.BundleFile as BF
if hasattr(BF,'CompressionHelper'): BF.CompressionHelper.chunk_based_compress=my_chunk_compress
e=UnityPy.load(SRC);objs={o.path_id:o for o in e.objects}
orig=os.path.getsize(SRC)
ab=[o for o in e.objects if o.type.name=='AssetBundle'][0].read_typetree()
cont={k:v['asset']['m_PathID'] for k,v in ab['m_Container']}
NEW_ID=[o.path_id for o in e.objects if o.type.name=='Mesh' and o.read().m_Name=='IceWall_Bunker_New'][0]
a0=UnityPy.load(SRC)
new_tree=[o for o in a0.objects if o.path_id==NEW_ID][0].read_typetree()
byname={}
for o in e.objects:
    if o.type.name in('Texture2D',): byname[o.read().m_Name]=o.path_id
WALL_ID=byname[WALL_NAME];GREN_ID=byname[GREN_NAME]
nm=0
for o in e.objects:
    if o.type.name=='Mesh':
        n=o.read().m_Name
        if n.lower().startswith('icewall_bunker') and o.path_id!=NEW_ID:
            if n.endswith('_A') or n.endswith('_Crack'): continue
            t2=copy.deepcopy(new_tree);t2['m_Name']=n;o.save_typetree(t2);nm+=1
print('meshes replaced',nm)
mc=0
for o in e.objects:
    if o.type.name=='Material':
        t=o.read_typetree();n=t['m_Name'];ch=False
        if n.lower().startswith('icewall_bunker') and 'crack' not in n.lower():
            for k,v in t['m_SavedProperties']['m_TexEnvs']:
                if k in('_MainTex','_FrontTex','_BackTex'): v['m_Texture']={'m_FileID':0,'m_PathID':WALL_ID};ch=True
            fl=t['m_SavedProperties']['m_Floats']
            for i,(k,val) in enumerate(fl):
                if k in('_ReflectIntensity','_SpecularIntensity','_Shininess'): fl[i]=(k,0.0);ch=True
                elif k in('_AmbientLight','_DiffuseIntensity','_MidIntensity','_BackIntensity','_FrontIntensity'): fl[i]=(k,1.0);ch=True
        elif n.startswith('3P_EW_Grenade_GlooShield'):
            for k,v in t['m_SavedProperties']['m_TexEnvs']:
                if k=='_MainTex': v['m_Texture']={'m_FileID':0,'m_PathID':GREN_ID};ch=True
        if ch: o.save_typetree(t);mc+=1
print('materials',mc)
def tr_of(g):
    for c in g['m_Component']:
        co=objs.get(c['component']['m_PathID'])
        if co and co.type.name=='Transform': return co.read_typetree()
dis=0;seen=set()
def vw(pid):
    global dis
    if pid in seen: return
    seen.add(pid);g=objs[pid].read_typetree();t=tr_of(g)
    for c in g['m_Component']:
        co=objs.get(c['component']['m_PathID'])
        if not co: continue
        if co.type.name in('ParticleSystemRenderer','MeshRenderer'):
            r=co.read_typetree()
            names=[objs[m['m_PathID']].read().m_Name for m in r['m_Materials'] if m['m_PathID'] in objs]
            if co.type.name=='ParticleSystemRenderer' or (names and all(x.startswith('VFX') for x in names)):
                if r['m_Enabled']: r['m_Enabled']=0;co.save_typetree(r);dis+=1
    for ch in t['m_Children']: vw(objs[ch['m_PathID']].read_typetree()['m_GameObject']['m_PathID'])
for k,v in cont.items():
    if k.endswith('.prefab') and 'icewall' in k.lower(): vw(v)
print('vfx disabled',dis)
resname=[n for n in e.file.files if n.endswith('.resS')][0]
rs=e.file.files[resname];buf=bytearray(rs.bytes if hasattr(rs,'bytes') else rs)
zero=0
for o in a0.objects:
    if o.type.name=='Texture2D':
        nn=o.read().m_Name
        if (nn.lower().startswith('icewall_bunker') and nn.endswith('_D')) or (nn.startswith('3P_EW_GlooShield') and nn.endswith('_D')):
            sd=o.read_typetree()['m_StreamData']
            if sd['size']: buf[sd['offset']:sd['offset']+sd['size']]=bytes(sd['size']);zero+=sd['size']
print('zeroed old tex bytes',zero)
spath=objs[WALL_ID].read_typetree()['m_StreamData']['path']
def lvl_bytes(w,h): return ((w+7)//8)*((h+7)//8)*16
def chain(w,h):
    out=[];
    while True:
        out.append((w,h,lvl_bytes(w,h)))
        if w==1 and h==1: break
        w=max(1,w//2);h=max(1,h//2)
    return out
WALL_W=1024;GREN_W=256
wl=chain(WALL_W,WALL_W);gl=chain(GREN_W,GREN_W)
wsz=sum(x[2] for x in wl);gsz=sum(x[2] for x in gl)
while len(buf)%16: buf.append(0)
wall_off=len(buf);buf.extend(b'GLOOWALLREGION00'+bytes(wsz-16))
gren_off=len(buf);buf.extend(b'GLOOGRENREGION00'+bytes(gsz-16))
for pid,w,sz,mips,off in ((WALL_ID,WALL_W,wsz,len(wl),wall_off),(GREN_ID,GREN_W,gsz,len(gl),gren_off)):
    t=objs[pid].read_typetree()
    t['m_Width']=w;t['m_Height']=w;t['m_TextureFormat']=51;t['m_MipCount']=mips;t['m_CompleteImageSize']=sz
    t['m_StreamData']={'offset':off,'size':sz,'path':spath};t['image data']=b''
    objs[pid].save_typetree(t)
nr=EndianBinaryReader(bytes(buf));nr.flags=rs.flags;e.file.files[resname]=nr
# find absolute stream offsets of regions by building the same stream order
names=list(e.file.files.keys());acc=0;node_off={}
for n in names:
    f=e.file.files[n];b=f.bytes if isinstance(f,EndianBinaryReader) or hasattr(f,'bytes') else f.save()
    node_off[n]=acc;acc+=len(b)
ws=node_off[resname]+wall_off;gs=node_off[resname]+gren_off
state['regions']=[(ws,gs+gsz)]
data=e.file.save(packer='original')
print('total',len(data),'orig',orig)
if len(data)>orig: print('TOO BIG');sys.exit(1)
tc=state['total_comp'];base_off=len(data)-tc
cstart=state['cstart']
chunk0=(ws//CHUNK)*CHUNK
wall_file=base_off+cstart[chunk0]+(ws-chunk0)
gren_file=wall_file+(gs-ws)
assert data[wall_file:wall_file+16]==b'GLOOWALLREGION00',data[wall_file:wall_file+16]
assert data[gren_file:gren_file+16]==b'GLOOGRENREGION00'
data+=bytes(orig-len(data))
os.makedirs(OUT+'/'+PLAT,exist_ok=True)
open(f'{OUT}/{PLAT}/base.bin','wb').write(data)
cfg={'id':PLAT,'label':LABEL,'fileName':DEVNAME,'size':orig,'regions':{'wall':{'off':wall_file,'w':WALL_W,'h':WALL_W,'levels':[[a,b,c] for a,b,c in wl]},'gren':{'off':gren_file,'w':GREN_W,'h':GREN_W,'levels':[[a,b,c] for a,b,c in gl]}}}
json.dump(cfg,open(f'{OUT}/{PLAT}/config.json','w'))
print('wall file off',wall_file,'gren',gren_file,'slack',orig-len(data) if False else 'ok')
# triangles for baking
m=MeshHandler([o for o in a0.objects if o.path_id==NEW_ID][0].read());m.process()
v=np.array(m.m_Vertices,float).reshape(-1,3);uv=np.array(m.m_UV0,float).reshape(-1,2);tri=np.array(m.get_triangles()[0]).reshape(-1,3)
xmin,xmax=v[:,0].min(),v[:,0].max();ymin,ymax=v[:,1].min(),v[:,1].max()
T=[]
for a,b,c in tri:
    cv=uv[[a,b,c],1].mean();cls=0 if cv>0.58 else (1 if cv>0.12 else 2)
    row=[cls]
    for i in (a,b,c):
        fu=(v[i,0]-xmin)/(xmax-xmin);fv=(v[i,1]-ymin)/(ymax-ymin)
        if cls==0: fu=1-fu
        row+= [round(uv[i,0],5),round(uv[i,1],5),round(fu,5),round(fv,5)]
    T.append(row)
json.dump({'aspect':round((xmax-xmin)/(ymax-ymin),5),'tris':T},open(f'{OUT}/tris.json','w'),separators=(',',':'))
print('tris',len(T),'aspect',(xmax-xmin)/(ymax-ymin))
# thumbnail
d=objs[WALL_ID].read() if False else None
for o in a0.objects:
    if o.type.name=='Texture2D' and o.read().m_Name==WALL_NAME:
        os.makedirs(OUT+'/img',exist_ok=True)
        o.read().image.convert('RGB').resize((256,256)).save(OUT+'/img/anh-duong.webp',quality=82)
