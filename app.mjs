import {analyze,demo,parseCSV,toCSV} from './engine.mjs';
import {compareReports} from './comparison.mjs';
const $=id=>document.getElementById(id);
let rows=demo('hum'), report, name='Synthetic / 50 Hz interference', currentKind='hum', revision=0;
let reference=null, explanation=null;
const fmt=v=>v===null?'Unavailable':Number(v).toLocaleString('en-US',{maximumFractionDigits:3});
function element(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function error(message){$('message').textContent=message;$('message').hidden=false;}
function clearAI(){revision++;explanation=null;$('ai-result').replaceChildren();$('ai-status').textContent='Not requested. Measurements work without AI.';}
function save(filename,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=element('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function renderExplanation(e) {
  explanation=e;
  $('ai-result').replaceChildren(element('p',e.summary));
  const refs=element('p');
  e.evidenceIds.forEach(id=>{const a=element('a',id,'evidence-link');a.href=`#${id}`;a.addEventListener('click',()=>{$(id).open=true;});refs.append(a);});
  $('ai-result').append(refs);
  if(e.usage?.total_tokens){
    const rTok=e.usage.completion_tokens_details?.reasoning_tokens??e.usage.output_tokens_details?.reasoning_tokens;
    const dur=e.duration_s?` · ${e.duration_s}s`:'';
    $('ai-result').append(element('p',`Telemetry: ${e.usage.total_tokens} total tokens${rTok?` (${rTok} reasoning tokens)`:''}${dur}`,'uncertainty'));
  }
  $('ai-result').append(element('p',e.uncertainty,'uncertainty'),element('p',e.notice,'uncertainty'));
}
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
function renderComparison(){
  $('comparison-result').replaceChildren();
  if(!reference){$('comparison-status').textContent='Pin a capture, then load another capture to compare the measurements.';return;}
  $('comparison-status').textContent=`Reference: ${reference.name}. Current: ${name}.`;
  try{
    const result=compareReports(reference.report,report),table=element('table'),head=element('tr');
    ['Measurement','Reference','Current','Change'].forEach(t=>head.append(element('th',t)));
    const thead=element('thead');thead.append(head);table.append(thead);
    const body=element('tbody');
    result.evidence.filter(e=>['E2','E3','E4'].includes(e.id)).forEach(e=>{
      const row=element('tr');
      const value=v=>v===null?'Unavailable':`${fmt(v)} ${e.unit}`;
      const delta=e.delta===null?'Unavailable':`${e.delta>0?'+':''}${fmt(e.delta)} ${e.unit==='%'?'percentage points':e.unit}`;
      [e.label,value(e.before),value(e.after),delta].forEach(t=>row.append(element('td',t)));body.append(row);
    });
    table.append(body);$('comparison-result').append(table,element('p',`Flags cleared: ${result.cleared.join(', ')||'none'}. Flags added: ${result.added.join(', ')||'none'}.`),element('p',result.notice,'muted'));
  }catch(e){$('comparison-result').append(element('p',e.message));}
}
function run(){
  try {
    const min=$('railMin').value,max=$('railMax').value;if(!min.trim()||!max.trim())throw Error('Enter both ADC rails.');
    const next=analyze(rows,{railMin:Number(min),railMax:Number(max)});report=next;$('message').hidden=true;clearAI();
    $('source-label').textContent=name;$('capture-meta').textContent=`${report.samples.toLocaleString()} samples / ${fmt(report.fs)} Hz`;
    $('metrics').replaceChildren(...[['AC RMS','E2'],['Near ADC rails','E3'],['48–52 Hz share','E4']].map(([title,id])=>{
      const e=report.evidence.find(e=>e.id===id),d=element('div',undefined,'metric');d.append(element('span',title));const n=element('strong',fmt(e.value));n.append(element('small',e.value===null?'':` ${e.unit}`));d.append(n);return d;
    }));
    $('fft-note').textContent=report.spectrum.length?`First ${report.spectralWindow.samples} / ${report.samples} samples · ${fmt(report.spectralWindow.binSpacingHz)} Hz bin spacing`:'Withheld: capture conditions not met';
    $('finding-count').textContent=`${report.findings.length} finding${report.findings.length>1?'s':''}`;
    $('findings').replaceChildren(...report.findings.map(f=>{
      const d=element('article',undefined,`finding ${f.severity}`),body=element('div');d.append(element('span'),body);body.append(element('h3',f.title),element('p',f.next));
      f.evidence.forEach(id=>{const a=element('a',id,'evidence-link');a.href=`#${id}`;a.addEventListener('click',()=>{$(id).open=true;});body.append(a);});return d;
    }));
    $('evidence').replaceChildren(...report.evidence.map(e=>{const d=element('details');d.id=e.id;const s=element('summary');s.append(element('span',e.id,'ref'),element('span',e.label),element('strong',`${fmt(e.value)}${e.value===null?'':` ${e.unit}`}`));d.append(s,element('p',e.method));return d;}));
    draw();renderComparison();
  }catch(e){error(e.message);}
}
document.querySelectorAll('[data-demo]').forEach(b=>b.addEventListener('click',()=>{
  currentKind=b.dataset.demo;rows=demo(currentKind);name=`Synthetic / ${b.firstChild.textContent}`;$('railMin').value='0';$('railMax').value='3.3';$('file').value='';
  document.querySelectorAll('[data-demo]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));run();
}));
$('file').addEventListener('change',async()=>{
  const file=$('file').files[0];if(!file)return;
  try{if(file.size>2_000_000)throw Error('CSV exceeds 2 MB.');const parsed=parseCSV(await file.text());analyze(parsed,{railMin:Number($('railMin').value),railMax:Number($('railMax').value)});currentKind=null;rows=parsed;name=`Your capture / ${file.name}`;document.querySelectorAll('[data-demo]').forEach(x=>x.setAttribute('aria-pressed','false'));run();}catch(e){error(e.message);}
});
$('analyze').addEventListener('click',run);
['railMin','railMax'].forEach(id=>$(id).addEventListener('input',()=>{clearAI();$('ai-status').textContent='ADC range changed. Recalculate before requesting an explanation.';}));
$('downloadCSV').addEventListener('click',()=>save('signalproof-capture.csv',toCSV(rows),'text/csv'));
$('pin-reference').addEventListener('click',()=>{reference={name,report};renderComparison();});
$('clear-reference').addEventListener('click',()=>{reference=null;renderComparison();});
$('export').addEventListener('click',()=>{
  let comparison=null;if(reference)try{comparison=compareReports(reference.report,report);}catch(e){comparison={unavailable:e.message};}
  save('signalproof-report.json',JSON.stringify({...report,exportedAt:new Date().toISOString(),source:{name,synthetic:currentKind!==null},explanation,explanationStatus:$('ai-status').textContent,reference:reference?{name:reference.name,evidence:reference.report.evidence,findings:reference.report.findings}:null,comparison},null,2),'application/json');
});
$('mode').value=location.hostname.endsWith('github.io')?'recorded':'live';
function updateMode(){clearAI();$('access-label').hidden=$('mode').value==='recorded';$('explain').textContent=$('mode').value==='recorded'?'View recorded Meta response':'Explain with Meta Muse Spark Open';}
['language','mode'].forEach(id=>$(id).addEventListener('change',updateMode));updateMode();
$('explain').addEventListener('click',async()=>{
  if(!$('railMin').value.trim()||!$('railMax').value.trim()||Number($('railMin').value)!==report.railMin||Number($('railMax').value)!==report.railMax){error('Recalculate after changing ADC rails.');return;}
  const current=revision,kind=currentKind,activeReport=report;const button=$('explain');button.disabled=true;explanation=null;$('ai-result').replaceChildren();
  try{
    const lang=$('language').value,token=$('access').value,headers={'Content-Type':'application/json'};if(token)headers.Authorization=`Bearer ${token}`;
    if($('mode').value==='recorded'){
      if(!kind||activeReport.railMin!==0||activeReport.railMax!==3.3)throw Error('Recorded responses cover built-in examples at 0–3.3 V only. Select live mode for custom captures.');
      $('ai-status').textContent='Loading the saved model response. No inference request is sent.';
      const response=await fetch('./docs/verified_live_responses.json',{cache:'no-store'});
      if(!response.ok)throw Error('Recorded response file is unavailable.');
      const rec=(await response.json())[`${kind}:${lang}`];
      if(!rec)throw Error('No recorded response for this example and language.');
      if(current!==revision)return;
      $('ai-status').textContent=`Recorded live response · ${rec.recordedAt} · ${rec.provider} / ${rec.model}. No new inference.`;
      renderExplanation(rec);return;
    }
    $('ai-status').textContent='Sending samples to this server for recomputation. Only derived measurements go to Meta Muse Spark Open.';
    const response=await fetch('/api/analyze',{method:'POST',headers,signal:AbortSignal.timeout(30000),body:JSON.stringify({rows,options:{railMin:report.railMin,railMax:report.railMax},explain:true,language:lang})});
    if(!response.ok){
      let message='Live AI needs the SignalProof server. Run npm start and open localhost:8789, or select recorded mode for built-in examples.';if(response.status===403)message='Enter the owner access token for this hosted server.';throw Error(message);
    }
    const result=await response.json();if(current!==revision)return;const e=result.explanation;
    $('ai-status').textContent=e.status==='live'?`Live response / ${e.provider||'Meta'} · ${e.model}`:e.message||e.status;
    if(e.status==='live')renderExplanation(e);
  }catch(e){if(current===revision)$('ai-status').textContent=e.name==='TimeoutError'?'AI request timed out. Measurements remain available.':e.message;}finally{button.disabled=false;}
});
window.addEventListener('resize',draw);run();
