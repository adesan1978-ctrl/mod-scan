/* มดสแกน: ประมวลผลภาพ */
let CV=null;
function order4(p){const s=[...p].sort((a,b)=>(a.x+a.y)-(b.x+b.y));const tl=s[0],br=s[3];const r=[s[1],s[2]].sort((a,b)=>(a.x-a.y)-(b.x-b.y));return[tl,r[1],br,r[0]]}
/* สำรองถ้า OpenCV ยังโหลดไม่เสร็จ: หาแผ่นกระดาษที่สว่างกว่าพื้น */
function blobQuad(c){
 const w=c.width,h=c.height,d=c.getContext('2d').getImageData(0,0,w,h).data,g=new Uint8Array(w*h),hist=new Array(256).fill(0);
 for(let i=0;i<w*h;i++){const v=(d[i*4]*.3+d[i*4+1]*.59+d[i*4+2]*.11)|0;g[i]=v;hist[v]++}
 let sum=0;for(let i=0;i<256;i++)sum+=i*hist[i];let sB=0,wB=0,best=0,th=128;
 for(let i=0;i<256;i++){wB+=hist[i];if(!wB)continue;const wF=w*h-wB;if(!wF)break;sB+=i*hist[i];const v=wB*wF*(sB/wB-(sum-sB)/wF)**2;if(v>best){best=v;th=i}}
 const lab=new Int32Array(w*h),st=new Int32Array(w*h);let bN=0,bL=0,L=0;
 for(let i=0;i<w*h;i++){if(g[i]<=th||lab[i])continue;L++;let sp=0,n=0;st[sp++]=i;lab[i]=L;
  while(sp){const p=st[--sp];n++;const px=p%w;for(const q of[px>0?p-1:-1,px<w-1?p+1:-1,p-w,p+w])if(q>=0&&q<w*h&&!lab[q]&&g[q]>th){lab[q]=L;st[sp++]=q}}
  if(n>bN){bN=n;bL=L}}
 if(bN<w*h*.12||bN>w*h*.95)return null;
 let tl=[1e9],tr=[-1e9],br=[-1e9],bl=[1e9];
 for(let i=0;i<w*h;i++){if(lab[i]!==bL)continue;const px=i%w,py=(i/w)|0,s=px+py,df=px-py;if(s<tl[0])tl=[s,px,py];if(s>br[0])br=[s,px,py];if(df>tr[0])tr=[df,px,py];if(df<bl[0])bl=[df,px,py]}
 return[tl,tr,br,bl].map(a=>({x:a[1],y:a[2]}));
}
function solve(A,b){const n=b.length;for(let i=0;i<n;i++){let m=i;for(let j=i+1;j<n;j++)if(Math.abs(A[j][i])>Math.abs(A[m][i]))m=j;[A[i],A[m]]=[A[m],A[i]];[b[i],b[m]]=[b[m],b[i]];
 for(let j=i+1;j<n;j++){const f=A[j][i]/A[i][i];for(let k=i;k<n;k++)A[j][k]-=f*A[i][k];b[j]-=f*b[i]}}
 const x=new Array(n);for(let i=n-1;i>=0;i--){let s=b[i];for(let k=i+1;k<n;k++)s-=A[i][k]*x[k];x[i]=s/A[i][i]}return x}
