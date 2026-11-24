/* มดสแกน: ส่วนแอป  (ทีมสายสีชมพู) */
{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const store={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const S={
 mode:store.get('mode','bw'),fmt:store.get('fmt','pdf'),size:store.get('size','normal'),
 auto:store.get('auto','1')==='1',hq:store.get('hq','1')==='1',orient:store.get('orient','1')==='1',blur:store.get('blur','1')==='1'
};
const save=k=>store.set(k,typeof S[k]==='boolean'?(S[k]?'1':'0'):S[k]);
const MODES=[{id:'bw',name:'ขาวดำคมชัด'},{id:'doc',name:'เอกสารสี'},{id:'gray',name:'สีเทา'},{id:'photo',name:'ภาพต้นฉบับ'}];
const QUICK=[{id:'pdf',name:'PDF',hint:'รวมทุกหน้าเป็นไฟล์เดียว เหมาะส่ง LINE หรือเก็บในแอปไฟล์'},{id:'jpg',name:'JPG',hint:'บันทึกเข้าคลังรูปภาพ แยกทีละหน้า'},{id:'png',name:'PNG',hint:'รูปภาพคุณภาพเต็ม ไม่เสียรายละเอียด ไฟล์ใหญ่กว่า JPG'}];
const EXF=[{id:'pdf',name:'PDF',hint:'ไฟล์เดียว'},{id:'jpg',name:'JPG',hint:'รูปภาพ'},{id:'png',name:'PNG',hint:'รูปคมเต็ม'},{id:'docx',name:'Word',hint:'แก้ข้อความได้'},{id:'xlsx',name:'Excel',hint:'ดึงตาราง'},{id:'txt',name:'ข้อความ',hint:'ไฟล์ .txt'}];
const SIZES=[{id:'small',name:'เล็ก',max:1400,q:.72},{id:'normal',name:'ปกติ',max:2000,q:.85},{id:'high',name:'คมชัดสูง',max:4000,q:.93}];
const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const TH_M=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const p2=n=>String(n).padStart(2,'0');
const thDate=t=>{const d=new Date(t);return `${d.getDate()} ${TH_M[d.getMonth()]} ${String(d.getFullYear()+543).slice(2)} ${p2(d.getHours())}:${p2(d.getMinutes())}`};
const fileDate=t=>{const d=new Date(t);return `${p2(d.getDate())}-${p2(d.getMonth()+1)}-${d.getFullYear()+543}`};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const tick=(ms=20)=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=t=>{const el=$('#toast');el.textContent=t;el.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('on'),2400)};
const busy=(on,tx,pct)=>{$('#busy').classList.toggle('on',!!on);if(tx)$('#busyTx').textContent=tx;$('#busyBar').style.width=(pct==null?0:Math.round(pct*100))+'%';$('#busyBar').parentElement.style.visibility=pct==null?'hidden':'visible'};
const stack=[];const show=id=>{$$('.screen').forEach(s=>s.classList.toggle('on',s.id===id))};
const safeName=s=>(s||'เอกสาร').replace(/[\\/:*?"<>|]+/g,' ').trim()||'เอกสาร';
$('#today').textContent='วันนี้ '+thDate(Date.now()).replace(/ \d+:\d+$/,'');

/* ---------- ฐานข้อมูลในเครื่อง ---------- */
const DB=new Promise((res,rej)=>{const r=indexedDB.open('modscan',2);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('pages'))d.createObjectStore('pages',{keyPath:'id'});if(!d.objectStoreNames.contains('docs'))d.createObjectStore('docs',{keyPath:'id'})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const tx=(st,mode,fn)=>DB.then(d=>new Promise((res,rej)=>{const t=d.transaction(st,mode);const q=fn(t.objectStore(st));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error)}));
const getAll=st=>tx(st,'readonly',s=>s.getAll());
const put=(st,v)=>tx(st,'readwrite',s=>s.put(v));
const del=(st,id)=>tx(st,'readwrite',s=>s.delete(id));
let docs=[],pages=[];
const pagesOf=id=>pages.filter(p=>p.docId===id).sort((a,b)=>a.order-b.order);
async function loadAll(){
 docs=await getAll('docs')||[];pages=await getAll('pages')||[];
 const orphan=pages.filter(p=>!p.docId);
 if(orphan.length){const d={id:uid(),name:'เอกสารเดิม',created:Date.now(),updated:Date.now()};await put('docs',d);for(const p of orphan){p.docId=d.id;await put('pages',p)}docs.push(d)}
 docs.sort((a,b)=>b.updated-a.updated);renderDocs();
}
let thumbUrls=[];
function renderDocs(){
 thumbUrls.forEach(URL.revokeObjectURL);thumbUrls=[];
 const list=docs.filter(d=>pagesOf(d.id).length);
 $('#docsTitle').textContent=list.length?`เอกสารล่าสุด (${list.length})`:'เอกสารล่าสุด';
 $('#docs').innerHTML=list.length?list.map(d=>{const ps=pagesOf(d.id),u=URL.createObjectURL(ps[0].blob);thumbUrls.push(u);
  return `<button class="doc" data-id="${esc(d.id)}"><img src="${u}" alt=""><span style="min-width:0"><b>${esc(d.name)}</b><span>${ps.length} หน้า  ${thDate(d.updated)}</span></span>${d.kind==='id'?'<span class="tag">บัตร</span>':''}</button>`}).join('')
  :`<div class="empty">ยังไม่มีเอกสาร<br>กดปุ่มสแกนเอกสาร แล้วส่องกล้องไปที่กระดาษได้เลย</div>`;
}
$('#docs').onclick=e=>{const b=e.target.closest('.doc');if(b)openDoc(b.dataset.id)};

/* ---------- หน้าแรก / แท็บ ---------- */
function setTab(t){$('#tabHome').classList.toggle('on',t==='home');$('#tabTools').classList.toggle('on',t==='tools');$('#navHome').setAttribute('aria-current',t==='home');$('#navTools').setAttribute('aria-current',t==='tools');scrollTo(0,0)}
$('#navHome').onclick=()=>setTab('home');$('#navTools').onclick=()=>setTab('tools');
function renderHome(){
 $('#fmtSeg').innerHTML=QUICK.map(f=>`<button data-f="${f.id}" aria-pressed="${f.id===S.fmt}">${f.name}</button>`).join('');
 $('#fmtHint').textContent=QUICK.find(f=>f.id===S.fmt).hint;
 $('#modeChips').innerHTML=MODES.map(m=>`<button class="chip" data-m="${m.id}" aria-pressed="${m.id===S.mode}">${m.name}</button>`).join('');
 $('#camChips').innerHTML=MODES.map(m=>`<button data-m="${m.id}" aria-pressed="${m.id===S.mode}">${m.name}</button>`).join('');
 $('#tgFmt').textContent='บันทึกเป็น '+S.fmt.toUpperCase();
 $('#sizeSeg').innerHTML=SIZES.map(z=>`<button data-z="${z.id}" aria-pressed="${z.id===S.size}">${z.name}</button>`).join('');
 const SET=[['auto','ถ่ายอัตโนมัติ','เจอเอกสารแล้วถือนิ่ง แอปถ่ายให้เอง'],['hq','โหมดคมชัดสูง','ถ่ายหลายภาพแล้วเลือกและรวมภาพที่คมที่สุด'],['orient','หมุนหน้าให้ตรงเอง','ถ่ายเอกสารแนวนอนหรือเอียงข้าง แอปหมุนให้'],['blur','เตือนเมื่อภาพเบลอ','ให้ถ่ายใหม่ได้ทันที']];
 $('#settings').innerHTML=SET.map(([k,t,h])=>`<button class="li" data-k="${k}" aria-pressed="${S[k]}"><span><b>${t}</b><span>${h}</span></span><span class="sw"></span></button>`).join('');
 $('#tgAuto').setAttribute('aria-pressed',S.auto);
}
const setMode=m=>{S.mode=m;save('mode');renderHome()};
$('#modeChips').onclick=$('#camChips').onclick=e=>{const b=e.target.closest('[data-m]');if(b)setMode(b.dataset.m)};
$('#fmtSeg').onclick=e=>{const b=e.target.closest('[data-f]');if(b){S.fmt=b.dataset.f;save('fmt');renderHome();prepQuick()}};
$('#tgFmt').onclick=()=>{const i=QUICK.findIndex(f=>f.id===S.fmt);S.fmt=QUICK[(i+1)%QUICK.length].id;save('fmt');renderHome();prepQuick()};
$('#sizeSeg').onclick=e=>{const b=e.target.closest('[data-z]');if(b){S.size=b.dataset.z;save('size');renderHome()}};
$('#settings').onclick=e=>{const b=e.target.closest('[data-k]');if(b){const k=b.dataset.k;S[k]=!S[k];save(k);renderHome()}};
$('#tgAuto').onclick=()=>{S.auto=!S.auto;save('auto');renderHome();stable=0};

/* ---------- OpenCV ---------- */
(function(){const s=document.createElement('script');s.src='lib/opencv.js';s.async=true;
 s.onload=()=>{const w=window.cv,ok=m=>{CV=m;window.cv=m};if(w&&w.Mat)ok(w);else if(w&&typeof w.then==='function')w.then(m=>{delete m.then;ok(m)});else if(w)w.onRuntimeInitialized=()=>ok(w)};
 document.body.appendChild(s)})();

/* ---------- ภาพ: ความคม หมุน รวมเฟรม ---------- */
function grayOf(c,w){const h=Math.max(1,Math.round(w*c.height/c.width)),t=document.createElement('canvas');t.width=w;t.height=h;const x=t.getContext('2d');x.drawImage(c,0,0,w,h);const d=x.getImageData(0,0,w,h).data,g=new Float32Array(w*h);for(let i=0;i<w*h;i++)g[i]=d[i*4]*.3+d[i*4+1]*.59+d[i*4+2]*.11;return{g,w,h}}
function lapVar(c,w=640){const{g,w:W,h:H}=grayOf(c,w);let s=0,s2=0,n=0;for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x,v=4*g[i]-g[i-1]-g[i+1]-g[i-W]-g[i+W];s+=v;s2+=v*v;n++}return s2/n-(s/n)**2}
function rotCanvas(c,deg){if(!deg)return c;const t=document.createElement('canvas'),q=deg%180!==0;t.width=q?c.height:c.width;t.height=q?c.width:c.height;const x=t.getContext('2d');x.translate(t.width/2,t.height/2);x.rotate(deg*Math.PI/180);x.drawImage(c,-c.width/2,-c.height/2);return t}
function inkProfile(c){const{g,w,h}=grayOf(c,360);let m=0;for(const v of g)m+=v;m/=g.length;const th=m-45,rows=new Float32Array(h),cols=new Float32Array(w),ink=new Uint8Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(g[y*w+x]<th){ink[y*w+x]=1;rows[y]++;cols[x]++}return{rows,cols,ink,w,h}}
const cvar=a=>{let s=0,s2=0;for(const v of a){s+=v;s2+=v*v}const n=a.length,mu=s/n;return mu>0?(s2/n-mu*mu)/(mu*mu):0};
function orientFix(c){
 const p=inkProfile(c),rv=cvar(p.rows),cv=cvar(p.cols);
 if(!(cv>rv*1.8&&cv>.6))return{c,deg:0};
 let r=rotCanvas(c,90);const q=inkProfile(r);const fs=[],ls=[];
 for(let y=0;y<q.h;y++){if(q.rows[y]<3)continue;let f=-1,l=-1;for(let x=0;x<q.w;x++)if(q.ink[y*q.w+x]){if(f<0)f=x;l=x}fs.push(f);ls.push(l)}
 const sd=a=>{if(a.length<5)return 0;const m=a.reduce((x,y)=>x+y,0)/a.length;return Math.sqrt(a.reduce((x,y)=>x+(y-m)**2,0)/a.length)};
 if(sd(ls)<sd(fs)*.6)return{c:rotCanvas(c,270),deg:270};
 return{c:r,deg:90};
}
function avgFrames(fr){const w=fr[0].width,h=fr[0].height,out=document.createElement('canvas');out.width=w;out.height=h;const ox=out.getContext('2d'),ds=fr.map(f=>f.getContext('2d').getImageData(0,0,w,h).data),od=ox.createImageData(w,h),o=od.data,n=ds.length;
 for(let i=0;i<o.length;i++){let s=0;for(let k=0;k<n;k++)s+=ds[k][i];o[i]=s/n}ox.putImageData(od,0,0);return out}
function frameDiff(a,b){const A=grayOf(a,160),B=grayOf(b,160);let s=0;for(let i=0;i<A.g.length;i++)s+=Math.abs(A.g[i]-B.g[i]);return s/A.g.length}
const toBlob=(c,type='image/jpeg',q=.92)=>new Promise(r=>c.toBlob(r,type,q));
function blobToCanvas(b,max=4200){return new Promise((res,rej)=>{const u=URL.createObjectURL(b),im=new Image();im.onload=()=>{const k=Math.min(1,max/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement('canvas');c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c)};im.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('img'))};im.src=u})}
const fullPts=c=>[{x:0,y:0},{x:c.width,y:0},{x:c.width,y:c.height},{x:0,y:c.height}];
const inset=c=>{const mx=c.width*.06,my=c.height*.06;return[{x:mx,y:my},{x:c.width-mx,y:my},{x:c.width-mx,y:c.height-my},{x:mx,y:c.height-my}]};
async function processPage(frame,q,mode){
 let w=warp(frame,q,mode),deg=0;
 if(S.orient&&mode!=='card'){const r=orientFix(w);w=r.c;deg=r.deg}
 const out=applyMode(w,mode);return{blob:await toBlob(out,'image/jpeg',.92),deg,sharp:lapVar(w)};
}

