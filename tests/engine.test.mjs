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

test('spectrum exact power-of-two lengths (64,512,1024,4096) with correct resolution and Hann DC handling', () => {
  const fs = 250;
  for (const N of [64, 512, 1024, 4096]) {
    const values = Array.from({ length: N }, (_, i) => 1.65 + Math.sin(2 * Math.PI * 50 * i / fs));
    const r = spectrum(values, fs);
    assert.equal(r.n, N, `POT N=${N} must be used untruncated`);
    assert.equal(r.resolutionHz, fs / N, `resolution fs/N mismatch for N=${N}`);
    assert.equal(r.bins.length, N / 2 + 1, `bins length N/2+1 mismatch for N=${N}`);
    const peak = r.bins.reduce((a, b) => a.power > b.power ? a : b);
    assert.ok(Math.abs(peak.hz - 50) < r.resolutionHz, `peak ${peak.hz}Hz must be within 1 bin of 50Hz for N=${N}`);
    const dcOnly = spectrum(Array.from({ length: N }, () => 1.65), fs);
    assert.ok(dcOnly.bins[0].power < 1e-12, `DC bin should be ~0 after DC removal for N=${N}`);
  }
  const len = 100;
  const tailVals = Array.from({ length: len }, (_, i) => i < 64 ? 1.0 : 100.0);
  const rTail = spectrum(tailVals, 250);
  assert.equal(rTail.n, 64, 'len 100 must truncate to 64');
  assert.ok(rTail.bins.every(b => b.power < 1e-12), 'truncated Hann spectrum of constant tail must be ~0 power');
});

test('spectrum non-power-of-two truncation to largest POT and boundary values', () => {
  const fs = 250;
  const cases = [[100, 64], [1000, 512], [3000, 2048], [511, 256], [512, 512], [1025, 1024], [65, 64], [127, 64], [128, 128]];
  for (const [len, expectedN] of cases) {
    const values = Array.from({ length: len }, (_, i) => Math.sin(2 * Math.PI * 12 * i / fs));
    const r = spectrum(values, fs);
    assert.equal(r.n, expectedN, `len ${len} must truncate to ${expectedN}`);
    assert.equal(r.bins.length, expectedN / 2 + 1);
    assert.ok(Math.abs(r.resolutionHz - fs / expectedN) < 1e-12);
  }
  const v511 = Array.from({ length: 511 }, (_, i) => Math.sin(2 * Math.PI * 12 * i / fs));
  const v512 = Array.from({ length: 512 }, (_, i) => Math.sin(2 * Math.PI * 12 * i / fs));
  assert.equal(spectrum(v511, fs).n, 256);
  assert.equal(spectrum(v512, fs).n, 512);
  const humTail = Array.from({ length: 1000 }, (_, i) => {
    const t = i / fs;
    if (i >= 600) return 0.55 * Math.sin(2 * Math.PI * 50 * t);
    return 0.32 * Math.sin(2 * Math.PI * 12 * t);
  });
  const rHumTail = spectrum(humTail, fs);
  const totalTail = rHumTail.bins.filter(b => b.hz >= 5 && b.hz <= Math.min(200, fs / 2)).reduce((s, b) => s + b.power, 0);
  const lineTail = rHumTail.bins.filter(b => b.hz >= 48 && b.hz <= 52).reduce((s, b) => s + b.power, 0);
  const pctTail = totalTail > 1e-18 ? 100 * lineTail / totalTail : 0;
  assert.ok(pctTail < 0.1, `hum only in tail beyond N must be withheld: pct=${pctTail}`);
});

