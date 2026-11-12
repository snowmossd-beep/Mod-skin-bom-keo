(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WallViewer=factory()})(typeof self!=='undefined'?self:this,function(){
'use strict';
function persp(fovy,aspect,n,f){
  var t=1/Math.tan(fovy/2),o=new Float32Array(16);
  o[0]=t/aspect;o[5]=t;o[10]=(f+n)/(n-f);o[11]=-1;o[14]=2*f*n/(n-f);
  return o;
}
function norm(v){var l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l]}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function lookAt(eye,ctr,up){
  var z=norm([eye[0]-ctr[0],eye[1]-ctr[1],eye[2]-ctr[2]]),x=norm(cross(up,z)),y=cross(z,x),o=new Float32Array(16);
  o[0]=x[0];o[4]=x[1];o[8]=x[2];o[12]=-dot(x,eye);
  o[1]=y[0];o[5]=y[1];o[9]=y[2];o[13]=-dot(y,eye);
  o[2]=z[0];o[6]=z[1];o[10]=z[2];o[14]=-dot(z,eye);
  o[15]=1;
  return o;
}
function mul(a,b){
  var o=new Float32Array(16);
  for(var c=0;c<4;c++)for(var r=0;r<4;r++){
    var s=0;for(var k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];
    o[c*4+r]=s;
  }
  return o;
}
var VS='attribute vec3 aPos;attribute vec3 aNrm;attribute vec2 aUv;uniform mat4 uMvp;varying vec2 vUv;varying vec3 vN;void main(){vUv=vec2(aUv.x,1.0-aUv.y);vN=aNrm;gl_Position=uMvp*vec4(aPos,1.0);}';
var FS='precision mediump float;uniform sampler2D uTex;varying vec2 vUv;varying vec3 vN;void main(){vec3 c=texture2D(uTex,vUv).rgb;float l=abs(dot(normalize(vN),normalize(vec3(0.35,0.55,0.75))));gl_FragColor=vec4(c*(0.8+0.2*l),1.0);}';

function Viewer(canvas){
  this.cv=canvas;this.gl=null;this.ok=false;this.yaw=0;this.pitch=0.12;this.zoom=1;this.auto=true;this.active=false;this.raf=0;this.t0=0;
  this.fit=8;this.target=[0,1,0];this.count=0;this.pending=null;
  this.reduce=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(this.reduce)this.auto=false;
}
Viewer.prototype.init=function(mesh){
  var gl=this.cv.getContext('webgl',{antialias:true,alpha:false})||this.cv.getContext('experimental-webgl');
  if(!gl)return false;
  this.gl=gl;
  var sh=function(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o};
  var p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,VS));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
  this.prog=p;this.loc={pos:gl.getAttribLocation(p,'aPos'),nrm:gl.getAttribLocation(p,'aNrm'),uv:gl.getAttribLocation(p,'aUv'),mvp:gl.getUniformLocation(p,'uMvp'),tex:gl.getUniformLocation(p,'uTex')};
  var n=mesh.p.length/3,pos=new Float32Array(mesh.p),nrm=new Float32Array(mesh.n),i;
  for(i=0;i<n;i++){pos[i*3+2]=-pos[i*3+2];nrm[i*3+2]=-nrm[i*3+2]}
  var mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];
  for(i=0;i<n;i++)for(var a=0;a<3;a++){var v=pos[i*3+a];if(v<mn[a])mn[a]=v;if(v>mx[a])mx[a]=v}
  this.target=[(mn[0]+mx[0])/2,(mn[1]+mx[1])/2,(mn[2]+mx[2])/2];this.size=[mx[0]-mn[0],mx[1]-mn[1],mx[2]-mn[2]];
  function buf(target,data){var b=gl.createBuffer();gl.bindBuffer(target,b);gl.bufferData(target,data,gl.STATIC_DRAW);return b}
  this.bPos=buf(gl.ARRAY_BUFFER,pos);this.bNrm=buf(gl.ARRAY_BUFFER,nrm);this.bUv=buf(gl.ARRAY_BUFFER,new Float32Array(mesh.uv));
  this.bIdx=buf(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(mesh.i));this.count=mesh.i.length;
  this.tex=gl.createTexture();
  var self=this;
  this.cv.addEventListener('webglcontextlost',function(e){e.preventDefault();self.ok=false});
  this.setTexture(new Uint8Array([40,40,40,255,40,40,40,255,40,40,40,255,40,40,40,255]),2,2);
  this.ok=true;this.bind();
  return true;
};
Viewer.prototype.setTexture=function(rgba,w,h){
  var gl=this.gl;if(!gl)return;
  gl.bindTexture(gl.TEXTURE_2D,this.tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
  var pot=(w&(w-1))===0&&(h&(h-1))===0;
  if(pot){
    gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
    var ext=gl.getExtension('EXT_texture_filter_anisotropic');
    if(ext)gl.texParameterf(gl.TEXTURE_2D,ext.TEXTURE_MAX_ANISOTROPY_EXT,4);
  }else gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  this.dirty=true;
};
Viewer.prototype.bind=function(){
  var cv=this.cv,self=this,pts={},last=null,d0=0,z0=1;
  cv.addEventListener('pointerdown',function(e){cv.setPointerCapture(e.pointerId);pts[e.pointerId]={x:e.clientX,y:e.clientY};var k=Object.keys(pts);if(k.length===2){d0=Math.hypot(pts[k[0]].x-pts[k[1]].x,pts[k[0]].y-pts[k[1]].y);z0=self.zoom}last={x:e.clientX,y:e.clientY};self.auto=false});
  cv.addEventListener('pointermove',function(e){
    if(!pts[e.pointerId])return;
    var k=Object.keys(pts);pts[e.pointerId]={x:e.clientX,y:e.clientY};
    if(k.length>=2){var d=Math.hypot(pts[k[0]].x-pts[k[1]].x,pts[k[0]].y-pts[k[1]].y);if(d0>0)self.zoom=Math.max(.6,Math.min(1.7,z0*d0/d));self.dirty=true;return}
    self.yaw-=(e.clientX-last.x)*0.008;self.pitch=Math.max(-0.15,Math.min(1.1,self.pitch+(e.clientY-last.y)*0.006));
    last={x:e.clientX,y:e.clientY};self.dirty=true;
  });
  function up(e){delete pts[e.pointerId];var k=Object.keys(pts);if(k.length===1)last={x:pts[k[0]].x,y:pts[k[0]].y}}
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',function(e){e.preventDefault();self.zoom=Math.max(.6,Math.min(1.7,self.zoom*(e.deltaY>0?1.06:1/1.06)));self.dirty=true},{passive:false});
  if(typeof ResizeObserver==='function')new ResizeObserver(function(){self.resize()}).observe(cv.parentNode);
  this.resize();
};
Viewer.prototype.resize=function(){
  var cv=this.cv,dpr=Math.min(2,(typeof devicePixelRatio==='number'?devicePixelRatio:1)),w=Math.max(1,Math.round(cv.clientWidth*dpr)),h=Math.max(1,Math.round(cv.clientHeight*dpr));
  if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}
  var asp=w/h,f=32*Math.PI/180,tw=this.size?this.size[0]:4,th=this.size?this.size[1]:2.4;
  this.fit=Math.max((tw/2)/(Math.tan(f/2)*asp),(th/2)/Math.tan(f/2))*1.04+0.5;
  this.dirty=true;
};
Viewer.prototype.matrix=function(){
  var cv=this.cv,asp=cv.width/cv.height,f=32*Math.PI/180,d=this.fit*this.zoom,cp=Math.cos(this.pitch),t=this.target;
  var eye=[t[0]+d*Math.sin(this.yaw)*cp,t[1]+d*Math.sin(this.pitch),t[2]+d*Math.cos(this.yaw)*cp];
  return mul(persp(f,asp,0.1,60),lookAt(eye,t,[0,1,0]));
};
Viewer.prototype.draw=function(){
  var gl=this.gl;if(!gl||!this.ok)return;
  gl.viewport(0,0,this.cv.width,this.cv.height);
  gl.clearColor(0.02,0.02,0.02,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);
  gl.useProgram(this.prog);
  gl.bindBuffer(gl.ARRAY_BUFFER,this.bPos);gl.enableVertexAttribArray(this.loc.pos);gl.vertexAttribPointer(this.loc.pos,3,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,this.bNrm);gl.enableVertexAttribArray(this.loc.nrm);gl.vertexAttribPointer(this.loc.nrm,3,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,this.bUv);gl.enableVertexAttribArray(this.loc.uv);gl.vertexAttribPointer(this.loc.uv,2,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.bIdx);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.tex);gl.uniform1i(this.loc.tex,0);
  gl.uniformMatrix4fv(this.loc.mvp,false,this.matrix());
  gl.drawElements(gl.TRIANGLES,this.count,gl.UNSIGNED_SHORT,0);
};
Viewer.prototype.frame=function(now){
  if(!this.active)return;
  if(this.auto){this.yaw=0.55*Math.sin(now/2200);this.dirty=true}
  if(this.dirty){this.dirty=false;this.draw()}
  var self=this;this.raf=requestAnimationFrame(function(t){self.frame(t)});
};
Viewer.prototype.setActive=function(on){
  if(on===this.active)return;
  this.active=on;
  if(on){var self=this;this.dirty=true;this.raf=requestAnimationFrame(function(t){self.frame(t)})}
  else cancelAnimationFrame(this.raf);
};
Viewer._math={persp:persp,lookAt:lookAt,mul:mul};
return Viewer;
});