/* ---------- เซสชันสแกน ---------- */
let sess=null; // {doc,isNew,pages:[],kind,purpose,cert,id:[]}
function newDoc(kind){const t=Date.now();return{id:uid(),name:(kind==='id'?'สำเนาบัตร ':'เอกสาร ')+thDate(t).replace(':','.'),created:t,updated:t,kind:kind||'scan'}}
function startSess(kind,docId){
 const d=docId?docs.find(x=>x.id===docId):newDoc(kind);
 sess={doc:d,isNew:!docId,pages:[],kind:kind||'scan',ready:null};
}
async function addPageRec(rec){
 const d=sess.doc;if(sess.isNew&&!docs.includes(d)){docs.unshift(d)}
 const ex=pagesOf(d.id);rec.id=uid();rec.docId=d.id;rec.order=ex.length?Math.max(...ex.map(p=>p.order))+1:1;
 d.updated=Date.now();await put('docs',d);await put('pages',rec);pages.push(rec);sess.pages.push(rec);prepQuick();renderDocs();camThumb();
}
$('#goScan').onclick=$('#navScan').onclick=()=>{startSess('scan');openCam()};
$('#goNative').onclick=()=>{startSess('scan');sess.native=true;$('#fCam').click()};
$('#goImport').onclick=$('#tImg2Pdf').onclick=()=>{startSess('scan');$('#fImg').click()};
$('#goId').onclick=()=>{$('#idBg').classList.add('on')};
$('#idClose').onclick=()=>$('#idBg').classList.remove('on');
$('#idCertLi').onclick=e=>{e.preventDefault();const b=$('#idCertLi');b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true')};
$('#idGo').onclick=()=>{$('#idBg').classList.remove('on');startSess('id');sess.purpose=$('#idPurpose').value.trim();sess.cert=$('#idCertLi').getAttribute('aria-pressed')==='true';sess.sides=[];openCam()};

/* ---------- กล้องสด ---------- */
const vid=$('#vid'),ov=$('#ov');let stream=null,track=null,loopT=0,quad=null,shown=null,stable=0,armed=true,lastQ=null,capturing=false,lost=0;
const NEED=7;
const camMode=()=>sess&&sess.kind==='id'?'card':S.mode;
function idPrompt(){return sess.sides.length===0?'ด้านหน้าบัตร: วางบนพื้นสีเข้ม':'พลิกบัตร ถ่ายด้านหลัง'}
async function openCam(){
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){$('#fCam').click();return}
 show('camScr');renderHome();camThumb();$('#blurWarn').classList.remove('on');$('#camChips').style.display=sess.kind==='id'?'none':'flex';$('#tgFmt').hidden=sess.kind==='id';
 setStatus(sess.kind==='id'?idPrompt():'กำลังเปิดกล้อง...');
 try{stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:4032},height:{ideal:3024},aspectRatio:{ideal:4/3}}})}
 catch(e){show(null);toast('เปิดกล้องไม่ได้ ใช้กล้องของเครื่องแทน');if(sess.kind!=='id')$('#fCam').click();return}
 vid.srcObject=stream;track=stream.getVideoTracks()[0];
 try{const cap=track.getCapabilities&&track.getCapabilities();$('#tgTorch').hidden=!(cap&&cap.torch);if(cap&&cap.focusMode&&cap.focusMode.includes('continuous'))track.applyConstraints({advanced:[{focusMode:'continuous'}]}).catch(()=>{})}catch(e){}
 await vid.play().catch(()=>{});armed=true;stable=0;quad=shown=lastQ=null;
 clearInterval(loopT);loopT=setInterval(step,130);requestAnimationFrame(drawOv);
}
function closeCam(){clearInterval(loopT);loopT=0;if(stream)stream.getTracks().forEach(t=>t.stop());stream=track=null;$('#tgTorch').setAttribute('aria-pressed','false')}
const setStatus=t=>{$('#status').textContent=t};
function camThumb(){const n=sess?sess.pages.length+(sess.sides?sess.sides.length:0):0;$('#cnt').textContent=n;const last=sess&&sess.pages[sess.pages.length-1];if(camThumb.u)URL.revokeObjectURL(camThumb.u);camThumb.u=last?URL.createObjectURL(last.blob):'';$('#thumb').style.backgroundImage=last?`url(${camThumb.u})`:'none'}
const work=document.createElement('canvas');
const hist=[];function smoothQ(q){hist.push(q);if(hist.length>5)hist.shift();if(hist.length<3)return q;const med=a=>{const s=[...a].sort((x,y)=>x-y);return s[s.length>>1]};return q.map((_,i)=>({x:med(hist.map(h=>h[i].x)),y:med(hist.map(h=>h[i].y))}))}
function step(){
 if(!vid.videoWidth||capturing||$('#blurWarn').classList.contains('on'))return;
 const k=500/Math.max(vid.videoWidth,vid.videoHeight);work.width=Math.round(vid.videoWidth*k);work.height=Math.round(vid.videoHeight*k);
 work.getContext('2d').drawImage(vid,0,0,work.width,work.height);
 let q=null;try{q=CV?cvQuad(work):null}catch(e){q=null}
 const pre=sess.kind==='id'?idPrompt()+'  ':'';
 if(!CV)setStatus('กำลังเตรียมตัวจับเอกสาร... กดถ่ายเองได้');
 if(q){q=smoothQ(q.map(p=>({x:p.x/k,y:p.y/k})));lost=0;
  const dg=Math.hypot(vid.videoWidth,vid.videoHeight),mv=lastQ?Math.max(...q.map((p,i)=>Math.hypot(p.x-lastQ[i].x,p.y-lastQ[i].y)))/dg:1;
  if(!armed&&mv>.06)armed=true;stable=mv<.018?stable+1:0;lastQ=q;quad=q;
  if(!S.auto)setStatus(pre||'เจอเอกสารแล้ว กดถ่ายได้เลย');
  else if(!armed)setStatus(sess.kind==='id'?idPrompt():'เปลี่ยนหน้าถัดไปได้เลย');
  else if(stable<NEED)setStatus(sess.kind==='id'?idPrompt():'เจอเอกสารแล้ว ถือนิ่งๆ');
  else{capture();return}
 }else if(CV){lost++;if(lost>2){hist.length=0;quad=lastQ=null;stable=0;armed=true;setStatus(sess.kind==='id'?idPrompt():(S.auto?'ส่องกล้องให้เห็นกระดาษทั้งแผ่น':'กดถ่ายได้เลย'))}}
 $('#ring').setAttribute('stroke-dashoffset',289*(1-(S.auto&&armed&&quad?Math.min(1,stable/NEED):0)));
}
function drawOv(){
 if(!$('#camScr').classList.contains('on'))return;
 const r=ov.getBoundingClientRect(),dpr=devicePixelRatio||1;if(ov.width!==Math.round(r.width*dpr)){ov.width=r.width*dpr;ov.height=r.height*dpr}
 const c=ov.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,r.width,r.height);
 if(quad&&vid.videoWidth){
  shown=shown?shown.map((p,i)=>({x:p.x+(quad[i].x-p.x)*.4,y:p.y+(quad[i].y-p.y)*.4})):quad.map(p=>({...p}));
  const k=Math.max(r.width/vid.videoWidth,r.height/vid.videoHeight),ox=(r.width-vid.videoWidth*k)/2,oy=(r.height-vid.videoHeight*k)/2,P=shown.map(p=>({x:ox+p.x*k,y:oy+p.y*k}));
  c.beginPath();c.moveTo(P[0].x,P[0].y);P.slice(1).forEach(p=>c.lineTo(p.x,p.y));c.closePath();
  const ok=S.auto&&armed&&stable>=2;c.fillStyle=ok?'#cfe5f640':'#f4b3cb33';c.fill();c.lineWidth=4;c.strokeStyle=ok?'#9fd0f2':'#f4b3cb';c.stroke();
  P.forEach(p=>{c.beginPath();c.arc(p.x,p.y,6,0,7);c.fillStyle='#fff';c.fill()});
 }else shown=null;
 requestAnimationFrame(drawOv);
}
$('#shutter').onclick=()=>capture(true);
$('#tgTorch').onclick=async()=>{const on=$('#tgTorch').getAttribute('aria-pressed')!=='true';try{await track.applyConstraints({advanced:[{torch:on}]});$('#tgTorch').setAttribute('aria-pressed',on)}catch(e){toast('เปิดไฟฉายไม่ได้')}};
async function grabFrames(){
 const n=S.hq?5:3,fr=[];
 for(let i=0;i<n;i++){const c=document.createElement('canvas');c.width=vid.videoWidth;c.height=vid.videoHeight;c.getContext('2d').drawImage(vid,0,0);fr.push({c,s:lapVar(c,320)});if(i<n-1)await tick(70)}
 fr.sort((a,b)=>b.s-a.s);let best=fr[0].c;
 if(S.hq){const near=fr.slice(1,3).filter(f=>frameDiff(best,f.c)<3).map(f=>f.c);if(near.length)best=avgFrames([best,...near])}
 return best;
}
async function capture(manual){
 if(capturing||!vid.videoWidth)return;capturing=true;
 const fl=$('#flash');fl.style.opacity=.85;setTimeout(()=>fl.style.opacity=0,120);if(navigator.vibrate)navigator.vibrate(40);
 setStatus('กำลังสแกน...');let q=quad,f=await grabFrames();
 if(window.ImageCapture&&track){try{const ph=await new ImageCapture(track).takePhoto(),pc=await blobToCanvas(ph,4200);
  if(Math.abs(pc.width/pc.height-f.width/f.height)<.02&&pc.width>f.width){const k=pc.width/f.width;q=q&&q.map(p=>({x:p.x*k,y:p.y*k}));f=pc}}catch(e){}}
 if(!q)q=detectOn(f,800);if(!q)q=fullPts(f);
 const mode=camMode();
 try{
  const r=await processPage(f,q,mode);
  if(sess.kind==='id'){
   sess.sides.push(r.blob);camThumb();
   if(sess.sides.length===1){toast('ได้ด้านหน้าแล้ว พลิกบัตรได้เลย')}
   else{busy(true,'กำลังจัดหน้าสำเนาบัตร...');const page=await composeId(sess.sides[0],sess.sides[1],sess.purpose,sess.cert);sess.sides=[];
    await addPageRec({blob:page,mode:'card',kind:'id'});busy(false);closeCam();finish(true);capturing=false;return}
  }else{
   const orig=await toBlob(f,'image/jpeg',.9);
   await addPageRec({blob:r.blob,orig,origW:f.width,pts:q,mode,deg:r.deg});
   toast(`เก็บหน้า ${sess.pages.length} แล้ว`);
   if(S.blur&&r.sharp<BLUR_TH)$('#blurWarn').classList.add('on');
  }
 }catch(e){console.error(e);toast('สแกนไม่สำเร็จ ลองอีกครั้ง')}
 armed=false;stable=0;capturing=false;$('#ring').setAttribute('stroke-dashoffset',289);
}
const BLUR_TH=35;
$('#bwKeep').onclick=()=>$('#blurWarn').classList.remove('on');
$('#bwRetake').onclick=async()=>{const p=sess.pages.pop();if(p){await del('pages',p.id);pages=pages.filter(x=>x.id!==p.id);renderDocs();camThumb();prepQuick()}$('#blurWarn').classList.remove('on');armed=true;stable=0;toast('ลบหน้านั้นแล้ว ถ่ายใหม่ได้เลย')};
$('#camDone').onclick=$('#thumb').onclick=()=>{closeCam();finish(true)};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&stream){closeCam();finish(false)}});

