/* มดสแกน: ประมวลผลภาพ */
let CV=null;
function order4(p){const s=[...p].sort((a,b)=>(a.x+a.y)-(b.x+b.y));const tl=s[0],br=s[3];const r=[s[1],s[2]].sort((a,b)=>(a.x-a.y)-(b.x-b.y));return[tl,r[1],br,r[0]]}
function cvQuad(canvas){
 const cv=CV,W=canvas.width,H=canvas.height,img=cv.imread(canvas),g=new cv.Mat(),e=new cv.Mat(),cs=new cv.MatVector(),hi=new cv.Mat(),k=cv.Mat.ones(5,5,cv.CV_8U);
 let best=null,bestA=W*H*.15;
 const scan=(eps)=>{cv.findContours(e,cs,hi,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);
  for(let i=0;i<cs.size();i++){const c=cs.get(i),a=cv.contourArea(c);
   if(a>bestA&&a<W*H*.985){const hull=new cv.Mat(),ap=new cv.Mat();cv.convexHull(c,hull,false,true);
    for(const ep of eps){cv.approxPolyDP(hull,ap,ep*cv.arcLength(hull,true),true);if(ap.rows===4)break}
    if(ap.rows===4&&cv.isContourConvex(ap)){bestA=a;best=[];for(let j=0;j<4;j++)best.push({x:ap.data32S[j*2],y:ap.data32S[j*2+1]})}hull.delete();ap.delete()}
   c.delete()}};
 try{
  cv.cvtColor(img,g,cv.COLOR_RGBA2GRAY);cv.GaussianBlur(g,g,new cv.Size(5,5),0);
  for(const [lo,hiT] of [[40,120],[15,45]]){cv.Canny(g,e,lo,hiT);cv.morphologyEx(e,e,cv.MORPH_CLOSE,k);scan([.02,.04])}
  cv.threshold(g,e,0,255,cv.THRESH_BINARY+cv.THRESH_OTSU);cv.morphologyEx(e,e,cv.MORPH_CLOSE,k);scan([.02,.04,.06]);
  const m=cv.mean(g)[0];cv.threshold(g,e,Math.min(250,m+12),255,cv.THRESH_BINARY);cv.morphologyEx(e,e,cv.MORPH_CLOSE,k);scan([.02,.04,.06])
 }finally{img.delete();g.delete();e.delete();cs.delete();hi.delete();k.delete()}
 return best&&order4(best);
}
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
function detectOn(canvas,size){
 const S=size/Math.max(canvas.width,canvas.height),t=document.createElement('canvas');t.width=Math.round(canvas.width*S);t.height=Math.round(canvas.height*S);
 t.getContext('2d').drawImage(canvas,0,0,t.width,t.height);let q=null;
 try{q=CV?cvQuad(t):blobQuad(t)}catch(e){q=null}
 return q&&q.map(p=>({x:p.x/S,y:p.y/S}));
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

