(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GlooCore=factory()})(typeof self!=='undefined'?self:this,function(){
function sample(face,fw,fh,u,v){
  var x=u*(fw-1),y=(1-v)*(fh-1);
  if(x<0)x=0;else if(x>fw-1)x=fw-1;if(y<0)y=0;else if(y>fh-1)y=fh-1;
  var x0=x|0,y0=y|0,x1=x0+1<fw?x0+1:x0,y1=y0+1<fh?y0+1:y0,tx=x-x0,ty=y-y0;
  var i00=(y0*fw+x0)*4,i10=(y0*fw+x1)*4,i01=(y1*fw+x0)*4,i11=(y1*fw+x1)*4,o=[0,0,0];
  for(var c=0;c<3;c++){
    var a=face[i00+c]*(1-tx)+face[i10+c]*tx,b=face[i01+c]*(1-tx)+face[i11+c]*tx;
    o[c]=a*(1-ty)+b*ty;
  }
  return o;
}
function averageColor(face,fw,fh){
  var r=0,g=0,b=0,n=0,step=Math.max(1,Math.floor(fw*fh/4096));
  for(var i=0;i<fw*fh;i+=step){r+=face[i*4];g+=face[i*4+1];b+=face[i*4+2];n++}
  return [r/n,g/n,b/n];
}
function bakeWall(tris,face,fw,fh,N){
  var out=new Uint8Array(N*N*4),filled=new Uint8Array(N*N),avg=averageColor(face,fw,fh);
  for(var t=0;t<tris.length;t++){
    var T=tris[t],cls=T[0];
    var u0=T[1]*N,v0=T[2]*N,u1=T[5]*N,v1=T[6]*N,u2=T[9]*N,v2=T[10]*N;
    var det=(u1-u0)*(v2-v0)-(u2-u0)*(v1-v0);
    if(Math.abs(det)<1e-9)continue;
    var minx=Math.floor(Math.min(u0,u1,u2)),maxx=Math.ceil(Math.max(u0,u1,u2)),miny=Math.floor(Math.min(v0,v1,v2)),maxy=Math.ceil(Math.max(v0,v1,v2));
    for(var y=miny;y<=maxy;y++){
      if(y<0||y>=N)continue;
      for(var x=minx;x<=maxx;x++){
        if(x<0||x>=N)continue;
        var px=x+0.5-u0,py=y+0.5-v0;
        var l1=(px*(v2-v0)-(u2-u0)*py)/det,l2=((u1-u0)*py-px*(v1-v0))/det,l0=1-l1-l2;
        if(l0<-0.02||l1<-0.02||l2<-0.02)continue;
        var c;
        if(cls===2)c=avg;
        else{
          var fu=l0*T[3]+l1*T[7]+l2*T[11],fv=l0*T[4]+l1*T[8]+l2*T[12];
          c=sample(face,fw,fh,fu,fv);
        }
        var o=((N-1-y)*N+x);
        out[o*4]=c[0];out[o*4+1]=c[1];out[o*4+2]=c[2];out[o*4+3]=255;filled[o]=1;
      }
    }
  }
  var q=new Int32Array(N*N),qh=0,qt=0;
  for(var i=0;i<N*N;i++)if(filled[i])q[qt++]=i;
  while(qh<qt){
    var p=q[qh++],px2=p%N,py2=(p/N)|0;
    var nb=[px2>0?p-1:-1,px2<N-1?p+1:-1,py2>0?p-N:-1,py2<N-1?p+N:-1];
    for(var k=0;k<4;k++){
      var n=nb[k];
      if(n<0||filled[n])continue;
      filled[n]=1;out[n*4]=out[p*4];out[n*4+1]=out[p*4+1];out[n*4+2]=out[p*4+2];out[n*4+3]=255;q[qt++]=n;
    }
  }
  return out;
}
function squareFromFace(face,fw,fh,S){
  var side=fh,x0=(fw-side)/2,out=new Uint8Array(S*S*4);
  for(var y=0;y<S;y++)for(var x=0;x<S;x++){
    var u=(x0+(x+0.5)/S*side)/(fw-1),v=1-(y+0.5)/S;
    var c=sample(face,fw,fh,u,v),o=(y*S+x)*4;
    out[o]=c[0];out[o+1]=c[1];out[o+2]=c[2];out[o+3]=255;
  }
  return out;
}
function flipV(src,w,h){
  var out=new Uint8Array(src.length),row=w*4;
  for(var y=0;y<h;y++)out.set(src.subarray(y*row,(y+1)*row),(h-1-y)*row);
  return out;
}
function downsample(src,w,h){
  var nw=Math.max(1,w>>1),nh=Math.max(1,h>>1),out=new Uint8Array(nw*nh*4);
  for(var y=0;y<nh;y++)for(var x=0;x<nw;x++){
    var x0=Math.min(w-1,x*2),x1=Math.min(w-1,x*2+1),y0=Math.min(h-1,y*2),y1=Math.min(h-1,y*2+1);
    for(var c=0;c<4;c++)out[(y*nw+x)*4+c]=(src[(y0*w+x0)*4+c]+src[(y0*w+x1)*4+c]+src[(y1*w+x0)*4+c]+src[(y1*w+x1)*4+c]+2)>>2;
  }
  return out;
}
async function encodeChain(rgba,w,h,levels,encode,onLevel){
  var parts=[],cur=rgba,cw=w,ch=h;
  for(var i=0;i<levels.length;i++){
    var lw=levels[i][0],lh=levels[i][1];
    var data=await encode(cur,lw,lh);
    if(data.length!==levels[i][2])throw new Error('level '+i+' size '+data.length+' != '+levels[i][2]);
    parts.push(data);
    if(onLevel)onLevel(i,levels.length);
    if(i<levels.length-1){cur=downsample(cur,cw,ch);cw=Math.max(1,cw>>1);ch=Math.max(1,ch>>1)}
  }
  var tot=0;for(var j=0;j<parts.length;j++)tot+=parts[j].length;
  var out=new Uint8Array(tot),o=0;
  for(var k=0;k<parts.length;k++){out.set(parts[k],o);o+=parts[k].length}
  return out;
}
async function buildMod(opts){
  var base=opts.base,cfg=opts.config,out=new Uint8Array(base.length);out.set(base);
  var wallRGBA=bakeWall(opts.tris,opts.face,opts.fw,opts.fh,cfg.regions.wall.w);
  if(opts.onStep)opts.onStep('wall');
  var wall=await encodeChain(flipV(wallRGBA,cfg.regions.wall.w,cfg.regions.wall.h),cfg.regions.wall.w,cfg.regions.wall.h,cfg.regions.wall.levels,opts.encode,function(i,n){if(opts.onProgress)opts.onProgress(0.05+0.6*(i+1)/n)});
  out.set(wall,cfg.regions.wall.off);
  if(opts.onStep)opts.onStep('gren');
  var gRGBA=squareFromFace(opts.face,opts.fw,opts.fh,cfg.regions.gren.w);
  var gren=await encodeChain(flipV(gRGBA,cfg.regions.gren.w,cfg.regions.gren.h),cfg.regions.gren.w,cfg.regions.gren.h,cfg.regions.gren.levels,opts.encode,function(i,n){if(opts.onProgress)opts.onProgress(0.7+0.25*(i+1)/n)});
  out.set(gren,cfg.regions.gren.off);
  return out;
}
return {flipV:flipV,sample:sample,bakeWall:bakeWall,squareFromFace:squareFromFace,downsample:downsample,encodeChain:encodeChain,buildMod:buildMod};
});