/* ---------- สำเนาบัตร ---------- */
async function composeId(fb,bb,purpose,cert){
 const W=1654,H=2339,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);
 const cw=Math.round(85.6/210*W),ch=Math.round(54/297*H),cx=(W-cw)/2,y1=230,y2=y1+ch+90;
 try{await document.fonts.load('40px Mitr')}catch(e){}
 const wm=purpose?`ใช้สำหรับ${purpose}เท่านั้น`:'สำเนา ใช้เพื่อการติดต่อเท่านั้น';
 for(const [b,y] of [[fb,y1],[bb,y2]]){const im=await blobToCanvas(b,2000);x.save();x.beginPath();x.roundRect?x.roundRect(cx,y,cw,ch,18):x.rect(cx,y,cw,ch);x.clip();
  const k=Math.max(cw/im.width,ch/im.height);x.drawImage(im,cx+(cw-im.width*k)/2,y+(ch-im.height*k)/2,im.width*k,im.height*k);
  x.translate(cx+cw/2,y+ch/2);x.rotate(-.32);x.font='500 28px Mitr, sans-serif';x.fillStyle='rgba(40,70,170,.33)';x.textAlign='center';
  for(let r=-3;r<=3;r++)x.fillText(wm,0,r*92);x.restore();x.strokeStyle='#d9d2d6';x.lineWidth=2;x.strokeRect(cx,y,cw,ch)}
 x.fillStyle='#222';x.textAlign='center';let ty=y2+ch+110;
 if(cert){x.font='500 46px Mitr, sans-serif';x.fillText('สำเนาถูกต้อง',W/2,ty);ty+=70}
 if(purpose){x.font='400 34px Mitr, sans-serif';x.fillText(`ใช้สำหรับ${purpose}เท่านั้น`,W/2,ty);ty+=70}
 if(cert){ty+=60;x.font='400 32px Mitr, sans-serif';x.fillText('ลงชื่อ ...............................................',W/2,ty);x.fillText('(...............................................)',W/2,ty+60);x.fillText('วันที่ ........ / ........ / ............',W/2,ty+120)}
 return toBlob(c,'image/jpeg',.92);
}