test('off-bin 49.5 Hz Hann-windowed tone captured in 48-52 Hz band against leakage', () => {
  const fs = 250;
  const n = 1000;
  const tone49_5 = Array.from({ length: n }, (_, i) => Math.sin(2 * Math.PI * 49.5 * i / fs));
  const r = spectrum(tone49_5, fs);
  assert.equal(r.n, 512);
  assert.equal(r.resolutionHz, fs / 512);
  const total = r.bins.filter(b => b.hz >= 5 && b.hz <= Math.min(200, fs / 2)).reduce((s, b) => s + b.power, 0);
  const line = r.bins.filter(b => b.hz >= 48 && b.hz <= 52).reduce((s, b) => s + b.power, 0);
  const pct = total > 1e-18 ? 100 * line / total : 0;
  assert.ok(pct >= 15, `49.5Hz off-bin pct ${pct} must be >=15%`);
  assert.ok(pct > 90, `49.5Hz off-bin pct ${pct} should be >90% with Hann`);
  const loIdx = Math.ceil(48 / r.resolutionHz);
  const hiIdx = Math.floor(52 / r.resolutionHz);
  assert.ok(loIdx === 99 || loIdx === 98, `loIdx ${loIdx} for 48Hz`);
  assert.ok(hiIdx === 106, `hiIdx ${hiIdx} for 52Hz`);
  const rows = tone49_5.map((v, i) => [i / fs, 1.65 + v]);
  const report = analyze(rows, { railMin: 0, railMax: 3.3 });
  assert.ok(report.evidence.find(e => e.id === 'E4').value !== null, '49.5Hz analyze E4 must not be withheld');
  assert.ok(report.evidence.find(e => e.id === 'E4').value >= 15, `E4 pct ${report.evidence.find(e => e.id === 'E4').value} must flag hum`);
  assert.ok(report.findings.some(f => f.id === 'hum'), '49.5Hz must trigger hum finding');
});

test('off-bin 50.5 Hz tone and out-of-band leakage control', () => {
  const fs = 250;
  const n = 1000;
  const tone50_5 = Array.from({ length: n }, (_, i) => Math.sin(2 * Math.PI * 50.5 * i / fs));
  const r = spectrum(tone50_5, fs);
  const total = r.bins.filter(b => b.hz >= 5 && b.hz <= Math.min(200, fs / 2)).reduce((s, b) => s + b.power, 0);
  const line = r.bins.filter(b => b.hz >= 48 && b.hz <= 52).reduce((s, b) => s + b.power, 0);
  const pct = total > 1e-18 ? 100 * line / total : 0;
  assert.ok(pct >= 15, `50.5Hz off-bin pct ${pct} must be >=15%`);
  assert.ok(pct > 90, `50.5Hz off-bin pct ${pct} should be >90%`);
  const tone30 = Array.from({ length: n }, (_, i) => Math.sin(2 * Math.PI * 30 * i / fs));
  const r30 = spectrum(tone30, fs);
  const total30 = r30.bins.filter(b => b.hz >= 5 && b.hz <= Math.min(200, fs / 2)).reduce((s, b) => s + b.power, 0);
  const line30 = r30.bins.filter(b => b.hz >= 48 && b.hz <= 52).reduce((s, b) => s + b.power, 0);
  const pct30 = total30 > 1e-18 ? 100 * line30 / total30 : 0;
  assert.ok(pct30 < 1, `30Hz tone pct ${pct30} must be <1%`);
  const tone10 = Array.from({ length: n }, (_, i) => Math.sin(2 * Math.PI * 10 * i / fs));
  const r10 = spectrum(tone10, fs);
  const total10 = r10.bins.filter(b => b.hz >= 5 && b.hz <= Math.min(200, fs / 2)).reduce((s, b) => s + b.power, 0);
  const line10 = r10.bins.filter(b => b.hz >= 48 && b.hz <= 52).reduce((s, b) => s + b.power, 0);
  const pct10 = total10 > 1e-18 ? 100 * line10 / total10 : 0;
  assert.ok(pct10 < 1, `10Hz tone pct ${pct10} must be <1%`);
});

