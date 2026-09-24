const $ = s => document.querySelector(s);
const fmt = d => new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(d);
const iso = d => { const x=new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; };
function addDays(date,n){const d=new Date(date);d.setDate(d.getDate()+n);return d}
function diffDays(a,b){return Math.round((new Date(b)-new Date(a))/86400000)}
function saveCycle(data){localStorage.setItem('cyclecareCycle',JSON.stringify(data))}
function getCycle(){try{return JSON.parse(localStorage.getItem('cyclecareCycle'))}catch(e){return null}}
function clearCycle(){localStorage.removeItem('cyclecareCycle');location.reload()}

function calculate(last,cycle,period){
  const start=new Date(last+'T00:00:00');
  const today=new Date();today.setHours(0,0,0,0);
  let currentStart=new Date(start);
  let next=addDays(currentStart,cycle);
  while(next<=today){currentStart=new Date(next);next=addDays(currentStart,cycle)}
  const ov=addDays(next,-14);
  const fertileStart=addDays(ov,-5), fertileEnd=addDays(ov,1);
  const cycleDay=Math.max(1,diffDays(currentStart,today)+1);
  const days=Math.max(0,diffDays(today,next));
  return {last,start,currentStart,next,period,cycle,ov,fertileStart,fertileEnd,cycleDay,days};
}

function renderResults(r){
  $('#results')?.classList.remove('hidden');
  $('#emptyCalc')?.classList.add('hidden');
  if(!$('#results')) return;
  $('#nextStart').textContent=fmt(r.next);
  $('#nextEnd').textContent=fmt(addDays(r.next,r.period-1));
  $('#ovulation').textContent=fmt(r.ov);
  $('#fertile').textContent=`${fmt(r.fertileStart)} – ${fmt(r.fertileEnd)}`;
  $('#cycleDay').textContent=`Day ${r.cycleDay}`;
  $('#countdown').textContent=r.days===0?'Expected around today':`${r.days} day${r.days===1?'':'s'}`;
}

function runCalculator(){
  const last=$('#lastPeriod')?.value, cycle=Number($('#cycleLength')?.value), period=Number($('#periodLength')?.value);
  if($('#error')) $('#error').textContent='';
  if(!last){$('#error').textContent='Please enter the first day of your last period.';return}
  const d=new Date(last+'T00:00:00'), now=new Date();now.setHours(23,59,59,999);
  if(d>now){$('#error').textContent='The last-period date cannot be in the future.';return}
  if(cycle<21||cycle>40){$('#error').textContent='Cycle length must be between 21 and 40 days.';return}
  if(period<2||period>10){$('#error').textContent='Period duration must be between 2 and 10 days.';return}
  const r=calculate(last,cycle,period);saveCycle({last,cycle,period});renderResults(r);
}

function initCalculator(){
  const saved=getCycle();
  if(saved && $('#lastPeriod')){
    $('#lastPeriod').value=saved.last;
    $('#cycleLength').value=saved.cycle;
    $('#periodLength').value=saved.period;
    renderResults(calculate(saved.last,saved.cycle,saved.period));
  }
  $('#calcForm')?.addEventListener('submit',e=>{e.preventDefault();runCalculator()});
  $('#clearData')?.addEventListener('click',clearCycle);
}

function buildCalendar(container,r,year,month){
  const first=new Date(year,month,1), last=new Date(year,month+1,0), start=first.getDay();
  $('#monthTitle').textContent=first.toLocaleDateString('en-US',{month:'long',year:'numeric'});
  container.innerHTML='';
  for(let i=0;i<start;i++){const x=document.createElement('div');x.className='day muted';container.appendChild(x)}
  for(let n=1;n<=last.getDate();n++){
    const d=new Date(year,month,n), x=document.createElement('div');x.className='day';
    const diffStart=diffDays(r.currentStart,d);
    if(diffStart>=0 && diffStart<r.period) x.classList.add('period');
    if(d>=r.fertileStart&&d<=r.fertileEnd) x.classList.add('fertile');
    if(iso(d)===iso(r.ov)) x.classList.add('ovulation');
    const t=new Date();t.setHours(0,0,0,0);
    if(iso(d)===iso(t)) x.classList.add('today');
    x.innerHTML=`<div class="day-num">${n}</div>`;
    container.appendChild(x);
  }
}

function initCalendar(){
  const saved=getCycle(), box=$('#calendarGrid');
  if(!box || !$('#noCalendar') || !$('#calendarArea')) return;
  if(!saved){$('#noCalendar').classList.remove('hidden');$('#calendarArea').classList.add('hidden');return}
  const r=calculate(saved.last,saved.cycle,saved.period);
  let y=new Date().getFullYear(),m=new Date().getMonth();
  $('#calendarArea').classList.remove('hidden');
  $('#noCalendar').classList.add('hidden');
  const draw=()=>buildCalendar(box,r,y,m);draw();
  $('#prevMonth').onclick=()=>{m--;if(m<0){m=11;y--}draw()};
  $('#nextMonth').onclick=()=>{m++;if(m>11){m=0;y++}draw()};
}

document.addEventListener('DOMContentLoaded',()=>{initCalculator();initCalendar()});

function initNewGuidesSlider(){
  const track=$('#newGuidesTrack'), prev=$('#newGuidesPrev'), next=$('#newGuidesNext'), dots=$('#newGuidesDots');
  if(!track||!dots) return;
  const slides=[...track.querySelectorAll('.new-guide-slide')];
  if(!slides.length) return;
  let index=0, timer=null;
  const dotButtons=slides.map((_,i)=>{
    const b=document.createElement('button'); b.type='button'; b.className='slider-dot'+(i===0?' active':'');
    b.setAttribute('aria-label',`Show guide ${i+1}`);
    b.addEventListener('click',()=>go(i,true));
    dots.appendChild(b); return b;
  });
  const go=(i,manual=false)=>{
    index=(i+slides.length)%slides.length;
    track.style.transform=`translateX(-${index*100}%)`;
    dotButtons.forEach((b,n)=>b.classList.toggle('active',n===index));
    if(manual) restart();
  };
  const restart=()=>{
    if(timer) clearInterval(timer);
    timer=setInterval(()=>go(index+1),5000);
  };
  prev?.addEventListener('click',()=>go(index-1,true));
  next?.addEventListener('click',()=>go(index+1,true));
  const shell=track.closest('.new-guides-shell');
  shell?.addEventListener('mouseenter',()=>{if(timer) clearInterval(timer)});
  shell?.addEventListener('mouseleave',restart);
  shell?.addEventListener('focusin',()=>{if(timer) clearInterval(timer)});
  shell?.addEventListener('focusout',e=>{if(!shell.contains(e.relatedTarget)) restart()});
  let startX=0;
  track.addEventListener('touchstart',e=>{startX=e.changedTouches[0].clientX},{passive:true});
  track.addEventListener('touchend',e=>{
    const dx=e.changedTouches[0].clientX-startX;
    if(Math.abs(dx)>45) go(index+(dx<0?1:-1),true);
  },{passive:true});
  restart();
}
document.addEventListener('DOMContentLoaded',()=>{initNewGuidesSlider()});