/* ---------- กล้องเครื่อง / รูปจากคลัง ---------- */
let src=null,pts=null,queue=[],editPage=null,curMode=S.mode;
$('#fCam').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f){queue=[];startFile(f)}};
$('#fImg').onchange=e=>{queue=[...e.target.files];e.target.value='';if(queue.length)startFile(queue.shift())};
async function startFile(f){
 busy(true,'กำลังเปิดรูป...');editPage=null;
 try{src=await blobToCanvas(f,4200)}catch(e){busy(false);toast('เปิดรูปนี้ไม่ได้');return}
 curMode=S.mode;const q=detectOn(src,800);
 if(q){pts=q;await commitFile();return}
 busy(false);pts=q||inset(src);openCrop();
}
async function commitFile(){
 busy(true,'กำลังสแกน...');await tick();
 try{const r=await processPage(src,pts,curMode);
  if(editPage){Object.assign(editPage,{blob:r.blob,pts:pts.map(p=>({...p})),mode:curMode,deg:r.deg});delete editPage.ocr;await put('pages',editPage);const d=docs.find(x=>x.id===editPage.docId);d.updated=Date.now();await put('docs',d);editPage=null;busy(false);renderDocs();openDoc(d.id);return}
  await addPageRec({blob:r.blob,orig:await toBlob(src,'image/jpeg',.9),origW:src.width,pts:pts.map(p=>({...p})),mode:curMode,deg:r.deg});
 }catch(e){console.error(e);toast('สแกนไม่สำเร็จ')}
 busy(false);
 if(queue.length){startFile(queue.shift());return}
 src=null;show(null);
 if(sess&&sess.native&&sess.pages.length){openNext();return}
 finish(false);
}
function openNext(){$('#nextInfo').textContent=`สแกนแล้ว ${sess.pages.length} หน้า`;$('#nextBg').classList.add('on')}
document.body.insertAdjacentHTML('beforeend',`<div class="sheetBg" id="nextBg"><div class="sheet"><div class="grab"></div><h3 id="nextInfo"></h3><p class="hint" style="margin-top:0">ถ้าหน้าไหนตัดขอบไม่ตรง แตะหน้านั้นในเอกสารแล้วกดปรับขอบได้</p><button class="btn main wide" id="nextMore">ถ่ายหน้าถัดไป</button><button class="btn wide" id="nextDone" style="margin-top:8px">เสร็จ บันทึกเลย</button></div></div>`);
$('#nextMore').onclick=()=>{$('#nextBg').classList.remove('on');$('#fCam').click()};
$('#nextDone').onclick=()=>{$('#nextBg').classList.remove('on');finish(true)};