test('asymmetric upper-only clipping on bipolar -2.5V to +2.5V rails', () => {
  const fs = 250;
  const n = 1000;
  const span = 5.0;
  const thrUpper = 2.5 - 0.005 * span;
  const thrLower = -2.5 + 0.005 * span;
  assert.ok(Math.abs(thrUpper - 2.475) < 1e-12);
  assert.ok(Math.abs(thrLower + 2.475) < 1e-12);
  const valsUpper = Array.from({ length: n }, (_, i) => (i < 15 ? 2.49 : 0.0));
  const rowsUpper = valsUpper.map((v, i) => [i / fs, v]);
  const rUpper = analyze(rowsUpper, { railMin: -2.5, railMax: 2.5 });
  const e3Upper = rUpper.evidence.find(e => e.id === 'E3').value;
  assert.ok(Math.abs(e3Upper - 1.5) < 1e-9, `upper-only pct ${e3Upper} must be 1.5%`);
  assert.ok(rUpper.findings.some(f => f.id === 'clipping'), 'upper-only must trigger clipping');
  assert.ok(valsUpper.filter(v => v <= thrLower).length === 0, 'upper-only must have zero lower candidates');
  const valsLower = Array.from({ length: n }, (_, i) => (i < 20 ? -2.49 : 0.0));
  const rowsLower = valsLower.map((v, i) => [i / fs, v]);
  const rLower = analyze(rowsLower, { railMin: -2.5, railMax: 2.5 });
  const e3Lower = rLower.evidence.find(e => e.id === 'E3').value;
  assert.ok(Math.abs(e3Lower - 2.0) < 1e-9, `lower-only pct ${e3Lower} must be 2%`);
  assert.ok(rLower.findings.some(f => f.id === 'clipping'), 'lower-only must trigger clipping');
  const valsBoth = Array.from({ length: n }, (_, i) => (i < 10 ? 2.49 : i < 20 ? -2.49 : 0.0));
  const rBoth = analyze(valsBoth.map((v, i) => [i / fs, v]), { railMin: -2.5, railMax: 2.5 });
  assert.ok(Math.abs(rBoth.evidence.find(e => e.id === 'E3').value - 2.0) < 1e-9);
  const valsOver = Array.from({ length: n }, (_, i) => (i < 10 ? 2.476 : 0.0));
  const rOver = analyze(valsOver.map((v, i) => [i / fs, v]), { railMin: -2.5, railMax: 2.5 });
  assert.equal(rOver.evidence.find(e => e.id === 'E3').value, 1.0, '10/1000 at 2.476 must be 1% inclusive');
  assert.ok(rOver.findings.some(f => f.id === 'clipping'));
  const valsBelow = Array.from({ length: n }, (_, i) => (i < 10 ? 2.474 : 0.0));
  const rBelow = analyze(valsBelow.map((v, i) => [i / fs, v]), { railMin: -2.5, railMax: 2.5 });
  assert.equal(rBelow.evidence.find(e => e.id === 'E3').value, 0, '2.474 below 2.475 must be 0%');
  assert.ok(!rBelow.findings.some(f => f.id === 'clipping'));
});