function warp(sc,q,m){
 const D=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),[p0,p1,p2,p3]=q;
 let W=Math.max(D(p0,p1),D(p3,p2)),H=Math.max(D(p0,p3),D(p1,p2));
 if(m==='card'){if(W>=H)H=W*54/85.6;else W=H*54/85.6}
 const k=Math.min(1.6,2600/Math.max(W,H));W=Math.max(10,Math.round(W*k));H=Math.max(10,Math.round(H*k));
 const dst=[[0,0],[W,0],[W,H],[0,H]],A=[],b=[];
 for(let i=0;i<4;i++){const[x,y]=dst[i],u=q[i].x,v=q[i].y;A.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);A.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v)}
 const h=solve(A,b),sw=sc.width,sh=sc.height,sd=sc.getContext('2d').getImageData(0,0,sw,sh).data;
 const out=document.createElement('canvas');out.width=W;out.height=H;const oc=out.getContext('2d'),od=oc.createImageData(W,H),o=od.data;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const z=h[6]*x+h[7]*y+1,sx=(h[0]*x+h[1]*y+h[2])/z,sy=(h[3]*x+h[4]*y+h[5])/z;
  const x0=Math.max(0,Math.min(sw-2,sx|0)),y0=Math.max(0,Math.min(sh-2,sy|0)),fx=Math.max(0,Math.min(1,sx-x0)),fy=Math.max(0,Math.min(1,sy-y0)),i=(y0*sw+x0)*4,j=(y*W+x)*4,r=sw*4;
  for(let c=0;c<3;c++){const a=sd[i+c]+(sd[i+4+c]-sd[i+c])*fx,bb=sd[i+r+c]+(sd[i+r+4+c]-sd[i+r+c])*fx;o[j+c]=a+(bb-a)*fy}o[j+3]=255}
 oc.putImageData(od,0,0);return out;
}

/* ---------- ปรับสีแบบเครื่องสแกน ---------- */
function background(c){
 const f=12,w=Math.max(2,Math.round(c.width/f)),h=Math.max(2,Math.round(c.height/f)),s=document.createElement('canvas');s.width=w;s.height=h;
 const x=s.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(c,0,0,w,h);let im=x.getImageData(0,0,w,h);
 for(let it=0;it<2;it++){const a=im.data,n=new Uint8ClampedArray(a);for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++){const j=(y*w+xx)*4;for(let ch=0;ch<3;ch++){let mx=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const yy=Math.min(h-1,Math.max(0,y+dy)),x2=Math.min(w-1,Math.max(0,xx+dx));mx=Math.max(mx,a[(yy*w+x2)*4+ch])}n[j+ch]=mx}}im=new ImageData(n,w,h)}
 x.putImageData(im,0,0);const b=document.createElement('canvas');b.width=c.width;b.height=c.height;const bx=b.getContext('2d');bx.imageSmoothingQuality='high';bx.drawImage(s,0,0,c.width,c.height);
 return bx.getImageData(0,0,c.width,c.height).data;
}
function applyMode(c,m){
 const out=document.createElement('canvas');out.width=c.width;out.height=c.height;const ox=out.getContext('2d');ox.drawImage(c,0,0);
 if(m==='photo')return out;
 const im=ox.getImageData(0,0,c.width,c.height),d=im.data,bg=background(c);
 for(let i=0;i<d.length;i+=4){
  const r=Math.min(255,d[i]*255/Math.max(bg[i],40)),g=Math.min(255,d[i+1]*255/Math.max(bg[i+1],40)),b=Math.min(255,d[i+2]*255/Math.max(bg[i+2],40));
  if(m==='doc'||m==='card'){const k=m==='card'?1.08:1.15,s=v=>Math.max(0,Math.min(255,(v-255)*k+251));d[i]=s(r);d[i+1]=s(g);d[i+2]=s(b)}
  else{let L=r*.3+g*.59+b*.11;if(m==='bw')L=Math.max(0,Math.min(255,(L-100)*255/100));else L=Math.max(0,Math.min(255,(L-255)*1.15+251));d[i]=d[i+1]=d[i+2]=L}}
 sharpen(im,m==='bw'?.4:.9);ox.putImageData(im,0,0);return out;
}
function sharpen(im,amt){const w=im.width,h=im.height,d=im.data,s=new Uint8ClampedArray(d);
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=(y*w+x)*4;for(let c=0;c<3;c++){const v=s[i+c],bl=(s[i-4+c]+s[i+4+c]+s[i-w*4+c]+s[i+w*4+c]+v*4)/8;d[i+c]=v+amt*(v-bl)*2}}}