/* ---------- ปรับขอบ ---------- */
const ed=$('#ed');let view={k:1,ox:0,oy:0},drag=-1,finger=null;
function openCrop(){show('cropScr');$('#cropChips').innerHTML=MODES.map(m=>`<button data-m="${m.id}" aria-pressed="${m.id===curMode}">${m.name}</button>`).join('');requestAnimationFrame(drawEd)}
$('#cropChips').onclick=e=>{const b=e.target.closest('[data-m]');if(b){curMode=b.dataset.m;openCrop()}};
function drawEd(){
 if(!src)return;const r=ed.getBoundingClientRect(),dpr=devicePixelRatio||1;ed.width=r.width*dpr;ed.height=r.height*dpr;
 const c=ed.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);const pad=28,k=Math.min((r.width-pad*2)/src.width,(r.height-pad*2)/src.height);
 view={k,ox:(r.width-src.width*k)/2,oy:(r.height-src.height*k)/2};c.clearRect(0,0,r.width,r.height);c.drawImage(src,view.ox,view.oy,src.width*k,src.height*k);
 const P=pts.map(p=>({x:view.ox+p.x*k,y:view.oy+p.y*k}));
 c.beginPath();c.rect(0,0,r.width,r.height);c.moveTo(P[0].x,P[0].y);P.slice(1).forEach(p=>c.lineTo(p.x,p.y));c.closePath();c.fillStyle='#1d182099';c.fill('evenodd');
 c.beginPath();c.moveTo(P[0].x,P[0].y);P.slice(1).forEach(p=>c.lineTo(p.x,p.y));c.closePath();c.strokeStyle='#f4b3cb';c.lineWidth=2.5;c.stroke();
 P.forEach((p,i)=>{c.beginPath();c.arc(p.x,p.y,i===drag?16:13,0,7);c.fillStyle='#ffffffdd';c.fill();c.lineWidth=3;c.strokeStyle='#c74f7d';c.stroke()});
 if(drag>=0&&finger){const R=58,cx=finger.x<r.width/2?r.width-R-14:R+14,cy=R+14,Z=2.6,p=pts[drag],sz=R*2/(k*Z);
  c.save();c.beginPath();c.arc(cx,cy,R,0,7);c.clip();c.fillStyle='#000';c.fillRect(cx-R,cy-R,R*2,R*2);c.drawImage(src,p.x-sz/2,p.y-sz/2,sz,sz,cx-R,cy-R,R*2,R*2);c.restore();
  c.beginPath();c.arc(cx,cy,R,0,7);c.strokeStyle='#fff';c.lineWidth=3;c.stroke();c.beginPath();c.moveTo(cx-10,cy);c.lineTo(cx+10,cy);c.moveTo(cx,cy-10);c.lineTo(cx,cy+10);c.strokeStyle='#c74f7d';c.lineWidth=2;c.stroke()}
}
const posOf=e=>{const r=ed.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
ed.onpointerdown=e=>{const m=posOf(e);let bi=-1,bd=48;pts.forEach((p,i)=>{const d=Math.hypot(view.ox+p.x*view.k-m.x,view.oy+p.y*view.k-m.y);if(d<bd){bd=d;bi=i}});drag=bi;if(bi>=0){ed.setPointerCapture(e.pointerId);finger=m;drawEd()}};
ed.onpointermove=e=>{if(drag<0)return;const m=posOf(e);finger=m;pts[drag]={x:Math.max(0,Math.min(src.width,(m.x-view.ox)/view.k)),y:Math.max(0,Math.min(src.height,(m.y-view.oy)/view.k))};drawEd()};
ed.onpointerup=ed.onpointercancel=()=>{drag=-1;finger=null;drawEd()};
new ResizeObserver(()=>{if($('#cropScr').classList.contains('on'))drawEd()}).observe(ed);
$('#rot').onclick=()=>{src=rotCanvas(src,90);pts=detectOn(src,800)||inset(src);drawEd()};
$('#autoEdge').onclick=()=>{const p=detectOn(src,800);if(p){pts=p;drawEd()}else toast('หาขอบไม่เจอ ลองลากมุมเองนะ')};
$('#fullImg').onclick=()=>{pts=fullPts(src);drawEd()};
$('#cropBack').onclick=()=>{const wasEdit=editPage;src=null;queue=[];editPage=null;if(wasEdit)openDoc(wasEdit.docId);else{show(null);finish(false)}};
$('#cropOk').onclick=commitFile;

/* ---------- จบการสแกน: บันทึกตามแบบที่เลือก ---------- */
let qJob=0;
async function buildQuick(list,fmt){const sz=SIZES.find(z=>z.id===S.size),name=safeName(sess.doc.name);
 if(fmt==='pdf'){const bl=await sizedBlobs(list.map(p=>p.blob),sz,'image/jpeg');return[new File([await makePdf(bl)],name+'.pdf',{type:'application/pdf'})]}
 const type=fmt==='png'?'image/png':'image/jpeg',bl=await sizedBlobs(list.map(p=>p.blob),sz,type);
 return bl.map((b,i)=>new File([b],`${name}${list.length>1?'_'+(i+1):''}.${fmt}`,{type}))}
function prepQuick(){if(!sess||!sess.pages.length){if(sess)sess.ready=null;return}const my=++qJob,list=[...sess.pages],fmt=S.fmt;
 buildQuick(list,fmt).then(f=>{if(my===qJob)sess.ready={files:f,n:list.length,fmt}}).catch(()=>{})}
function finish(direct){
 if(!sess)return;const s=sess;
 if(!s.pages.length){sess=null;show(null);return}
 const d=s.doc;renderDocs();
 const r=s.ready;
 if(direct&&r&&r.n===s.pages.length&&r.fmt===S.fmt){deliver(r.files,true).then(ok=>{if(!ok)openExport(d.id,S.fmt)});sess=null;openDoc(d.id);return}
 sess=null;openDoc(d.id);openExport(d.id,S.fmt);
}

/* ---------- ส่งไฟล์ออก ---------- */
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},5000)}
async function deliver(files,quiet){
 const canShare=navigator.canShare&&navigator.canShare({files});
 if(isIOS&&canShare){try{await navigator.share({files});toast(files[0].type.startsWith('image/')?'บันทึกแล้ว':'ส่งออกแล้ว');return true}catch(e){if(e.name==='AbortError'){if(!quiet)toast('ยกเลิกแล้ว');return true}return false}}
 if(!isIOS||!canShare){files.forEach((f,i)=>setTimeout(()=>download(f,f.name),i*500));toast(files.length>1?`บันทึก ${files.length} ไฟล์ลงเครื่องแล้ว`:'บันทึกลงเครื่องแล้ว');return true}
 return false;
}
async function sizedBlobs(blobs,sz,type){
 const out=[];for(const b of blobs){if(sz.id==='high'&&type==='image/jpeg'){out.push(b);continue}const c=await blobToCanvas(b,sz.max);out.push(await toBlob(c,type,sz.q))}return out}
const fmtSize=n=>n>1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB';

let exDoc=null,exFmt='pdf',exSize=S.size,exFiles=null;
function openExport(docId,fmt){exDoc=docId;exFmt=fmt||S.fmt;exSize=S.size;exFiles=null;renderExport();$('#exportBg').classList.add('on')}
function renderExport(){
 $('#exFmts').innerHTML=EXF.map(f=>`<button class="fmt" data-f="${f.id}" aria-pressed="${f.id===exFmt}"><b>${f.name}</b><span>${f.hint}</span></button>`).join('');
 $('#exSize').innerHTML=SIZES.map(z=>`<button data-z="${z.id}" aria-pressed="${z.id===exSize}">${z.name}</button>`).join('');
 $('#exSizeBox').style.display=['pdf','jpg','png'].includes(exFmt)?'block':'none';
 $('#exReady').classList.toggle('on',!!exFiles);$('#exBuild').style.display=exFiles?'none':'flex';
 if(exFiles){const tot=exFiles.reduce((a,f)=>a+f.size,0);$('#exInfo').textContent=`${exFiles.length>1?exFiles.length+' ไฟล์':exFiles[0].name}  ขนาด ${fmtSize(tot)}`;
  $('#exDeliverTx').textContent=isIOS?(exFmt==='jpg'||exFmt==='png'?'บันทึกลงคลังรูป / แชร์':'บันทึกลงไฟล์ / แชร์'):'บันทึกลงเครื่อง'}
}
$('#exFmts').onclick=e=>{const b=e.target.closest('[data-f]');if(b){exFmt=b.dataset.f;exFiles=null;renderExport()}};
$('#exSize').onclick=e=>{const b=e.target.closest('[data-z]');if(b){exSize=b.dataset.z;exFiles=null;renderExport()}};
$('#exClose').onclick=()=>$('#exportBg').classList.remove('on');
$('#exBuild').onclick=async()=>{
 const d=docs.find(x=>x.id===exDoc),ps=pagesOf(exDoc),name=safeName(d.name),sz=SIZES.find(z=>z.id===exSize);
 try{
  if(exFmt==='pdf'||exFmt==='jpg'||exFmt==='png'){busy(true,'กำลังเตรียมไฟล์...');
   if(exFmt==='pdf')exFiles=[new File([await makePdf(await sizedBlobs(ps.map(p=>p.blob),sz,'image/jpeg'))],name+'.pdf',{type:'application/pdf'})];
   else{const type=exFmt==='png'?'image/png':'image/jpeg',bl=await sizedBlobs(ps.map(p=>p.blob),sz,type);exFiles=bl.map((b,i)=>new File([b],`${name}${ps.length>1?'_'+(i+1):''}.${exFmt}`,{type}))}}
  else{await ocrPages(ps);busy(true,'กำลังสร้างไฟล์...');
   if(exFmt==='docx')exFiles=[new File([makeDocx(ps.map(p=>p.ocr.lines))],name+'.docx',{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})];
   else if(exFmt==='xlsx'){const sheets=[];for(const p of ps)sheets.push(await tableOf(p));exFiles=[new File([makeXlsx(sheets)],name+'.xlsx',{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})]}
   else exFiles=[new File([docText(ps)],name+'.txt',{type:'text/plain'})]}
 }catch(e){console.error(e);toast('เตรียมไฟล์ไม่สำเร็จ ลองอีกครั้ง');exFiles=null}
 busy(false);renderExport();
};
$('#exDeliver').onclick=async()=>{if(!exFiles)return;const ok=await deliver(exFiles);if(ok)$('#exportBg').classList.remove('on');else toast('บันทึกไม่สำเร็จ ลองกดอีกครั้ง')};