test('asymmetric clipping on 1.8V MCU rails and 1% boundary threshold', () => {
  const fs = 250;
  const span18 = 1.8;
  const thrUpper18 = 1.8 - 0.005 * span18;
  const thrLower18 = 0 + 0.005 * span18;
  assert.ok(Math.abs(thrUpper18 - 1.791) < 1e-12);
  assert.ok(Math.abs(thrLower18 - 0.009) < 1e-12);
  const valsUp18 = Array.from({ length: 1000 }, (_, i) => (i < 12 ? 1.795 : 0.9));
  const rUp18 = analyze(valsUp18.map((v, i) => [i / fs, v]), { railMin: 0, railMax: 1.8 });
  assert.ok(Math.abs(rUp18.evidence.find(e => e.id === 'E3').value - 1.2) < 1e-9);
  assert.ok(rUp18.findings.some(f => f.id === 'clipping'));
  const valsLow18 = Array.from({ length: 1000 }, (_, i) => (i < 12 ? 0.005 : 0.9));
  const rLow18 = analyze(valsLow18.map((v, i) => [i / fs, v]), { railMin: 0, railMax: 1.8 });
  assert.ok(Math.abs(rLow18.evidence.find(e => e.id === 'E3').value - 1.2) < 1e-9);
  assert.ok(rLow18.findings.some(f => f.id === 'clipping'));
  const vals1pct = Array.from({ length: 100 }, (_, i) => (i < 1 ? 1.795 : 0.9));
  const r1pct = analyze(vals1pct.map((v, i) => [i / fs, v]), { railMin: 0, railMax: 1.8 });
  assert.equal(r1pct.evidence.find(e => e.id === 'E3').value, 1.0);
  assert.ok(r1pct.findings.some(f => f.id === 'clipping'), '1% boundary inclusive must flag');
  assert.ok(r1pct.findings.some(f => f.id === 'spectrum-unavailable'), 'short capture also withheld');
  const vals05pct = Array.from({ length: 200 }, (_, i) => (i < 1 ? 1.795 : 0.9));
  const r05pct = analyze(vals05pct.map((v, i) => [i / fs, v]), { railMin: 0, railMax: 1.8 });
  assert.equal(r05pct.evidence.find(e => e.id === 'E3').value, 0.5);
  assert.ok(!r05pct.findings.some(f => f.id === 'clipping'), '0.5% must not flag');
  const vals64 = Array.from({ length: 64 }, (_, i) => (i < 1 ? 1.795 : 0.9));
  const r64 = analyze(vals64.map((v, i) => [i / fs, v]), { railMin: 0, railMax: 1.8 });
  assert.ok(Math.abs(r64.evidence.find(e => e.id === 'E3').value - 1.5625) < 1e-9);
  assert.ok(r64.findings.some(f => f.id === 'clipping'));
});

test('compound multi-fault: clipping + 50Hz hum + timing gap withholds spectrum strictly', () => {
  const fs = 250;
  const n = 1000;
  const rawRows = Array.from({ length: n }, (_, i) => {
    const t = i / fs;
    let v = 1.65 + 0.32 * Math.sin(2 * Math.PI * 12 * t) + 0.08 * Math.sin(2 * Math.PI * 23 * t) + 0.55 * Math.sin(2 * Math.PI * 50 * t);
    if (i < 15) v = 3.29;
    return [t, v];
  }).filter((_, i) => i < 400 || i >= 430);
  const report = analyze(rawRows, { railMin: 0, railMax: 3.3 });
  const e3 = report.evidence.find(e => e.id === 'E3').value;
  assert.ok(e3 >= 1, `compound E3 ${e3}% must be >=1%`);
  assert.ok(report.findings.some(f => f.id === 'clipping'), 'compound must have clipping');
  const e5 = report.evidence.find(e => e.id === 'E5').value;
  assert.equal(e5, 1, `compound E5 gaps ${e5} must be 1`);
  assert.ok(report.findings.some(f => f.id === 'timing'), 'compound must have timing');
  assert.ok(report.findings.some(f => f.id === 'spectrum-unavailable'), 'compound must have spectrum-unavailable');
  const e4 = report.evidence.find(e => e.id === 'E4').value;
  assert.equal(e4, null, `compound E4 must be null withheld, got ${e4}`);
  assert.equal(report.spectrum.length, 0, 'compound spectrum must be empty');
  assert.ok(!report.findings.some(f => f.id === 'hum'), 'compound must not have hum when spectrum withheld');
  assert.ok(report.duration >= 1.0, `compound duration ${report.duration} must be >=1s`);
  assert.ok(report.fs >= 120, `compound fs ${report.fs} must be >=120`);
  const fabricated = { summary: 'Fabricated hum in compound', evidenceIds: ['E4'], findingIds: ['hum'], uncertainty: 'Root cause unknown.' };
  assert.throws(() => validateExplanation(fabricated, report), /Unknown finding/);
  const valid = { summary: 'Clipping and timing gaps present; spectrum withheld.', evidenceIds: ['E3', 'E5'], findingIds: ['clipping', 'timing'], uncertainty: 'Root cause unknown; recapture required.' };
  assert.deepEqual(validateExplanation(valid, report), valid);
});