async function makePdf(blobs){
 const enc=new TextEncoder(),parts=[],offs=[];let off=0;const push=x=>{const u=typeof x==='string'?enc.encode(x):x;parts.push(u);off+=u.length};
 const n=blobs.length,N=2+n*3;push('%PDF-1.4\n');push(new Uint8Array([37,226,227,207,211,10]));
 const obj=(id,s)=>{offs[id]=off;push(`${id} 0 obj\n${s}\nendobj\n`)};
 obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,`<< /Type /Pages /Kids [${blobs.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] /Count ${n} >>`);
 for(let i=0;i<n;i++){
  const bytes=new Uint8Array(await blobs[i].arrayBuffer()),bm=await createImageBitmap(blobs[i]),w=bm.width,h=bm.height;bm.close&&bm.close();
  const land=w>h,PW=land?841.89:595.28,PH=land?595.28:841.89,m=14,s=Math.min((PW-m*2)/w,(PH-m*2)/h),dw=w*s,dh=h*s,x=(PW-dw)/2,y=(PH-dh)/2;
  const pid=3+i*3,iid=pid+1,cid=pid+2,cs=`q ${dw.toFixed(2)} 0 0 ${dh.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im0 Do Q`;
  obj(pid,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 ${iid} 0 R >> >> /Contents ${cid} 0 R >>`);
  offs[iid]=off;push(`${iid} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);push(bytes);push('\nendstream\nendobj\n');
  obj(cid,`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`);
 }
 const xr=off;push(`xref\n0 ${N+1}\n0000000000 65535 f \n`+offs.slice(1,N+1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join(''));
 push(`trailer\n<< /Size ${N+1} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`);return new Blob(parts,{type:'application/pdf'});
}


/* มดสแกน: ตัวจับแผ่นเอกสาร รุ่น 2
   หาผู้สมัครหลายวิธี (ขอบภาพหลายระดับ, สีกระดาษ, ความสว่าง) แล้วให้คะแนนจาก
   ความเป็นสี่เหลี่ยม ขนาด และ "เส้นขอบจริง" ตลอดแนวทั้งสี่ด้าน จากนั้นเกลาขอบให้แม่นด้วยการฟิตเส้นตรง */
function quadArea(q){let a=0;for(let i=0;i<4;i++){const p=q[i],n=q[(i+1)%4];a+=p.x*n.y-n.x*p.y}return Math.abs(a)/2}
function quadOK(q,W,H){
 for(let i=0;i<4;i++){const a=q[(i+3)%4],b=q[i],c=q[(i+1)%4];const v1x=a.x-b.x,v1y=a.y-b.y,v2x=c.x-b.x,v2y=c.y-b.y;
  const l1=Math.hypot(v1x,v1y),l2=Math.hypot(v2x,v2y);if(l1<Math.min(W,H)*.12||l2<Math.min(W,H)*.12)return false;
  const ang=Math.acos(Math.max(-1,Math.min(1,(v1x*v2x+v1y*v2y)/(l1*l2))))*180/Math.PI;if(ang<50||ang>130)return false;
  const cr=v1x*v2y-v1y*v2x;if(i===0)quadOK.s=Math.sign(cr);else if(Math.sign(cr)!==quadOK.s)return false}
 const L=i=>Math.hypot(q[i].x-q[(i+1)%4].x,q[i].y-q[(i+1)%4].y);
 if(Math.min(L(0),L(2))/Math.max(L(0),L(2))<.45||Math.min(L(1),L(3))/Math.max(L(1),L(3))<.45)return false;
 return true}
function edgeSupport(q,E,W,H){ // สัดส่วนของจุดบนแต่ละด้านที่ตรงกับเส้นขอบจริง
 const f=[];for(let i=0;i<4;i++){const a=q[i],b=q[(i+1)%4];let hit=0,n=0,border=0;
  for(let t=.04;t<=.96;t+=.02){const x=Math.round(a.x+(b.x-a.x)*t),y=Math.round(a.y+(b.y-a.y)*t);n++;
   if(x<=2||y<=2||x>=W-3||y>=H-3){border++;continue}if(E[y*W+x])hit++}
  f.push(border>n*.6?.45:hit/Math.max(1,n-border))}
 return f}