/* ---------- หน้าเอกสาร ---------- */
let curDoc=null,pgUrls=[];
function openDoc(id){
 curDoc=docs.find(d=>d.id===id);if(!curDoc){show(null);return}const ps=pagesOf(id);
 if(!ps.length){show(null);renderDocs();return}
 pgUrls.forEach(URL.revokeObjectURL);pgUrls=ps.map(p=>URL.createObjectURL(p.blob));
 $('#docName').textContent=curDoc.name;$('#docInfo').textContent=`${ps.length} หน้า  แก้ล่าสุด ${thDate(curDoc.updated)}`;
 $('#docPages').innerHTML=ps.map((p,i)=>`<button class="pg" data-i="${i}"><img src="${pgUrls[i]}" alt="หน้า ${i+1}"><i>${i+1}</i></button>`).join('')+
  `<button class="pg" id="addPage" style="display:grid;place-items:center;aspect-ratio:3/4.3;color:var(--pinkD)"><span style="display:grid;justify-items:center;gap:4px;font-size:13px"><svg class="i"><use href="#i-plus"/></svg>เพิ่มหน้า</span></button>`;
 show('docScr');
}
$('#docPages').onclick=e=>{if(e.target.closest('#addPage')){startSess(curDoc.kind,curDoc.id);openCam();return}const b=e.target.closest('.pg');if(b)openPage(+b.dataset.i)};
$('#docBack').onclick=()=>{show(null);renderDocs()};
$('#docRename').onclick=async()=>{const n=prompt('ตั้งชื่อเอกสาร',curDoc.name);if(n&&n.trim()){curDoc.name=n.trim();curDoc.updated=Date.now();await put('docs',curDoc);openDoc(curDoc.id);renderDocs()}};
$('#docDel').onclick=async()=>{if(!confirm(`ลบเอกสาร "${curDoc.name}" ทั้งหมด?\nลบแล้วกู้คืนไม่ได้`))return;for(const p of pagesOf(curDoc.id))await del('pages',p.id);await del('docs',curDoc.id);pages=pages.filter(p=>p.docId!==curDoc.id);docs=docs.filter(d=>d!==curDoc);show(null);renderDocs();toast('ลบแล้ว')};
$('#aSave').onclick=()=>openExport(curDoc.id,S.fmt);
$('#aWord').onclick=()=>{openExport(curDoc.id,'docx');$('#exBuild').click()};
$('#aXls').onclick=()=>{openExport(curDoc.id,'xlsx');$('#exBuild').click()};
$('#aText').onclick=async()=>{const ps=pagesOf(curDoc.id);try{await ocrPages(ps)}catch(e){busy(false);toast('อ่านข้อความไม่สำเร็จ');return}busy(false);$('#txt').value=docText(ps);txtFrom='doc';show('txtScr')};

/* ---------- ดูทีละหน้า ---------- */
let pi=0;
function openPage(i){const ps=pagesOf(curDoc.id);pi=i;$('#pgImg').src=pgUrls[i];$('#pgTitle').textContent=`หน้า ${i+1} จาก ${ps.length}`;$('#pgUp').disabled=i===0;$('#pgEdit').disabled=!ps[i].orig;show('pgScr')}
$('#pgBack').onclick=()=>openDoc(curDoc.id);
$('#pgRot').onclick=async()=>{const p=pagesOf(curDoc.id)[pi];busy(true,'กำลังหมุน...');const c=rotCanvas(await blobToCanvas(p.blob,6000),90);p.blob=await toBlob(c,'image/jpeg',.92);delete p.ocr;await put('pages',p);busy(false);openDoc(curDoc.id);openPage(pi)};
$('#pgEdit').onclick=async()=>{const p=pagesOf(curDoc.id)[pi];if(!p.orig)return;busy(true,'กำลังเปิด...');src=await blobToCanvas(p.orig,4200);const k=src.width/(p.origW||src.width);pts=(p.pts||inset(src)).map(q=>({x:q.x*k,y:q.y*k}));curMode=p.mode||S.mode;editPage=p;queue=[];busy(false);openCrop()};
$('#pgUp').onclick=async()=>{const ps=pagesOf(curDoc.id);if(pi<1)return;const a=ps[pi],b=ps[pi-1];[a.order,b.order]=[b.order,a.order];await put('pages',a);await put('pages',b);openDoc(curDoc.id);openPage(pi-1)};
$('#pgDel').onclick=async()=>{if(!confirm('ลบหน้านี้?'))return;const p=pagesOf(curDoc.id)[pi];await del('pages',p.id);pages=pages.filter(x=>x.id!==p.id);curDoc.updated=Date.now();await put('docs',curDoc);renderDocs();openDoc(curDoc.id)};

/* ---------- อ่านข้อความ (OCR) ---------- */
let ocrW=null,ocrCb=null;
async function getOcr(){
 if(ocrW)return ocrW;
 for(let i=0;i<50&&!window.Tesseract;i++)await tick(100);
 if(!window.Tesseract)throw new Error('no tesseract');
 const base=new URL('lib/',location.href).href;
 ocrW=await Tesseract.createWorker(['tha','eng'],1,{workerPath:base+'worker.min.js',corePath:base+'core',langPath:base+'lang',gzip:true,logger:m=>ocrCb&&ocrCb(m)});
 await ocrW.setParameters({preserve_interword_spaces:'1'});
 return ocrW;
}
const thaiCh=c=>c>='฀'&&c<='๿';
function fixThai(s){return s.replace(/([฀-๿]) (?=[฀-๿])/g,'$1').replace(/ {2,}/g,' ').trim()}
function smartJoin(ws){let out='';for(const w of ws){if(!out){out=w;continue}out+=(thaiCh(out.slice(-1))&&thaiCh(w[0]))?'':' ';out+=w}return out}
function cleanForOcr(c){
 if(!CV)return c;const cv=CV,img=cv.imread(c),g=new cv.Mat(),bin=new cv.Mat(),h=new cv.Mat(),v=new cv.Mat(),m=new cv.Mat();
 try{cv.cvtColor(img,g,cv.COLOR_RGBA2GRAY);cv.adaptiveThreshold(g,bin,255,cv.ADAPTIVE_THRESH_MEAN_C,cv.THRESH_BINARY_INV,21,12);
  const kh=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(Math.max(30,c.width/18|0),1)),kv=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(1,Math.max(30,c.height/22|0))),kd=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(3,3));
  cv.morphologyEx(bin,h,cv.MORPH_OPEN,kh);cv.morphologyEx(bin,v,cv.MORPH_OPEN,kv);cv.add(h,v,m);cv.dilate(m,m,kd);kh.delete();kv.delete();kd.delete();
  const x=c.getContext('2d'),id=x.getImageData(0,0,c.width,c.height),d=id.data,md=m.data;
  for(let i=0;i<md.length;i++)if(md[i]){const j=i*4;d[j]=d[j+1]=d[j+2]=255}x.putImageData(id,0,0);
 }finally{img.delete();g.delete();bin.delete();h.delete();v.delete();m.delete()}
 return c;
}
async function ocrPages(ps,persist=true){
 const todo=ps.filter(p=>!p.ocr);if(!todo.length)return;
 busy(true,'กำลังเตรียมตัวอ่านข้อความ (ครั้งแรกนานหน่อย)...',0);
 const w=await getOcr();
 for(let i=0;i<todo.length;i++){const p=todo[i],idx=ps.indexOf(p)+1;
  ocrCb=m=>{if(m.status==='recognizing text')busy(true,`กำลังอ่านข้อความ หน้า ${idx}/${ps.length}`,(i+m.progress)/todo.length)};
  busy(true,`กำลังอ่านข้อความ หน้า ${idx}/${ps.length}`,i/todo.length);
  const c=cleanForOcr(await blobToCanvas(p.blob,2600));
  const {data}=await w.recognize(c,{},{text:true,blocks:true});
  const lines=[];for(const b of data.blocks||[])for(const pa of b.paragraphs){for(const l of pa.lines){const words=l.words.map(x=>({t:fixThai(x.text),b:x.bbox})).filter(x=>x.t);if(words.length)lines.push({text:smartJoin(words.map(x=>x.t)),bbox:l.bbox,words})}lines.push(null)}
  p.ocr={lines,w:c.width,h:c.height};if(persist)await put('pages',p);
 }
 ocrCb=null;
}
function docText(ps){return ps.map(p=>{const out=[];let gap=false;for(const l of p.ocr.lines){if(!l){gap=true;continue}if(gap&&out.length)out.push('');gap=false;out.push(l.text)}return out.join('\n')}).join('\n\n')}
let txtFrom='doc';
$('#txtBack').onclick=()=>{if(txtFrom==='doc'&&curDoc)openDoc(curDoc.id);else show(null)};
$('#txtCopy').onclick=async()=>{const t=$('#txt').value;try{await navigator.clipboard.writeText(t);toast('คัดลอกแล้ว ไปวางใน LINE ได้เลย')}catch(e){$('#txt').select();document.execCommand('copy');toast('คัดลอกแล้ว')}};
$('#txtShare').onclick=async()=>{const t=$('#txt').value;if(navigator.share){try{await navigator.share({text:t})}catch(e){}}else{$('#txtCopy').click()}};
$('#txtWord').onclick=()=>{const lines=$('#txt').value.split('\n').map(t=>t.trim()?{text:t}:null);const name=safeName(curDoc&&txtFrom==='doc'?curDoc.name:'ข้อความ '+fileDate(Date.now()));exFiles=[new File([makeDocx([lines])],name+'.docx',{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})];deliver(exFiles)};
$('#tOcr').onclick=()=>$('#fOcr').click();
$('#fOcr').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
 try{busy(true,'กำลังเตรียมรูป...');const c=await blobToCanvas(f,4200);const q=detectOn(c,800);let b;
  if(q){const r=await processPage(c,q,'bw');b=r.blob}else b=await toBlob(applyMode(c,'bw'),'image/jpeg',.92);
  const p={blob:b};await ocrPages([p],false);busy(false);$('#txt').value=docText([p]);txtFrom='tool';show('txtScr')}catch(err){console.error(err);busy(false);toast('อ่านข้อความไม่สำเร็จ')}};

