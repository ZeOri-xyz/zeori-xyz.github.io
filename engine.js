(() => {
const $=s=>document.querySelector(s), fmt=n=>Math.floor(n).toLocaleString('en-US');
const defaults={first:10000,step:5000,color:'#81f6c3',caption:'זה הקצב! 🔥',label:'LIKE GOAL',endpoint:'ws://localhost:21213/',height:540};
const params=new URLSearchParams(location.search), overlay=params.has('overlay')||!!window.OVERLAY_CONFIG;
let cfg={...defaults},total=0,demo=null,socket=null,retry=null,active=false,lastStage=0;
let streakStart=null,lastLike=null,streakShown=false,captionTimer=null;
function hideCaption(){document.querySelectorAll('.meter-caption').forEach(el=>el.classList.remove('is-visible'))}
function resetStreak(){streakStart=null;lastLike=null;streakShown=false;clearTimeout(captionTimer);hideCaption()}
function recordLike(){const now=Date.now();if(lastLike===null||now-lastLike>2500){streakStart=now;streakShown=false}lastLike=now;if(!streakShown&&now-streakStart>=10000){streakShown=true;document.querySelectorAll('.meter-caption').forEach(el=>el.classList.add('is-visible'));clearTimeout(captionTimer);captionTimer=setTimeout(hideCaption,5000)}}
try{cfg={...cfg,...JSON.parse(localStorage.getItem('ohana-config')||'{}')}}catch{}
try{if(params.has('config'))cfg={...cfg,...JSON.parse(params.get('config'))}}catch{}
if(window.OVERLAY_CONFIG)cfg={...defaults,...window.OVERLAY_CONFIG};
cfg.first=Math.max(1,Number(cfg.first)||10000);cfg.step=Math.max(1,Number(cfg.step)||5000);
function stage(n){const index=n<cfg.first?0:Math.floor((n-cfg.first)/cfg.step)+1;const previous=index===0?0:cfg.first+(index-1)*cfg.step;return {index,previous,goal:cfg.first+index*cfg.step,progress:(n-previous)/(index===0?cfg.first:cfg.step)}}
function draw(){const s=stage(total);document.documentElement.style.setProperty('--accent',cfg.color);document.querySelectorAll('.meter').forEach(m=>{m.style.setProperty('--progress',Math.max(0,Math.min(1,s.progress)));m.style.setProperty('--meter-height',cfg.height+'px');m.querySelector('.goal-number').textContent=fmt(s.goal);m.querySelector('.current-number').textContent=fmt(total);m.querySelector('.meter-label').textContent=cfg.label;m.querySelector('.meter-caption').textContent=cfg.caption;if(s.index>lastStage){m.classList.remove('celebrate');void m.offsetWidth;m.classList.add('celebrate')}});lastStage=s.index;if(!overlay){$('#total').textContent=fmt(total);$('#remaining').textContent=fmt(s.goal-total);$('#stage').textContent=String(s.index+1).padStart(2,'0');$('#progress-value').textContent=Math.round(s.progress*100)+'%';$('#progress-fill').style.width=(s.progress*100)+'%';$('#next-goals').textContent=[0,1,2].map(i=>fmt(s.goal+i*cfg.step)).join('  ←  ');$('#manual-total').value=total;$('#overlay-url').value=makeUrl()}}
function setTotal(n,trackLikes=false){if(Number.isFinite(n)&&n>=0){if(trackLikes&&Math.floor(n)>total)recordLike();else if(n<total)resetStreak();total=Math.floor(n);draw()}}
function status(text,connected=false){if(!overlay){$('#connection-status').textContent=text;$('#status-dot').classList.toggle('connected',connected);$('#connect').textContent=active?'ניתוק':'חיבור ללייב'}}
function stopDemo(){if(demo){clearInterval(demo);demo=null}if(!overlay)$('#demo').textContent='▶ הפעלת הדגמה'}
function connect(){stopDemo();clearTimeout(retry);active=true;status('מתחבר ל־TikFinity…');try{socket=new WebSocket(cfg.endpoint)}catch{active=false;status('כתובת חיבור לא תקינה');return}socket.onopen=()=>status('מחובר · ממתין ללייקים',true);socket.onmessage=e=>{try{const p=JSON.parse(e.data);if(p.event==='like'){const n=Number(p.data?.totalLikeCount);if(Number.isFinite(n)&&n>=0){setTotal(n,true);status('מחובר · מקבל לייקים',true)}}}catch{}};socket.onerror=()=>status('אין חיבור · יש לפתוח TikFinity במחשב');socket.onclose=()=>{socket=null;if(active){status('ממתין ל־TikFinity · ניסיון חוזר…');retry=setTimeout(connect,5000)}}}
function disconnect(){resetStreak();active=false;clearTimeout(retry);if(socket){socket.onclose=null;socket.close();socket=null}status('לא מחובר ללייב')}
function makeUrl(){const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('overlay','1');u.searchParams.set('config',JSON.stringify(cfg));return u.href}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.remove('show'),3200)}
function persist(){try{localStorage.setItem('ohana-config',JSON.stringify(cfg))}catch{}draw()}
hideCaption();
if(overlay){document.body.appendChild($('.meter'));document.body.classList.add('overlay-only');draw();connect();return}
for(const key of ['first','step','caption','label','endpoint','height']){const input=$('#'+key);input.value=cfg[key];input.addEventListener('change',()=>{if(['first','step','height'].includes(key)){let n=Number(input.value);if(!Number.isFinite(n)||n<Number(input.min)||n>Number(input.max)){input.value=cfg[key];toast('יש להזין מספר בטווח המותר');return}cfg[key]=n}else cfg[key]=input.value.trim();persist()})}
document.querySelectorAll('[data-color]').forEach(b=>{b.classList.toggle('selected',b.dataset.color===cfg.color);b.onclick=()=>{cfg.color=b.dataset.color;$('#custom-color').value=cfg.color;document.querySelectorAll('[data-color]').forEach(a=>a.classList.toggle('selected',a===b));persist()}});
$('#custom-color').value=cfg.color;$('#custom-color').oninput=e=>{cfg.color=e.target.value;document.querySelectorAll('[data-color]').forEach(b=>b.classList.remove('selected'));persist()};
$('#connect').onclick=()=>active?disconnect():connect();
$('#demo').onclick=()=>{if(demo){stopDemo();status('ההדגמה נעצרה');return}disconnect();setTotal(6740);status('מצב הדגמה · לייקים מדומים');$('#demo').textContent='Ⅱ עצירת הדגמה';demo=setInterval(()=>setTotal(total+70+Math.floor(Math.random()*130),true),650)};
document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{disconnect();stopDemo();status('מצב ידני · נתוני בדיקה');setTotal(total+Number(b.dataset.add))});
$('#set-total').onclick=()=>{const n=Number($('#manual-total').value);if(!Number.isFinite(n)||n<0)return toast('יש להזין מספר חיובי');disconnect();stopDemo();setTotal(n);status('מצב ידני · נתוני בדיקה')};
$('#reset').onclick=()=>{disconnect();stopDemo();setTotal(0);lastStage=0;status('אופס · מוכן ללייב חדש')};
$('#copy').onclick=async()=>{try{await navigator.clipboard.writeText(makeUrl());toast('הקישור הועתק')}catch{ $('#overlay-url').select();toast('סמן והעתק את הקישור ידנית')}};
$('#open-overlay').onclick=()=>window.open(makeUrl(),'_blank','noopener');
$('#download').onclick=async()=>{try{const [css,js]=window.BUNDLED_JS?[window.BUNDLED_CSS,window.BUNDLED_JS]:await Promise.all(['style.css','engine.js'].map(f=>fetch(f).then(r=>{if(!r.ok)throw Error();return r.text()})));const html='<!doctype html><html><head><meta charset="utf-8"><title>OHANA Live Overlay</title><style>'+css+'</style></head><body class="overlay-only">'+$('.meter').outerHTML+'<script>window.OVERLAY_CONFIG='+JSON.stringify(cfg).replace(/</g,'\\u003c')+';<\/script><script>'+js.replace(/<\/script/gi,'<\\/script')+'<\/script></body></html>';const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='ohana-overlay.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('הקובץ הורד · הוסף כקובץ מקומי ב־OBS')}catch{toast('ההורדה נכשלה, נסה שוב')}};
draw();
})();