function docCandidates(canvas){
 const cv=CV,W=canvas.width,H=canvas.height,A=W*H,out=[];
 const src=cv.imread(canvas),g=new cv.Mat(),b=new cv.Mat(),e=new cv.Mat(),acc=new cv.Mat(),hsv=new cv.Mat(),ch=new cv.MatVector(),k3=cv.Mat.ones(3,3,cv.CV_8U),k5=cv.Mat.ones(5,5,cv.CV_8U);
 const cs=new cv.MatVector(),hi=new cv.Mat();
 const fromMask=(m,mode)=>{cv.findContours(m,cs,hi,mode,cv.CHAIN_APPROX_SIMPLE);
  for(let i=0;i<cs.size();i++){const c=cs.get(i),a=cv.contourArea(c);
   if(a>A*.08&&a<A*.995){const hull=new cv.Mat(),ap=new cv.Mat();cv.convexHull(c,hull,false,true);const ha=cv.contourArea(hull);
    for(const ep of [.012,.02,.03,.045,.065]){cv.approxPolyDP(hull,ap,ep*cv.arcLength(hull,true),true);if(ap.rows<=4)break}
    if(ap.rows===4){const q=[];for(let j=0;j<4;j++)q.push({x:ap.data32S[j*2],y:ap.data32S[j*2+1]});out.push({q:order4(q),solid:a/Math.max(1,ha)})}
    hull.delete();ap.delete()}c.delete()}};
 try{
  cv.cvtColor(src,g,cv.COLOR_RGBA2GRAY);cv.GaussianBlur(g,b,new cv.Size(5,5),0);
  acc.create(H,W,cv.CV_8U);acc.setTo(new cv.Scalar(0));
  {const b7=new cv.Mat();cv.GaussianBlur(g,b7,new cv.Size(9,9),0);cv.Canny(b7,e,8,24);cv.bitwise_or(acc,e,acc);b7.delete()}
  for(const [lo,hiT] of [[20,60],[40,110],[70,180]]){cv.Canny(b,e,lo,hiT);cv.bitwise_or(acc,e,acc);cv.morphologyEx(e,e,cv.MORPH_CLOSE,k5);fromMask(e,cv.RETR_LIST)}
  // สีกระดาษ: กระดาษมักซีดและสว่าง ต่างจากโต๊ะที่มีสี
  cv.cvtColor(src,hsv,cv.COLOR_RGB2HSV);cv.split(hsv,ch);const s=ch.get(1);cv.GaussianBlur(s,s,new cv.Size(5,5),0);
  cv.Canny(s,e,15,45);cv.bitwise_or(acc,e,acc);cv.morphologyEx(e,e,cv.MORPH_CLOSE,k5);fromMask(e,cv.RETR_LIST);
  cv.threshold(s,e,0,255,cv.THRESH_BINARY_INV+cv.THRESH_OTSU);cv.morphologyEx(e,e,cv.MORPH_OPEN,k5);fromMask(e,cv.RETR_EXTERNAL);s.delete();
  // ความสว่าง
  cv.threshold(b,e,0,255,cv.THRESH_BINARY+cv.THRESH_OTSU);cv.morphologyEx(e,e,cv.MORPH_OPEN,k5);fromMask(e,cv.RETR_EXTERNAL);
  cv.morphologyEx(e,e,cv.MORPH_CLOSE,cv.Mat.ones(15,15,cv.CV_8U));fromMask(e,cv.RETR_EXTERNAL);
  // เส้นตรงยาว: ทนกับนิ้วบังขอบ แสงสะท้อน และพื้นสีใกล้กระดาษ
  try{houghCands(acc,W,H,out)}catch(x){}
  cv.dilate(acc,acc,k3);
  return{c:out,E:acc.data.slice(),L:b.data.slice(),W,H};
 }finally{[src,g,b,e,acc,hsv,ch,k3,k5,cs,hi].forEach(m=>{try{m.delete()}catch(x){}})}
}
function houghCands(edges,W,H,out){
 const cv=CV,ls=new cv.Mat(),mn=Math.min(W,H);
 cv.HoughLinesP(edges,ls,1,Math.PI/180,40,mn*.18,mn*.05);
 let L=[];for(let i=0;i<ls.rows;i++){const x1=ls.data32S[i*4],y1=ls.data32S[i*4+1],x2=ls.data32S[i*4+2],y2=ls.data32S[i*4+3];
  let th=Math.atan2(y2-y1,x2-x1);if(th<0)th+=Math.PI;if(th>=Math.PI)th-=Math.PI;const nx=-Math.sin(th),ny=Math.cos(th),rho=x1*nx+y1*ny;L.push({th,nx,ny,rho,len:Math.hypot(x2-x1,y2-y1),x:(x1+x2)/2,y:(y1+y2)/2})}
 ls.delete();
 // รวมเส้นที่ซ้อนกัน
 L.sort((a,b)=>b.len-a.len);const M=[];
 for(const l of L){const d=(a,b)=>{let t=Math.abs(a-b);return Math.min(t,Math.PI-t)};
  const m=M.find(o=>d(o.th,l.th)<.06&&Math.abs(o.nx*l.x+o.ny*l.y-o.rho)<mn*.02);if(m)m.len+=l.len;else M.push({...l})}
 const top=M.sort((a,b)=>b.len-a.len).slice(0,36);if(top.length<4)return;
 const ad=(a,b)=>{let t=Math.abs(a-b);return Math.min(t,Math.PI-t)};
 const th0=top[0].th,A=top.filter(l=>ad(l.th,th0)<.6).slice(0,13),B=top.filter(l=>ad(l.th,th0)>.95).slice(0,13);
 const X=(a,b)=>{const det=a.nx*b.ny-a.ny*b.nx;if(Math.abs(det)<1e-6)return null;return{x:(a.rho*b.ny-a.ny*b.rho)/det,y:(a.nx*b.rho-a.rho*b.nx)/det}};
 for(let i=0;i<A.length;i++)for(let j=i+1;j<A.length;j++){if(ad(A[i].th,A[j].th)>.6)continue;
  for(let k=0;k<B.length;k++)for(let l=k+1;l<B.length;l++){if(ad(B[k].th,B[l].th)>.6)continue;
   const ps=[X(A[i],B[k]),X(A[i],B[l]),X(A[j],B[k]),X(A[j],B[l])];if(ps.some(p=>!p||p.x<-2||p.y<-2||p.x>W+2||p.y>H+2))continue;
   out.push({q:order4(ps),solid:1,h:1})}}
}
function sideContrast(q,Lg,W,H){const f=[];const cx=(q[0].x+q[1].x+q[2].x+q[3].x)/4,cy=(q[0].y+q[1].y+q[2].y+q[3].y)/4,off=Math.max(3,Math.min(W,H)*.012);
 for(let i=0;i<4;i++){const a=q[i],b=q[(i+1)%4],L=Math.hypot(b.x-a.x,b.y-a.y);let nx=-(b.y-a.y)/L,ny=(b.x-a.x)/L;if((cx-a.x)*nx+(cy-a.y)*ny<0){nx=-nx;ny=-ny}
  let hit=0,n=0;for(let t=.06;t<=.94;t+=.03){const px=a.x+(b.x-a.x)*t,py=a.y+(b.y-a.y)*t,ix=Math.round(px+nx*off),iy=Math.round(py+ny*off),ox=Math.round(px-nx*off),oy=Math.round(py-ny*off);
   if(ox<0||oy<0||ox>=W||oy>=H){continue}n++;if(Lg[iy*W+ix]>Lg[oy*W+ox]+7)hit++}
  f.push(n<8?.5:hit/n)}return f}