/* ---------- ไฟล์ zip / Word / Excel ---------- */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u){let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRC[(c^u[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
function zip(files){const en=new TextEncoder(),parts=[],cd=[];let off=0;
 for(const f of files){const nm=en.encode(f.name),data=typeof f.data==='string'?en.encode(f.data):f.data,crc=crc32(data);
  const h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(12,0x21,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,nm.length,true);
  parts.push(new Uint8Array(h.buffer),nm,data);
  const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(14,0x21,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
  cd.push(new Uint8Array(c.buffer),nm);off+=30+nm.length+data.length}
 const cs=cd.reduce((a,b)=>a+b.length,0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
 return new Blob([...parts,...cd,new Uint8Array(e.buffer)])}
const X=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
function makeDocx(pagesLines){
 const rp='<w:rPr><w:rFonts w:ascii="TH Sarabun New" w:hAnsi="TH Sarabun New" w:cs="TH Sarabun New"/><w:sz w:val="32"/><w:szCs w:val="32"/><w:lang w:val="th-TH" w:bidi="th-TH"/></w:rPr>';
 const para=t=>`<w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r>${rp}<w:t xml:space="preserve">${X(t)}</w:t></w:r></w:p>`;
 let body='';pagesLines.forEach((ls,i)=>{if(i)body+='<w:p><w:r><w:br w:type="page"/></w:r></w:p>';let gap=false;for(const l of ls){if(!l){gap=true;continue}if(gap)body+=para('');gap=false;body+=para(l.text)}});
 const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1134" w:bottom="1134" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>`;
 return zip([
  {name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'},
  {name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'},
  {name:'word/document.xml',data:doc}])}
const colName=n=>{let s='';n++;while(n){const m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26)}return s};
function makeXlsx(sheets){
 const files=[],ov=[],rels=[],wsx=[];
 sheets.forEach((rows,i)=>{const n=i+1;
  const data=rows.map((r,ri)=>`<row r="${ri+1}">${r.map((v,ci)=>{if(v==null||v==='')return'';const ref=colName(ci)+(ri+1);return /^-?\d+(\.\d+)?$/.test(v)&&v.length<15?`<c r="${ref}"><v>${v}</v></c>`:`<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${X(v)}</t></is></c>`}).join('')}</row>`).join('');
  const maxc=Math.max(1,...rows.map(r=>r.length)),cols=Array.from({length:maxc},(_,ci)=>{const w=Math.min(60,Math.max(8,...rows.map(r=>String(r[ci]||'').length*1.3)));return `<col min="${ci+1}" max="${ci+1}" width="${w.toFixed(1)}" customWidth="1"/>`}).join('');
  files.push({name:`xl/worksheets/sheet${n}.xml`,data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${cols}</cols><sheetData>${data}</sheetData></worksheet>`});
  ov.push(`<Override PartName="/xl/worksheets/sheet${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`);
  rels.push(`<Relationship Id="rId${n}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${n}.xml"/>`);
  wsx.push(`<sheet name="หน้า ${n}" sheetId="${n}" r:id="rId${n}"/>`)});
 const k=sheets.length+1;
 rels.push(`<Relationship Id="rId${k}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`);
 files.push({name:'[Content_Types].xml',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${ov.join('')}</Types>`});
 files.push({name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'});
 files.push({name:'xl/workbook.xml',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${wsx.join('')}</sheets></workbook>`});
 files.push({name:'xl/_rels/workbook.xml.rels',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>`});
 files.push({name:'xl/styles.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="14"/><name val="TH Sarabun New"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>'});
 return zip(files)}

/* ---------- ดึงตารางจากหน้าเอกสาร ---------- */
async function gridOf(blob,W,H){
 if(!CV)return null;const c=await blobToCanvas(blob,1600),k=W/c.width,cv=CV;
 const img=cv.imread(c),g=new cv.Mat(),bin=new cv.Mat(),h=new cv.Mat(),v=new cv.Mat();
 try{cv.cvtColor(img,g,cv.COLOR_RGBA2GRAY);cv.adaptiveThreshold(g,bin,255,cv.ADAPTIVE_THRESH_MEAN_C,cv.THRESH_BINARY_INV,15,10);
  const kh=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(Math.max(20,c.width/20|0),1)),kv=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(1,Math.max(20,c.height/40|0)));
  cv.morphologyEx(bin,h,cv.MORPH_OPEN,kh);cv.morphologyEx(bin,v,cv.MORPH_OPEN,kv);kh.delete();kv.delete();
  const w=c.width,ht=c.height,rs=new Float32Array(ht),cs=new Float32Array(w);
  for(let y=0;y<ht;y++)for(let x=0;x<w;x++){if(h.data[y*w+x])rs[y]++;if(v.data[y*w+x])cs[x]++}
  const clus=(arr,min)=>{const out=[];let s=-1;for(let i=0;i<=arr.length;i++){const on=i<arr.length&&arr[i]>min;if(on&&s<0)s=i;if(!on&&s>=0){out.push((s+i-1)/2*k);s=-1}}return out};
  return{hs:clus(rs,w*.25),vs:clus(cs,ht*.06)};
 }finally{img.delete();g.delete();bin.delete();h.delete();v.delete()}
}
async function tableOf(p){
 const L=p.ocr.lines.filter(Boolean);if(!L.length)return[['(ไม่พบข้อความ)']];
 let grid=null;try{grid=await gridOf(p.blob,p.ocr.w,p.ocr.h)}catch(e){grid=null}
 const splitLine=l=>{const ws=[...l.words].sort((a,b)=>a.b.x0-b.b.x0),hs=ws.map(w=>w.b.y1-w.b.y0).sort((a,b)=>a-b),mh=hs[hs.length>>1]||20,cells=[[]];
  ws.forEach((w,i)=>{if(i&&w.b.x0-ws[i-1].b.x1>mh*1.4)cells.push([]);cells[cells.length-1].push(w.t)});const r=cells.map(smartJoin);if(r.length>1&&/^\d+\.?$/.test(r[0])&&!/^\d/.test(r[1]))r.splice(0,2,r[0]+' '+r[1]);return r};
 if(grid&&grid.hs.length>=3&&grid.vs.length>=3){
  const top=grid.hs[0],bot=grid.hs[grid.hs.length-1],rows=[],inRows=new Map();
  const ri=y=>{for(let i=0;i<grid.hs.length-1;i++)if(y>=grid.hs[i]&&y<grid.hs[i+1])return i;return -1};
  const ci=x=>{for(let i=0;i<grid.vs.length-1;i++)if(x>=grid.vs[i]&&x<grid.vs[i+1])return i;return -1};
  const out=[];
  for(const l of L){const cy=(l.bbox.y0+l.bbox.y1)/2;if(cy<top||cy>bot){out.push({y:cy,cells:splitLine(l)});continue}
   for(const w of l.words){const r=ri((w.b.y0+w.b.y1)/2),c=ci((w.b.x0+w.b.x1)/2);if(r<0||c<0)continue;if(!inRows.has(r))inRows.set(r,[]);const row=inRows.get(r);(row[c]=row[c]||[]).push(w.t)}}
  for(const [r,row] of inRows)out.push({y:(grid.hs[r]+grid.hs[r+1])/2,cells:Array.from({length:grid.vs.length-1},(_,i)=>row[i]?smartJoin(row[i]):'')});
  out.sort((a,b)=>a.y-b.y);return out.map(o=>o.cells);
 }
 return L.map(splitLine);
}

/* ---------- รวม / แยก PDF ---------- */
let mFiles=[];
$('#tMerge').onclick=()=>{mFiles=[];renderMerge();show('mergeScr')};
$('#mergeBack').onclick=()=>show(null);
$('#mAdd').onclick=()=>$('#fPdfs').click();
$('#fPdfs').onchange=e=>{mFiles.push(...e.target.files);e.target.value='';renderMerge()};
function renderMerge(){$('#mList').innerHTML=mFiles.length?mFiles.map((f,i)=>`<div class="mitem"><b class="mitr" style="width:22px;color:var(--pinkD)">${i+1}</b><span>${esc(f.name)}</span><button class="ib" data-u="${i}" aria-label="เลื่อนขึ้น" ${i?'':'disabled'}><svg class="i"><use href="#i-up"/></svg></button><button class="ib" data-d="${i}" aria-label="เอาออก"><svg class="i"><use href="#i-x"/></svg></button></div>`).join(''):'<div class="empty">ยังไม่มีไฟล์ กดเพิ่มไฟล์ PDF ด้านล่าง</div>';$('#mGo').disabled=mFiles.length<2}
$('#mList').onclick=e=>{const u=e.target.closest('[data-u]'),d=e.target.closest('[data-d]');if(u){const i=+u.dataset.u;[mFiles[i-1],mFiles[i]]=[mFiles[i],mFiles[i-1]]}if(d)mFiles.splice(+d.dataset.d,1);renderMerge()};
$('#mGo').onclick=async()=>{if(!window.PDFLib)return toast('ตัวจัดการ PDF ยังโหลดไม่เสร็จ ลองอีกครั้ง');busy(true,'กำลังรวมไฟล์...');
 try{const out=await PDFLib.PDFDocument.create();for(const f of mFiles){const d=await PDFLib.PDFDocument.load(await f.arrayBuffer(),{ignoreEncryption:true});(await out.copyPages(d,d.getPageIndices())).forEach(p=>out.addPage(p))}
  const b=new Blob([await out.save()],{type:'application/pdf'});busy(false);exFiles=[new File([b],'รวมไฟล์_'+fileDate(Date.now())+'.pdf',{type:'application/pdf'})];showReady('รวมเสร็จแล้ว')}
 catch(e){console.error(e);busy(false);toast('รวมไม่สำเร็จ ไฟล์บางไฟล์อาจล็อกรหัสไว้')}};
let sFile=null,sMode='one';
$('#tSplit').onclick=()=>{sFile=null;$('#sName').textContent='ยังไม่ได้เลือกไฟล์';$('#sPages').value='';show('splitScr')};
$('#splitBack').onclick=()=>show(null);
$('#sPick').onclick=()=>$('#fPdf1').click();
$('#fPdf1').onchange=async e=>{sFile=e.target.files[0];e.target.value='';if(!sFile)return;$('#sName').textContent=sFile.name;
 try{const d=await PDFLib.PDFDocument.load(await sFile.arrayBuffer(),{ignoreEncryption:true});sFile.n=d.getPageCount();$('#sName').textContent=`${sFile.name} (${sFile.n} หน้า)`}catch(err){toast('เปิดไฟล์นี้ไม่ได้')}};
$('#sModeSeg').onclick=e=>{const b=e.target.closest('[data-s]');if(!b)return;sMode=b.dataset.s;$$('#sModeSeg button').forEach(x=>x.setAttribute('aria-pressed',x===b))};
function parseRange(s,n){if(!s.trim())return Array.from({length:n},(_,i)=>i);const out=[];for(const part of s.split(/[,\s]+/)){if(!part)continue;const m=part.match(/^(\d+)(?:-(\d+))?$/);if(!m)return null;let a=+m[1],b=m[2]?+m[2]:a;if(a>b)[a,b]=[b,a];for(let i=a;i<=b;i++)if(i>=1&&i<=n)out.push(i-1)}return out.length?out:null}
$('#sGo').onclick=async()=>{if(!sFile)return toast('เลือกไฟล์ PDF ก่อน');const idx=parseRange($('#sPages').value,sFile.n||0);if(!idx)return toast('เลขหน้าไม่ถูกต้อง เช่น 1-3, 5');
 busy(true,'กำลังดึงหน้า...');try{const src=await PDFLib.PDFDocument.load(await sFile.arrayBuffer(),{ignoreEncryption:true}),base=sFile.name.replace(/\.pdf$/i,'');exFiles=[];
  if(sMode==='one'){const o=await PDFLib.PDFDocument.create();(await o.copyPages(src,idx)).forEach(p=>o.addPage(p));exFiles.push(new File([await o.save()],`${base}_หน้าที่เลือก.pdf`,{type:'application/pdf'}))}
  else for(const i of idx){const o=await PDFLib.PDFDocument.create();(await o.copyPages(src,[i])).forEach(p=>o.addPage(p));exFiles.push(new File([await o.save()],`${base}_หน้า${i+1}.pdf`,{type:'application/pdf'}))}
  busy(false);showReady('เสร็จแล้ว')}catch(e){console.error(e);busy(false);toast('ดึงหน้าไม่สำเร็จ')}};
function showReady(title){exDoc=null;$('#exTitle').textContent=title;$('#exFmts').innerHTML='';$('#exSizeBox').style.display='none';$('#exBuild').style.display='none';
 const tot=exFiles.reduce((a,f)=>a+f.size,0);$('#exInfo').textContent=`${exFiles.length>1?exFiles.length+' ไฟล์':exFiles[0].name}  ขนาด ${fmtSize(tot)}`;$('#exDeliverTx').textContent=isIOS?'บันทึกลงไฟล์ / แชร์':'บันทึกลงเครื่อง';$('#exReady').classList.add('on');$('#exportBg').classList.add('on')}
const _openExport=openExport;openExport=(...a)=>{$('#exTitle').textContent='บันทึกและแชร์';_openExport(...a)};

/* ---------- ติดตั้ง ---------- */
let deferred=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('#install').hidden=false});
$('#install').onclick=async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;$('#install').hidden=true};
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
$$('.sheetBg').forEach(b=>b.addEventListener('click',e=>{if(e.target===b)b.classList.remove('on')}));

renderHome();loadAll().catch(e=>{console.error(e);$('#docs').innerHTML='<div class="empty">เครื่องนี้เก็บข้อมูลไม่ได้ ลองเปิดด้วย Chrome หรือ Safari</div>'});
}
