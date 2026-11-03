(() => {
'use strict';
const $ = id => document.getElementById(id);
const form=$('promptForm'), input=$('prompt'), results=$('results'), welcome=$('welcome');
const KEY='dastyar3houshe.history.v2';
let history=[];
let lastSpoken='';
try{history=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(history))history=[]}catch{history=[]}
const directionOf=t=>/[\u0590-\u08FF]/.test(t)?'rtl':'ltr';
function makeCard(title,body,status,showCopy=true){
 const article=document.createElement('article');article.className='result-card';
 const head=document.createElement('div');head.className='result-head';
 const h=document.createElement('h3');h.textContent=title;head.append(h);article.append(head);
 const p=document.createElement('p');p.textContent=body;p.dir=directionOf(body);article.append(p);
 const s=document.createElement('div');s.className='status';s.textContent=status;article.append(s);
 if(showCopy){const actions=document.createElement('div');actions.className='card-actions';const copy=document.createElement('button');copy.type='button';copy.textContent='کپی متن';copy.addEventListener('click',()=>copyText(body));actions.append(copy);article.append(actions)}
 results.append(article);return article;
}
function copyText(value){if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(value).then(()=>setStatus('متن کپی شد.')).catch(()=>fallbackCopy(value))}else fallbackCopy(value)}
function fallbackCopy(value){const t=document.createElement('textarea');t.value=value;document.body.append(t);t.select();try{document.execCommand('copy');setStatus('متن کپی شد.')}catch{setStatus('کپی خودکار ممکن نشد.')}t.remove()}
function setStatus(message){$('voiceStatus').textContent=message}
function save(){try{localStorage.setItem(KEY,JSON.stringify(history.slice(0,60)))}catch{setStatus('فضای ذخیره‌سازی در دسترس نیست.')}renderHistory()}
function renderHistory(){
 const list=$('historyList');list.replaceChildren();
 if(!history.length){const p=document.createElement('p');p.className='muted tiny';p.textContent='هنوز گفتگویی ذخیره نشده است.';list.append(p);return}
 history.forEach((item,index)=>{const b=document.createElement('button');b.type='button';b.className='history-item';b.textContent=item.prompt;const meta=document.createElement('small');meta.textContent=item.createdAt?new Date(item.createdAt).toLocaleString('fa-IR'):'گفتگوی ذخیره‌شده';b.append(meta);b.addEventListener('click',()=>showHistoryItem(index));list.append(b)})
}
function showHistoryItem(index){const item=history[index];if(!item)return;welcome.classList.add('hidden');results.replaceChildren();makeCard('پرسش ذخیره‌شده',item.prompt,'از تاریخچه محلی',true);if(item.manualCopilot)makeCard('پاسخ ثبت‌شده Copilot',item.manualCopilot,'ذخیره‌شده روی دستگاه',true);input.value=item.prompt;$('historyPanel').classList.add('hidden')}
function submitQuestion(q){
 if(!q)return;welcome.classList.add('hidden');results.replaceChildren();
 makeCard('پرسش شما',q,'ذخیره‌شده روی همین دستگاه',true);
 makeCard('ChatGPT','برای دریافت پاسخ واقعی، اتصال امن API و Backend لازم است.','هنوز متصل نشده',false);
 makeCard('DeepSeek','برای دریافت پاسخ واقعی، اتصال امن API و Backend لازم است.','هنوز متصل نشده',false);
 const copilot=makeCard('Copilot','در این نسخه اتصال خودکار فعال نیست. می‌توانی پاسخ Copilot را پس از دریافت، دستی ثبت کنی.','ورود دستی پاسخ',false);
 const manual=document.createElement('textarea');manual.rows=3;manual.placeholder='پاسخ Copilot را اینجا وارد کن...';manual.className='manual-answer';manual.setAttribute('aria-label','پاسخ دستی Copilot');copilot.append(manual);
 const saveManual=document.createElement('button');saveManual.type='button';saveManual.className='manual-save';saveManual.textContent='ذخیره پاسخ Copilot';saveManual.addEventListener('click',()=>{const value=manual.value.trim();if(!value){setStatus('ابتدا پاسخ Copilot را وارد کن.');return}const item=history.find(x=>x.prompt===q);if(item)item.manualCopilot=value;save();makeCard('پاسخ ثبت‌شده Copilot',value,'ذخیره‌شده روی دستگاه',true);setStatus('پاسخ Copilot در تاریخچه ذخیره شد.')});copilot.append(saveManual);
 history.unshift({prompt:q,createdAt:new Date().toISOString()});history=history.slice(0,60);save();lastSpoken=q;
}
form.addEventListener('submit',e=>{e.preventDefault();const q=input.value.trim();if(!q){setStatus('ابتدا پرسش خود را بنویس.');return}submitQuestion(q);input.value='';input.focus()});
$('historyToggle').addEventListener('click',()=>$('historyPanel').classList.toggle('hidden'));
$('clearHistory').addEventListener('click',()=>{if(confirm('همه گفتگوهای ذخیره‌شده روی این دستگاه پاک شوند؟')){history=[];save();setStatus('تاریخچه پاک شد.')}});
$('clearInput').addEventListener('click',()=>{input.value='';input.focus()});
document.querySelectorAll('.suggestion').forEach(b=>b.addEventListener('click',()=>{input.value=b.textContent+' ';input.focus()}));
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
$('micButton').addEventListener('click',()=>{if(!SR){setStatus('تشخیص گفتار در این مرورگر پشتیبانی نمی‌شود؛ از میکروفون صفحه‌کلید گوشی استفاده کن.');return}const recognition=new SR();recognition.lang='fa-IR';recognition.interimResults=false;recognition.maxAlternatives=1;recognition.onstart=()=>setStatus('در حال شنیدن...');recognition.onresult=e=>{input.value+=(input.value?' ':'')+e.results[0][0].transcript;setStatus('گفتار به متن تبدیل شد.')};recognition.onerror=e=>setStatus('خطای میکروفون: '+e.error);recognition.onend=()=>{};try{recognition.start()}catch{setStatus('شروع میکروفون ممکن نشد؛ مجوزها را بررسی کن.')}});
function speechText(){const answer=[...results.querySelectorAll('.result-card p')].map(p=>p.textContent).filter(Boolean);return answer.length?answer.join('\n\n'):input.value.trim()||lastSpoken}
function speak(){if(!('speechSynthesis'in window)){setStatus('خواندن صوتی در این مرورگر پشتیبانی نمی‌شود.');return}const text=speechText();if(!text){setStatus('ابتدا پرسشی وارد کن یا پاسخی را نمایش بده.');return}speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang=directionOf(text)==='rtl'?'fa-IR':'en-US';const voices=speechSynthesis.getVoices();const choice=$('voiceChoice').value;const fa=voices.filter(v=>v.lang.toLowerCase().startsWith('fa'));if(fa.length){let selected=fa[0];if(choice!=='default'){const match=fa.find(v=>choice==='female'?/female|woman|زن/i.test(v.name):/male|man|مرد/i.test(v.name));if(match)selected=match}utterance.voice=selected}utterance.onstart=()=>setStatus('در حال پخش صدا...');utterance.onend=()=>setStatus('پخش صدا تمام شد.');speechSynthesis.speak(utterance)}
$('speakButton').addEventListener('click',speak);
$('pauseButton').addEventListener('click',()=>{if(!('speechSynthesis'in window))return;if(speechSynthesis.speaking&&!speechSynthesis.paused){speechSynthesis.pause();setStatus('پخش مکث شد.')}else if(speechSynthesis.paused){speechSynthesis.resume();setStatus('ادامه پخش...')}});
$('stopButton').addEventListener('click',()=>{if('speechSynthesis'in window)speechSynthesis.cancel();setStatus('پخش متوقف شد.')});
renderHistory();
})();