function paperness(q,Lg,W,H){
 const at=(u,v)=>{const x=(1-v)*((1-u)*q[0].x+u*q[1].x)+v*((1-u)*q[3].x+u*q[2].x),y=(1-v)*((1-u)*q[0].y+u*q[1].y)+v*((1-u)*q[3].y+u*q[2].y);return{x,y}};
 const inn=[],out=[];for(let i=1;i<12;i++)for(let j=1;j<12;j++){const p=at(i/12,j/12);inn.push(Lg[Math.round(p.y)*W+Math.round(p.x)])}
 for(let t=0;t<1;t+=1/24){for(const [u,v] of [[t,-.07],[1.07,t],[1-t,1.07],[-.07,1-t]]){const p=at(u,v),x=Math.round(p.x),y=Math.round(p.y);if(x>=0&&y>=0&&x<W&&y<H)out.push(Lg[y*W+x])}}
 const md=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length*.5)]};const p70=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length*.7)]};
 const q25=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length*.25)]};const mi=q25(inn);if(out.length<10)return{p:.5,mi};
 return{p:Math.max(0,Math.min(1,(mi-p70(out))/35)),mi}}
function pickDoc(r){
 const{W,H,E}=r,A=W*H,all=[],big=[];let best=null,bs=0;
 for(const c of r.c){const q=c.q;if(!quadOK(q,W,H))continue;const af=quadArea(q)/A;if(af<.1)continue;
  if(af>.7){const p0=paperness(q,r.L,W,H);big.push({q,a:af,mi:p0.mi})}
  const e=edgeSupport(q,E,W,H),k=sideContrast(q,r.L,W,H),f=e.map((v,i)=>v===.45?.45:Math.max(v,k[i]*.9)*(.5+.5*k[i])),mf=f.reduce((x,y)=>x+y,0)/4,mn=Math.min(...f);if(mn<.22)continue;
  const pp=paperness(q,r.L,W,H);if(pp.mi<70)continue;
  const sc=Math.sqrt(af)*mf*mf*(.55+.45*mn)*(c.solid>.9?1:.85)*(.3+.7*pp.p);
  all.push({q,score:sc,a:af,pp:pp.p,mi:pp.mi,mn,kmin:Math.min(...k)});if(sc>bs){bs=sc;best={q,score:sc,f,mi:pp.mi,a:af,pp:pp.p}}}
 if(best){const inside=(p,Q)=>{for(let i=0;i<4;i++){const a=Q[i],b=Q[(i+1)%4];const L=Math.hypot(b.x-a.x,b.y-a.y);if(((b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x))/L<-Math.max(4,Math.min(W,H)*.02))return false}return true};
  const ba=quadArea(best.q)/A;let pick=best;
  for(const c of all){if(c.a>ba*1.03&&c.a<ba*2.6&&c.mn>.55&&c.kmin>.5&&(c.mi>=best.mi-22||c.kmin>.75)&&best.q.every(p=>inside(p,c.q))&&c.a>pick.a)pick=c}
  best=pick}
 // กระดาษเต็มเฟรม: ขอบชิดขอบภาพ หาเส้นขอบรอบนอกไม่ได้
 if((!best||best.pp<.15)&&big.length){const ref=best?best.mi:0;let g=null;for(const c of big)if(c.mi>=ref-25&&c.mi>110&&(!g||c.a>g.a))g=c;if(g)best={q:g.q,score:.2,a:g.a,mi:g.mi,pp:.5}}
 return best}
