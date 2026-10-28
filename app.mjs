import {analyze,demo,parseCSV,toCSV} from './engine.mjs';
const $=id=>document.getElementById(id);
let rows=demo('hum'), report, name='Synthetic / 50 Hz interference', revision=0;
const fmt=v=>v===null?'Unavailable':Number(v).toLocaleString('en-US',{maximumFractionDigits:3});
function element(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function error(message){$('message').textContent=message;$('message').hidden=false;}
function clearAI(){revision++;$('ai-result').replaceChildren();$('ai-status').textContent='Not requested. Measurements work without AI.';}
function save(filename,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=element('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function plot(canvas,points,{spectral=false,empty=false}={}) {
  const rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
  canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);const w=rect.width,h=rect.height,pad=35;
  ctx.clearRect(0,0,w,h);ctx.strokeStyle=spectral?'#c9d8e4':'#36536c';ctx.lineWidth=.6;
  for(let i=1;i<6;i++){ctx.beginPath();ctx.moveTo(pad+(w-pad-10)*i/6,10);ctx.lineTo(pad+(w-pad-10)*i/6,h-22);ctx.stroke();}
  for(let i=0;i<4;i++){const y=12+(h-40)*i/3;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(w-10,y);ctx.stroke();}
  if(empty||!points.length){ctx.fillStyle='#536779';ctx.font='12px Segoe UI';ctx.fillText('Spectrum withheld. See the evidence ledger.',pad,h/2);return;}
  const xmin=points[0][0],xmax=points.at(-1)[0];
  const ymin=spectral?0:report.railMin,ymax=spectral?Math.max(...points.map(p=>p[1]),1e-16):report.railMax;
  const x=v=>pad+(v-xmin)/(xmax-xmin)*(w-pad-10),y=v=>h-23-(v-ymin)/(ymax-ymin)*(h-35);
  ctx.strokeStyle=spectral?'#2166a2':'#a1d4fa';ctx.lineWidth=spectral?1.8:1.2;ctx.beginPath();
  points.forEach((p,i)=>{if(i===0||(!spectral&&p[0]-points[i-1][0]>1.5/report.fs))ctx.moveTo(x(p[0]),y(p[1]));else ctx.lineTo(x(p[0]),y(p[1]));});ctx.stroke();
  ctx.fillStyle=spectral?'#536779':'#bed0de';ctx.font='10px Segoe UI';ctx.fillText(fmt(ymax),3,17);ctx.fillText(fmt(ymin),3,h-22);
  for(let i=0;i<=4;i++)ctx.fillText(fmt(xmin+(xmax-xmin)*i/4),pad+(w-pad-30)*i/4,h-7);
}
function draw(){if(!report)return;plot($('trace'),rows.filter(r=>r[0]<=rows[0][0]+Math.min(.7,report.duration)));plot($('spectrum'),report.spectrum.filter(b=>b.hz<=120).map(b=>[b.hz,b.power]),{spectral:true,empty:!report.spectrum.length});}
function run(){
  try {
    const min=$('railMin').value,max=$('railMax').value;if(!min.trim()||!max.trim())throw Error('Enter both ADC rails.');
    const next=analyze(rows,{railMin:Number(min),railMax:Number(max)});report=next;$('message').hidden=true;clearAI();
    $('source-label').textContent=name;$('capture-meta').textContent=`${report.samples.toLocaleString()} samples / ${fmt(report.fs)} Hz`;
    $('metrics').replaceChildren(...[['AC RMS','E2'],['Near ADC rails','E3'],['48–52 Hz share','E4']].map(([title,id])=>{
      const e=report.evidence.find(e=>e.id===id),d=element('div',undefined,'metric');d.append(element('span',title));const n=element('strong',fmt(e.value));n.append(element('small',e.value===null?'':` ${e.unit}`));d.append(n);return d;
    }));
    $('fft-note').textContent=report.spectrum.length?'Hann-windowed FFT / relative power':'Withheld: capture conditions not met';
    $('finding-count').textContent=`${report.findings.length} finding${report.findings.length>1?'s':''}`;
    $('findings').replaceChildren(...report.findings.map(f=>{
      const d=element('article',undefined,`finding ${f.severity}`),body=element('div');d.append(element('span'),body);body.append(element('h3',f.title),element('p',f.next));
      f.evidence.forEach(id=>{const a=element('a',id,'evidence-link');a.href=`#${id}`;a.addEventListener('click',()=>{$(id).open=true;});body.append(a);});return d;
    }));
    $('evidence').replaceChildren(...report.evidence.map(e=>{const d=element('details');d.id=e.id;const s=element('summary');s.append(element('span',e.id,'ref'),element('span',e.label),element('strong',`${fmt(e.value)}${e.value===null?'':` ${e.unit}`}`));d.append(s,element('p',e.method));return d;}));
    draw();
  }catch(e){error(e.message);}
}
document.querySelectorAll('[data-demo]').forEach(b=>b.addEventListener('click',()=>{
  rows=demo(b.dataset.demo);name=`Synthetic / ${b.firstChild.textContent}`;$('railMin').value='0';$('railMax').value='3.3';$('file').value='';
  document.querySelectorAll('[data-demo]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));run();
}));
$('file').addEventListener('change',async()=>{
  const file=$('file').files[0];if(!file)return;
  try{if(file.size>2_000_000)throw Error('CSV exceeds 2 MB.');const parsed=parseCSV(await file.text());analyze(parsed,{railMin:Number($('railMin').value),railMax:Number($('railMax').value)});rows=parsed;name=`Your capture / ${file.name}`;document.querySelectorAll('[data-demo]').forEach(x=>x.setAttribute('aria-pressed','false'));run();}catch(e){error(e.message);}
});
$('analyze').addEventListener('click',run);
['railMin','railMax'].forEach(id=>$(id).addEventListener('input',()=>{clearAI();$('ai-status').textContent='ADC range changed. Recalculate before requesting an explanation.';}));
$('downloadCSV').addEventListener('click',()=>save('signalproof-capture.csv',toCSV(rows),'text/csv'));
$('export').addEventListener('click',()=>save('signalproof-report.json',JSON.stringify({...report,explanationStatus:$('ai-status').textContent},null,2),'application/json'));
$('explain').addEventListener('click',async()=>{
  if(!$('railMin').value.trim()||!$('railMax').value.trim()||Number($('railMin').value)!==report.railMin||Number($('railMax').value)!==report.railMax){error('Recalculate after changing ADC rails.');return;}
  const current=revision;const button=$('explain');button.disabled=true;$('ai-result').replaceChildren();$('ai-status').textContent='Sending samples to this server for recomputation. Only derived measurements go to Fireworks.';
  try{
    const token=$('access').value,headers={'Content-Type':'application/json'};if(token)headers.Authorization=`Bearer ${token}`;
    const response=await fetch('/api/analyze',{method:'POST',headers,signal:AbortSignal.timeout(30000),body:JSON.stringify({rows,options:{railMin:report.railMin,railMax:report.railMax},explain:true,language:$('language').value})});
    if(!response.ok){let message='AI needs the local SignalProof server. Run npm start, then open localhost:8789.';if(response.status===403)message='Enter the owner access token for this hosted server.';throw Error(message);}
    const result=await response.json();if(current!==revision)return;const e=result.explanation;
    $('ai-status').textContent=e.status==='live'?`Live response / ${e.model}`:e.message||e.status;
    if(e.status==='live'){
      $('ai-result').append(element('p',e.summary));const refs=element('p');e.evidenceIds.forEach(id=>{const a=element('a',id,'evidence-link');a.href=`#${id}`;a.addEventListener('click',()=>{$(id).open=true;});refs.append(a);});$('ai-result').append(refs,element('p',e.uncertainty,'uncertainty'),element('p',e.notice,'uncertainty'));
    }
  }catch(e){if(current===revision)$('ai-status').textContent=e.name==='TimeoutError'?'AI request timed out. Measurements remain available.':e.message;}finally{button.disabled=false;}
});
window.addEventListener('resize',draw);run();