test('validator strictly rejects fabricated E4 on sub-120Hz capture', async () => {
  const sub120Rows = demo('healthy', { fs: 100, n: 1000 });
  const report = analyze(sub120Rows, { railMin: 0, railMax: 3.3 });
  assert.ok(report.fs < 120, `fs ${report.fs} must be <120`);
  assert.equal(report.evidence.find(e => e.id === 'E4').value, null);
  assert.ok(report.findings.some(f => f.id === 'spectrum-unavailable'));
  assert.ok(!report.findings.some(f => f.id === 'hum'));
  const fabricatedHum = { summary: 'Fabricated 50Hz hum', evidenceIds: ['E4'], findingIds: ['hum'], uncertainty: 'Root cause is unknown.' };
  assert.throws(() => validateExplanation(fabricatedHum, report), /Unknown finding/);
  const savedFw = process.env.FIREWORKS_API_KEY, savedBt = process.env.BASETEN_API_KEY;
  process.env.FIREWORKS_API_KEY = 'test-not-a-real-key'; delete process.env.BASETEN_API_KEY;
  try {
    await assert.rejects(() => explain(report, 'en', async () => ({
      ok: true,
      json: async () => ({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(fabricatedHum) } }], usage: { total_tokens: 99 } })
    })), /Unknown finding/);
    const handled = await handle({ rows: sub120Rows, explain: true }, {}, async () => ({
      ok: true, json: async () => ({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(fabricatedHum) } }], usage: { total_tokens: 99 } })
    }), true);
    assert.equal(handled.code, 200);
    assert.equal(handled.body.explanation.status, 'unavailable');
    assert.equal(handled.body.report.evidence.find(e => e.id === 'E4').value, null);
  } finally {
    if (savedFw === undefined) delete process.env.FIREWORKS_API_KEY; else process.env.FIREWORKS_API_KEY = savedFw;
    if (savedBt === undefined) delete process.env.BASETEN_API_KEY; else process.env.BASETEN_API_KEY = savedBt;
  }
});

test('validator strictly rejects fabricated E4 on sub-1.0s capture', async () => {
  const shortRows = demo('healthy', { fs: 250, n: 64 });
  const report = analyze(shortRows);
  assert.ok(report.duration < 1.0, `duration ${report.duration} must be <1s`);
  assert.equal(report.evidence.find(e => e.id === 'E4').value, null);
  assert.ok(report.findings.some(f => f.id === 'spectrum-unavailable'));
  const fabricated = { summary: 'Fabricated hum on short capture', evidenceIds: ['E4'], findingIds: ['hum'], uncertainty: 'Root cause unknown.' };
  assert.throws(() => validateExplanation(fabricated, report), /Unknown finding/);
  const short200 = demo('healthy', { fs: 250, n: 200 });
  const r200 = analyze(short200);
  assert.ok(r200.duration < 1.0);
  assert.equal(r200.evidence.find(e => e.id === 'E4').value, null);
  assert.throws(() => validateExplanation(fabricated, r200), /Unknown finding/);
  const validShort = { summary: 'Short capture; spectrum withheld.', evidenceIds: ['E5', 'E6'], findingIds: ['spectrum-unavailable'], uncertainty: 'Root cause unknown; need >=1s capture.' };
  assert.deepEqual(validateExplanation(validShort, report), validShort);
});