/* เกลาขอบ: หาตำแหน่งขอบกระดาษจริงตามแนวตั้งฉากของแต่ละด้าน แล้วฟิตเส้นตรงหามุมใหม่ */
function refineQuad(canvas,q){
 const M=1400,k=Math.min(1,M/Math.max(canvas.width,canvas.height)),w=Math.round(canvas.width*k),h=Math.round(canvas.height*k);
 const t=document.createElement('canvas');t.width=w;t.height=h;const x=t.getContext('2d');x.drawImage(canvas,0,0,w,h);
 const d=x.getImageData(0,0,w,h).data,g=new Float32Array(w*h);for(let i=0;i<w*h;i++)g[i]=d[i*4]*.3+d[i*4+1]*.59+d[i*4+2]*.11;
 const G=(px,py)=>{const X=Math.round(px),Y=Math.round(py);if(X<1||Y<1||X>=w-1||Y>=h-1)return null;return g[Y*w+X]};
 const P=q.map(p=>({x:p.x*k,y:p.y*k})),diag=Math.hypot(w,h),R=Math.max(6,diag*.018),lines=[];
 const cen={x:(P[0].x+P[1].x+P[2].x+P[3].x)/4,y:(P[0].y+P[1].y+P[2].y+P[3].y)/4};
 for(let i=0;i<4;i++){const a=P[i],b=P[(i+1)%4],L=Math.hypot(b.x-a.x,b.y-a.y),ux=(b.x-a.x)/L,uy=(b.y-a.y)/L;let nx=-uy,ny=ux;
  if((cen.x-a.x)*nx+(cen.y-a.y)*ny<0){nx=-nx;ny=-ny} // ชี้เข้าหากระดาษ
  const pts=[];
  for(let s=.08;s<=.92;s+=.02){const bx=a.x+(b.x-a.x)*s,by=a.y+(b.y-a.y)*s;let bestO=null,bestG=0;
   const prof=[];for(let o=-R;o<=R;o+=.5){const i1=G(bx+nx*(o+1.5),by+ny*(o+1.5)),i0=G(bx+nx*(o-1.5),by+ny*(o-1.5));prof.push(i1==null||i0==null?0:i1-i0)} // กระดาษสว่างกว่าด้านนอก
   const mx=Math.max(...prof);if(mx>12){for(let j=1;j<prof.length-1;j++){if(prof[j]>=mx*.55&&prof[j]>=prof[j-1]&&prof[j]>=prof[j+1]){bestO=-R+j*.5;bestG=prof[j];break}}}
   if(bestO!=null&&bestG>12)pts.push({x:bx+nx*bestO,y:by+ny*bestO})}
  if(pts.length<8){lines.push(null);continue}
  let use=pts;for(let it=0;it<3;it++){const fit=fitLine(use);if(!fit)break;const res=use.map(p=>Math.abs((p.x-fit.x)*fit.nx+(p.y-fit.y)*fit.ny));const thr=Math.max(1.5,median(res)*2.5);const nu=use.filter((p,j)=>res[j]<=thr);if(nu.length<6||nu.length===use.length){lines[i]=fit;break}use=nu;lines[i]=fitLine(use)}
  if(!lines[i])lines[i]=fitLine(use)}
 const out=[];for(let i=0;i<4;i++){const l1=lines[(i+3)%4],l2=lines[i];let p=null;if(l1&&l2)p=intersect(l1,l2);
  if(!p||Math.hypot(p.x-P[i].x,p.y-P[i].y)>R*2)p=P[i];out.push({x:p.x/k,y:p.y/k})}
 return out}
