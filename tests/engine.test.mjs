import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyze,demo,parseCSV,toCSV,spectrum,LIMIT} from '../engine.mjs';
import {validateExplanation,handle,explain,resolveProvider} from '../api/analyze.mjs';
test('healthy reference: analytic RMS and no configured flags',()=>{
  const r=analyze(demo('healthy'));
  assert.deepEqual(r.findings.map(f=>f.id),['no-flags']);
  assert.ok(Math.abs(r.evidence[1].value-Math.sqrt((.32**2+.08**2)/2))<1e-10);
  assert.ok(Math.abs(r.fs-250)<1e-9);
});
test('Hann FFT identifies a coherent 50 Hz tone',()=>{
  const values=Array.from({length:1024},(_,i)=>Math.sin(2*Math.PI*50*i/1024));
  const result=spectrum(values,1024);const peak=result.bins.reduce((a,b)=>a.power>b.power?a:b);
  assert.equal(peak.hz,50);assert.equal(result.resolutionHz,1);
});
test('50 Hz interference and clipping trigger distinct flags',()=>{
  assert.deepEqual(analyze(demo('hum')).findings.map(f=>f.id),['hum']);
  assert.ok(analyze(demo('clipping')).findings.some(f=>f.id==='clipping'));
});
test('timestamp gaps withhold spectral result rather than interpolate',()=>{
  const r=analyze(demo('gaps'));
  assert.equal(r.evidence.find(e=>e.id==='E5').value,1);
  assert.equal(r.evidence.find(e=>e.id==='E4').value,null);
  assert.equal(r.spectrum.length,0);
  assert.deepEqual(r.findings.map(f=>f.id),['timing','spectrum-unavailable']);
});
test('flat captures report undefined band share and a flat flag',()=>{
  const r=analyze(demo('flat'));assert.equal(r.evidence[3].value,null);assert.ok(r.findings.some(f=>f.id==='flat'));
});
test('CSV round trip, BOM, and strict numeric inputs',()=>{
  const rows=demo('healthy');assert.deepEqual(parseCSV('\uFEFF'+toCSV(rows)),rows);
  for(const csv of ['t,v\n0,1','time_s,value\n0,','time_s,value\n0,NaN','time_s,value\n0,Infinity'])assert.throws(()=>parseCSV(csv));
  const bad=toCSV(rows).replace('0,1.65','0,');assert.throws(()=>parseCSV(bad));
});
test('reject duplicates, non-finite numbers, out-of-range values, and bad rails',()=>{
  const rows=demo();rows[1][0]=0;assert.throws(()=>analyze(rows),/strictly increase/);
  assert.throws(()=>analyze(demo(),{railMin:3.3,railMax:0}));
  assert.throws(()=>analyze(demo(),{railMin:-1e308,railMax:1e308}));
  const nan=demo();nan[0][1]=NaN;assert.throws(()=>analyze(nan));
  const bool=demo();bool[0][1]=true;assert.throws(()=>analyze(bool));
  const over=demo();over[0][1]=100;assert.throws(()=>analyze(over),/ADC range/);
  assert.throws(()=>analyze(demo('healthy',{n:LIMIT+1})));
});
test('slow or short capture cannot support the 50 Hz test',()=>{
  assert.equal(analyze(demo('healthy',{fs:100})).evidence[3].value,null);
  assert.equal(analyze(demo('healthy',{n:64})).evidence[3].value,null);
});
test('model response requires known evidence, known findings, and uncertainty',()=>{
  const r=analyze(demo('hum'));const good={summary:'Measured band energy is elevated.',evidenceIds:['E4'],findingIds:['hum'],uncertainty:'Root cause is unknown.'};
  assert.deepEqual(validateExplanation(good,r),good);
  assert.throws(()=>validateExplanation({...good,evidenceIds:['E99']},r));
  assert.throws(()=>validateExplanation({...good,findingIds:['medical-diagnosis']},r));
  assert.throws(()=>validateExplanation({...good,uncertainty:''},r));
});
test('public credit use requires token even with a forged localhost Host header',async()=>{
  const r=await handle({rows:demo(),explain:true},{host:'localhost:8787'});
  assert.equal(r.code,403);
  assert.equal((await handle({rows:demo()})).code,200);
});
test('bad body and invalid language produce controlled validation errors',async()=>{
  assert.equal((await handle(null)).code,400);
  assert.equal((await handle({rows:demo(),language:'invalid'})).code,400);
});
test('unconfigured model is explicitly reported without a network call',async()=>{
  const savedFw=process.env.FIREWORKS_API_KEY,savedBt=process.env.BASETEN_API_KEY;
  delete process.env.FIREWORKS_API_KEY;delete process.env.BASETEN_API_KEY;
  try{assert.equal((await explain(analyze(demo()),'en',()=>{throw Error('Unexpected network');})).status,'unconfigured');}
  finally{if(savedFw!==undefined)process.env.FIREWORKS_API_KEY=savedFw;if(savedBt!==undefined)process.env.BASETEN_API_KEY=savedBt;}
});
test('mocked provider response uses measurement-only context, not raw samples',async()=>{
  const savedFw=process.env.FIREWORKS_API_KEY,savedBt=process.env.BASETEN_API_KEY;
  process.env.FIREWORKS_API_KEY='test-not-a-real-key';delete process.env.BASETEN_API_KEY;
  try{
    const report=analyze(demo('hum'));
    const result=await explain(report,'id',async(url,options)=>{
      assert.equal(url,'https://api.fireworks.ai/inference/v1/chat/completions');const body=JSON.parse(options.body);
      const context=JSON.parse(body.messages[1].content);assert.equal(context.rows,undefined);assert.equal(context.spectrum,undefined);
      assert.match(body.messages[0].content,/Indonesian/);assert.equal(body.max_tokens,4096);
      return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify({summary:'50 Hz band share is elevated. See E4.',evidenceIds:['E4'],findingIds:['hum'],uncertainty:'Root cause has not been established.'})}}],usage:{total_tokens:120}})};
    });assert.equal(result.status,'live');assert.equal(result.provider,'Fireworks');assert.equal(result.usage.total_tokens,120);
  }finally{if(savedFw===undefined)delete process.env.FIREWORKS_API_KEY;else process.env.FIREWORKS_API_KEY=savedFw;if(savedBt!==undefined)process.env.BASETEN_API_KEY=savedBt;}
});
test('Baseten provider route defaults to meta-models/muse-spark-open-1026 and strips markdown fences',async()=>{
  const savedFw=process.env.FIREWORKS_API_KEY,savedBt=process.env.BASETEN_API_KEY,savedBm=process.env.BASETEN_MODEL;
  delete process.env.FIREWORKS_API_KEY;process.env.BASETEN_API_KEY='test-baseten-key';delete process.env.BASETEN_MODEL;
  try{
    assert.equal(resolveProvider().provider,'Baseten');
    assert.equal(resolveProvider().model,'meta-models/muse-spark-open-1026');
    const report=analyze(demo('hum'));
    const result=await explain(report,'en',async(url,options)=>{
      assert.equal(url,'https://inference.baseten.co/v1/chat/completions');
      const body=JSON.parse(options.body);assert.equal(body.model,'meta-models/muse-spark-open-1026');
      return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'```json\n{"summary":"Elevated 48-52 Hz share (E4).","evidenceIds":["E4"],"findingIds":["hum"],"uncertainty":"Root cause is unknown."}\n```'}}],usage:{total_tokens:210}})};
    });
    assert.equal(result.status,'live');assert.equal(result.provider,'Baseten');assert.equal(result.model,'meta-models/muse-spark-open-1026');
  }finally{
    if(savedFw!==undefined)process.env.FIREWORKS_API_KEY=savedFw;
    if(savedBt===undefined)delete process.env.BASETEN_API_KEY;else process.env.BASETEN_API_KEY=savedBt;
    if(savedBm!==undefined)process.env.BASETEN_MODEL=savedBm;
  }
});
test('provider errors and malformed output do not replace measurements',async()=>{
  const saved=process.env.FIREWORKS_API_KEY;process.env.FIREWORKS_API_KEY='test-not-a-real-key';
  try{
    const r=await handle({rows:demo('hum'),explain:true},{},async()=>({ok:false,status:429}),true);
    assert.equal(r.code,200);assert.equal(r.body.explanation.status,'unavailable');assert.ok(r.body.report.findings.some(f=>f.id==='hum'));
    const malformed=await handle({rows:demo('hum'),explain:true},{},async()=>({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'not-json'}}]})}),true);
    assert.equal(malformed.body.explanation.status,'unavailable');assert.equal(malformed.body.explanation.message,'Model returned invalid JSON.');
  }finally{if(saved===undefined)delete process.env.FIREWORKS_API_KEY;else process.env.FIREWORKS_API_KEY=saved;}
});
test('jitter above 2% without gaps withholds spectrum and rejects fabricated E4 claim', async () => {
  const fs=250,n=1000,step=1/fs;
  const dts=Array.from({length:n-1},(_,i)=>step*(i%3===0?0.875:i%3===1?1.0:1.125));
  const ts=[0]; for(const d of dts) ts.push(ts[ts.length-1]+d);
  const rows=ts.map(t=>[t,1.65+0.32*Math.sin(2*Math.PI*12*t)+0.08*Math.sin(2*Math.PI*23*t)]);
  const median=a=>{const b=[...a].sort((x,y)=>x-y),m=b.length>>1;return b.length%2?b[m]:(b[m-1]+b[m])/2;};
  const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
  const dtsCheck=rows.slice(1).map((r,i)=>r[0]-rows[i][0]);
  const stepLocal=median(dtsCheck);
  const gapsLocal=dtsCheck.filter(d=>d>1.5*stepLocal).length;
  const jitterLocal=Math.sqrt(mean(dtsCheck.filter(d=>d<=1.5*stepLocal).map(d=>(d-stepLocal)**2)))/stepLocal;
  assert.equal(gapsLocal,0);
  assert.ok(jitterLocal>0.02, `jitter ${(jitterLocal*100).toFixed(3)}% must exceed 2%`);
  assert.ok(Math.abs(stepLocal-step)<1e-12);
  const report=analyze(rows);
  assert.equal(report.evidence.find(e=>e.id==='E5').value,0);
  assert.equal(report.evidence.find(e=>e.id==='E4').value,null);
  assert.equal(report.spectrum.length,0);
  assert.ok(report.findings.some(f=>f.id==='timing'));
  assert.ok(report.findings.some(f=>f.id==='spectrum-unavailable'));
  assert.deepEqual(report.findings.map(f=>f.id).sort(),['spectrum-unavailable','timing']);
  assert.ok(report.duration>=1);
  assert.ok(report.fs>=120);
  const valid={summary:'Timing irregular; spectrum withheld per E5/E6.',evidenceIds:['E5'],findingIds:['timing'],uncertainty:'Root cause not yet established; recapture with stable clock.'};
  assert.deepEqual(validateExplanation(valid,report),valid);
  const fabricated={summary:'Fabricated 50 Hz hum at E4.',evidenceIds:['E4'],findingIds:['hum'],uncertainty:'Root cause unknown.'};
  assert.throws(()=>validateExplanation(fabricated,report),/Unknown finding/);
  assert.throws(()=>validateExplanation({...valid,evidenceIds:['E99']},report),/Unknown evidence/);
  assert.throws(()=>validateExplanation({...valid,findingIds:['medical-diagnosis']},report),/Unknown finding/);
  const savedFw=process.env.FIREWORKS_API_KEY,savedBt=process.env.BASETEN_API_KEY,savedBm=process.env.BASETEN_MODEL;
  delete process.env.FIREWORKS_API_KEY; process.env.BASETEN_API_KEY='test-baseten-key'; delete process.env.BASETEN_MODEL;
  try{
    assert.equal(resolveProvider().provider,'Baseten');
    assert.equal(resolveProvider().model,'meta-models/muse-spark-open-1026');
    await assert.rejects(()=>explain(report,'en',async()=>({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(fabricated)}}],usage:{total_tokens:99}})})) ,/Unknown finding/);
    const live=await explain(report,'en',async(url,opts)=>{
      assert.equal(url,'https://inference.baseten.co/v1/chat/completions');
      const body=JSON.parse(opts.body); assert.equal(body.model,'meta-models/muse-spark-open-1026');
      const ctx=JSON.parse(body.messages[1].content); assert.equal(ctx.rows,undefined); assert.equal(ctx.spectrum,undefined);
      return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(valid)}}],usage:{total_tokens:101}})};
    });
    assert.equal(live.status,'live'); assert.equal(live.provider,'Baseten'); assert.equal(live.model,'meta-models/muse-spark-open-1026');
    assert.deepEqual(live.evidenceIds,['E5']); assert.deepEqual(live.findingIds,['timing']);
    const handled=await handle({rows,explain:true},{},async()=>({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(fabricated)}}],usage:{total_tokens:99}})}),true);
    assert.equal(handled.code,200); assert.equal(handled.body.explanation.status,'unavailable');
    assert.ok(handled.body.report.findings.some(f=>f.id==='timing'));
    assert.equal(handled.body.report.evidence.find(e=>e.id==='E4').value,null);
    assert.equal(handled.body.report.spectrum.length,0);
  } finally{
    if(savedFw===undefined) delete process.env.FIREWORKS_API_KEY; else process.env.FIREWORKS_API_KEY=savedFw;
    if(savedBt===undefined) delete process.env.BASETEN_API_KEY; else process.env.BASETEN_API_KEY=savedBt;
    if(savedBm===undefined) delete process.env.BASETEN_MODEL; else process.env.BASETEN_MODEL=savedBm;
  }
});

