(() => {
'use strict';
const $=id=>document.getElementById(id),form=$('promptForm'),input=$('prompt'),results=$('results'),welcome=$('welcome');
const KEY='dastyar3houshe.history.v3',models=[['chatgpt','ChatGPT'],['deepseek','DeepSeek'],['copilot','Copilot']];
let history=[],currentId=null,lastSpoken='';
const THEME_KEY='dastyar3houshe.theme.v1';
function applyTheme(theme){const chosen=theme==='light'?'light':'dark';document.body.dataset.theme=chosen;const icon=$('themeIcon');if(icon)icon.textContent=chosen==='dark'?'☀️':'🌙';const btn=$('themeToggle');if(btn){btn.title=chosen==='dark'?'فعال‌کردن تم روشن':'فعال‌کردن تم تیره';btn.setAttribute('aria-label',btn.title)}const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=chosen==='dark'?'#101827':'#f4f7ff';try{localStorage.setItem(THEME_KEY,chosen)}catch{}}
let savedTheme='dark';try{savedTheme=localStorage.getItem(THEME_KEY)||'dark'}catch{}
try{history=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(history))history=[]}catch{history=[]}
const directionOf=t=>/[\u0590-\u08FF]/.test(t)?'rtl':'ltr';
function setStatus(t){$('voiceStatus').textContent=t}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(history.slice(0,60)))}catch{setStatus('فضای ذخیره‌سازی دستگاه کافی یا در دسترس نیست.')}renderHistory()}
function copyText(value){if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(value).then(()=>setStatus('متن کپی شد.')).catch(()=>fallbackCopy(value))}else fallbackCopy(value)}
function fallbackCopy(value){const t=document.createElement('textarea');t.value=value;document.body.append(t);t.select();try{document.execCommand('copy');setStatus('متن کپی شد.')}catch{setStatus('کپی خودکار ممکن نشد.')}t.remove()}
function plainCard(title,body,status){const a=document.createElement('article');a.className='result-card';const h=document.createElement('h3');h.textContent=title;const p=document.createElement('p');p.textContent=body;p.dir=directionOf(body);const s=document.createElement('div');s.className='status';s.textContent=status;a.append(h,p,s);results.append(a);return a}
function getCurrent(){return history.find(x=>x.id===currentId)}
function renderModelCards(item){
 models.forEach(([key,label])=>{
  const card=document.createElement('article');card.className='result-card model-card';
  const h=document.createElement('h3');h.textContent=label+' — پاسخ';card.append(h);
  const area=document.createElement('textarea');area.className='manual-answer';area.rows=6;area.placeholder='پاسخ '+label+' را اینجا وارد یا جای‌گذاری کن...';area.value=item.answers?.[key]||'';area.setAttribute('aria-label','پاسخ '+label);area.dir=directionOf(area.value||'فارسی');card.append(area);
  const status=document.createElement('div');status.className='status';status.textContent=area.value?'پاسخ ذخیره‌شده':'هنوز پاسخی وارد نشده';card.append(status);
  const actions=document.createElement('div');actions.className='card-actions';
  const save=document.createElement('button');save.type='button';save.textContent='ذخیره پاسخ';
  save.addEventListener('click',()=>{const live=getCurrent();if(!live)return;live.answers=live.answers||{};live.answers[key]=area.value.trim();persist();status.textContent=live.answers[key]?'ذخیره شد':'پاسخ خالی است';setStatus('پاسخ '+label+' ذخیره شد.')});
  const copy=document.createElement('button');copy.type='button';copy.textContent='کپی';copy.addEventListener('click',()=>copyText(area.value));
  actions.append(save,copy);card.append(actions);results.append(card);
 });
 const toolbar=document.createElement('div');toolbar.className='compare-toolbar';const title=document.createElement('h2');title.textContent='مقایسه پاسخ‌ها';const compare=document.createElement('button');compare.type='button';compare.className='compare-button';compare.textContent='نمایش کنار هم';
 compare.addEventListener('click',()=>{const live=getCurrent();if(!live)return;models.forEach(([k])=>{live.answers=live.answers||{};const el=results.querySelector('[aria-label="پاسخ '+models.find(m=>m[0]===k)[1]+'"]');if(el)live.answers[k]=el.value.trim()});persist();renderComparison(live);setStatus('پاسخ‌ها در نمای مقایسه نمایش داده شدند.')});
 toolbar.append(title,compare);results.append(toolbar);
 const compareBox=document.createElement('section');compareBox.id='compareBox';compareBox.className='compare-grid';results.append(compareBox);renderComparison(item);
 renderEvaluation(item);
}
function renderEvaluation(item){
 const panel=document.createElement('section');panel.className='evaluation-panel';panel.id='evaluationPanel';
 const heading=document.createElement('h2');heading.textContent='ارزیابی و امتیازدهی پاسخ‌ها';panel.append(heading);
 const note=document.createElement('p');note.className='evaluation-note';note.textContent='برای هر پاسخ از ۱ تا ۵ امتیاز بده. این ارزیابی دستی است و توسط مدل هوش مصنوعی انجام نمی‌شود.';panel.append(note);
 const criteria=[['accuracy','دقت و درستی'],['completeness','کامل‌بودن'],['clarity','وضوح بیان'],['reasoning','استدلال و منطق']];
 const table=document.createElement('div');table.className='evaluation-table';
 const header=document.createElement('div');header.className='evaluation-row evaluation-header';
 const blank=document.createElement('b');blank.textContent='معیار';header.append(blank);
 models.forEach(([,label])=>{const b=document.createElement('b');b.textContent=label;header.append(b)});table.append(header);
 item.review=item.review||{};
 criteria.forEach(([key,label])=>{
  const row=document.createElement('div');row.className='evaluation-row';
  const name=document.createElement('span');name.textContent=label;row.append(name);
  models.forEach(([modelKey])=>{
   const select=document.createElement('select');select.setAttribute('aria-label',label+' - '+modelKey);
   [['0','—'],['1','۱'],['2','۲'],['3','۳'],['4','۴'],['5','۵']].forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;select.append(o)});
   select.value=String(item.review[modelKey]?.[key]??0);
   select.addEventListener('change',()=>{item.review[modelKey]=item.review[modelKey]||{};item.review[modelKey][key]=Number(select.value);persist();updateEvaluationSummary(item,summary)});
   row.append(select);
  });table.append(row);
 });panel.append(table);
 const summary=document.createElement('div');summary.className='evaluation-summary';panel.append(summary);
 updateEvaluationSummary(item,summary);
 const disclaimer=document.createElement('p');disclaimer.className='evaluation-note';disclaimer.textContent='امتیاز صفر یعنی هنوز ارزیابی نشده است. میانگین فقط بر اساس معیارهای امتیازگرفته‌شده محاسبه می‌شود.';panel.append(disclaimer);
 results.append(panel);
}
function updateEvaluationSummary(item,summary){
 summary.replaceChildren();
 models.forEach(([key,label])=>{
  const scores=Object.values(item.review?.[key]||{}).filter(v=>Number(v)>0).map(Number);
  const avg=scores.length?(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(2):'—';
  const box=document.createElement('div');box.className='evaluation-score';
  const name=document.createElement('b');name.textContent=label;
  const value=document.createElement('strong');value.textContent=avg==='—'?'بدون امتیاز':avg+' از ۵';
  const count=document.createElement('small');count.textContent=scores.length+' معیار از ۴';
  box.append(name,value,count);summary.append(box);
 });
}
function renderComparison(item){const box=$('compareBox');if(!box)return;box.replaceChildren();models.forEach(([key,label])=>{const cell=document.createElement('article');cell.className='compare-cell';const h=document.createElement('h3');h.textContent=label;const p=document.createElement('p');const value=item.answers?.[key]||'';p.textContent=value||'هنوز پاسخی ثبت نشده است.';p.dir=directionOf(value);if(!value)p.className='compare-empty';cell.append(h,p);box.append(cell)})}
function renderCurrent(item){currentId=item.id;welcome.classList.add('hidden');results.replaceChildren();plainCard('پرسش شما',item.prompt,'پرسش ذخیره‌شده روی همین دستگاه');renderModelCards(item);$('historyPanel').classList.add('hidden')}
function createQuestion(q){const item={id:(Date.now().toString(36)+Math.random().toString(36).slice(2,7)),prompt:q,createdAt:new Date().toISOString(),answers:{}};history.unshift(item);history=history.slice(0,60);persist();lastSpoken=q;renderCurrent(item)}
function renderHistory(){const list=$('historyList');if(!list)return;list.replaceChildren();if(!history.length){const p=document.createElement('p');p.className='muted tiny';p.textContent='هنوز گفتگویی ذخیره نشده است.';list.append(p);return}history.forEach(item=>{const b=document.createElement('button');b.type='button';b.className='history-item';b.textContent=item.prompt;const meta=document.createElement('small');const count=models.filter(([k])=>item.answers?.[k]?.trim()).length;meta.textContent=(item.createdAt?new Date(item.createdAt).toLocaleString('fa-IR'):'')+' · '+count+' پاسخ از ۳';b.append(meta);b.addEventListener('click',()=>renderCurrent(item));list.append(b)})}
form.addEventListener('submit',e=>{e.preventDefault();const q=input.value.trim();if(!q){setStatus('ابتدا پرسش خود را بنویس.');return}createQuestion(q);input.value='';input.focus()});
$('historyToggle').addEventListener('click',()=>$('historyPanel').classList.toggle('hidden'));
$('clearHistory').addEventListener('click',()=>{if(confirm('همه گفتگوهای ذخیره‌شده روی این دستگاه پاک شوند؟')){history=[];currentId=null;persist();results.replaceChildren();welcome.classList.remove('hidden');setStatus('تاریخچه پاک شد.')}});
$('clearInput').addEventListener('click',()=>{input.value='';input.focus()});
document.querySelectorAll('.suggestion').forEach(b=>b.addEventListener('click',()=>{input.value=b.textContent+' ';input.focus()}));
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
$('micButton').addEventListener('click',()=>{if(!SR){setStatus('تشخیص گفتار در این مرورگر پشتیبانی نمی‌شود؛ از میکروفون صفحه‌کلید گوشی استفاده کن.');return}const r=new SR();r.lang='fa-IR';r.interimResults=false;r.maxAlternatives=1;r.onstart=()=>setStatus('در حال شنیدن...');r.onresult=e=>{input.value+=(input.value?' ':'')+e.results[0][0].transcript;setStatus('گفتار به متن تبدیل شد.')};r.onerror=e=>setStatus('خطای میکروفون: '+e.error);try{r.start()}catch{setStatus('شروع میکروفون ممکن نشد؛ مجوزها را بررسی کن.')}});
function speechText(){const item=getCurrent();if(item){const values=models.map(([k,label])=>label+': '+(item.answers?.[k]||'پاسخی ثبت نشده'));return item.prompt+'\n\n'+values.join('\n\n')}return input.value.trim()||lastSpoken}
function speak(){if(!('speechSynthesis'in window)){setStatus('خواندن صوتی در این مرورگر پشتیبانی نمی‌شود.');return}const t=speechText();if(!t){setStatus('ابتدا پرسشی وارد کن.');return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang=directionOf(t)==='rtl'?'fa-IR':'en-US';const voices=speechSynthesis.getVoices(),fa=voices.filter(v=>v.lang.toLowerCase().startsWith('fa')),choice=$('voiceChoice').value;if(fa.length){let v=fa[0];if(choice!=='default'){const found=fa.find(x=>choice==='female'?/female|woman|زن/i.test(x.name):/male|man|مرد/i.test(x.name));if(found)v=found}u.voice=v}u.onstart=()=>setStatus('در حال پخش صدا...');u.onend=()=>setStatus('پخش صدا تمام شد.');speechSynthesis.speak(u)}
$('speakButton').addEventListener('click',speak);
$('pauseButton').addEventListener('click',()=>{if(!('speechSynthesis'in window))return;if(speechSynthesis.speaking&&!speechSynthesis.paused){speechSynthesis.pause();setStatus('پخش مکث شد.')}else if(speechSynthesis.paused){speechSynthesis.resume();setStatus('ادامه پخش...')}});
$('stopButton').addEventListener('click',()=>{if('speechSynthesis'in window)speechSynthesis.cancel();setStatus('پخش متوقف شد.')});
$('themeToggle').addEventListener('click',()=>applyTheme(document.body.dataset.theme==='dark'?'light':'dark'));
applyTheme(savedTheme);
renderHistory();
})();