function median(a){const s=[...a].sort((x,y)=>x-y);return s[s.length>>1]||0}
function fitLine(ps){if(ps.length<2)return null;let mx=0,my=0;for(const p of ps){mx+=p.x;my+=p.y}mx/=ps.length;my/=ps.length;let sxx=0,syy=0,sxy=0;
 for(const p of ps){const dx=p.x-mx,dy=p.y-my;sxx+=dx*dx;syy+=dy*dy;sxy+=dx*dy}const th=.5*Math.atan2(2*sxy,sxx-syy),dx=Math.cos(th),dy=Math.sin(th);return{x:mx,y:my,dx,dy,nx:-dy,ny:dx}}
function intersect(a,b){const det=a.dx*b.dy-a.dy*b.dx;if(Math.abs(det)<1e-6)return null;const t=((b.x-a.x)*b.dy-(b.y-a.y)*b.dx)/det;return{x:a.x+a.dx*t,y:a.y+a.dy*t}}
/* ใช้งาน: canvas เล็ก (~500px) สำหรับกล้องสด */
function docQuad(canvas){const r=docCandidates(canvas),b=pickDoc(r);return b?b.q:null}
function detectDoc(canvas,size,refine=true){
 const S=size/Math.max(canvas.width,canvas.height),t=document.createElement('canvas');t.width=Math.round(canvas.width*S);t.height=Math.round(canvas.height*S);
 t.getContext('2d').drawImage(canvas,0,0,t.width,t.height);let q=null;
 try{q=CV?docQuad(t):blobQuad(t)}catch(e){q=null}
 if(!q)return null;q=q.map(p=>({x:p.x/S,y:p.y/S}));
 if(refine){try{q=refineQuad(canvas,q)}catch(e){}}
 return q}

function cvQuad(c){return docQuad(c)}
function detectOn(c,size){return detectDoc(c,500,false)}
