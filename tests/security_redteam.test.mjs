import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { analyze, demo, parseCSV, toCSV, LIMIT, spectrum } from '../engine.mjs';
import { validateExplanation, handle, explain } from '../api/analyze.mjs';

function runCLI(args) {
  const r = spawnSync(process.execPath, ['cli.mjs', ...args], { encoding: 'utf8', timeout: 8000 });
  return { stdout: r.stdout || '', stderr: r.stderr || '', status: r.status };
}
function makeCSV(line) {
  const valid = Array.from({length:63}, (_,i)=> ((i+1)*0.004)+',1.65').join('\n');
  return 'time_s,value\n' + line + '\n' + valid;
}
test('CSV injection rejection - Excel formula payloads must be rejected', () => {
  const injections = ['0,=2+5','0,=SUM(A1:A10)','0,=HYPERLINK(\"http://evil.com\")','0,@SUM(A1:A10)','0,+2+3','0,-2+3'];
  for (const inj of injections) assert.throws(() => parseCSV(makeCSV(inj)), /Non-numeric|Invalid CSV/);
  for (const p of ['=2+5','@evil','+2+3']) {
    const rows = demo('healthy');
    const inj = rows.map((r,i)=> i===0 ? [r[0], p] : r);
    assert.throws(() => analyze(inj), /finite numeric/);
  }
});
test('CSV injection rejection - DDE pipe tab-quoted bypass attempts', () => {
  const more = ['0,\"=2+2\"','0,|calc.exe','0,=IMPORTXML(\"http://evil.com\")'];
  for (const inj of more) assert.throws(() => parseCSV(makeCSV(inj)), /Non-numeric|Invalid CSV/);
  assert.throws(() => parseCSV('time_s,value\n0,=2+2\n' + '0,1\n'.repeat(63)), /Non-numeric|Invalid CSV/);
  assert.ok(!toCSV(demo('healthy')).includes('=2+'));
});
test('CSV injection rejection - JSON rows injection via handle', async () => {
  const rows = [[0,'=2+5'],[0.004,1.65]];
  while(rows.length<64) rows.push([rows.length*0.004,1.65]);
  const res = await handle({rows});
  assert.equal(res.code,400);
  assert.match(res.body.error,/finite numeric|Non-numeric/i);
  assert.throws(()=> parseCSV('\uFEFFtime_s,value\n0,=HYPERLINK(\"http://evil\")\n'+'0,1\n'.repeat(63)),/Non-numeric/);
});
test('Host header spoofing - forged Host does not bypass token gate', async () => {
  const saved=process.env.SIGNALPROOF_ACCESS_TOKEN;
  process.env.SIGNALPROOF_ACCESS_TOKEN='correct-token-12345';
  try{
    for(const h of [{host:'localhost:8787'},{host:'127.0.0.1:8789'},{host:'evil.com'}]){
      const r=await handle({rows:demo(),explain:true},h);
      assert.equal(r.code,403);
      assert.match(r.body.error,/access token/i);
    }
    assert.equal((await handle({rows:demo()},{host:'evil.com'})).code,200);
    assert.equal((await handle({rows:demo(),explain:true},{authorization:'Bearer correct-token-12345'})).code,200);
    assert.equal((await handle({rows:demo(),explain:true},{authorization:'Bearer wrong-token'})).code,403);
  } finally { if(saved===undefined) delete process.env.SIGNALPROOF_ACCESS_TOKEN; else process.env.SIGNALPROOF_ACCESS_TOKEN=saved; }
});
test('Host header spoofing - origin vs host cross-origin check', async () => {
  function blocked(o,h){ if(o && o!=='http://'+h && o!=='https://'+h) return true; return false; }
  assert.equal(blocked('http://evil.com','victim.com:8789'),true);
  assert.equal(blocked('http://victim.com:8789','victim.com:8789'),false);
  assert.equal(blocked(undefined,'victim.com:8789'),false);
  assert.equal((await handle({rows:demo(),explain:true},{host:'localhost:8787',origin:'http://evil.com'})).code,403);
  assert.equal((await handle({rows:demo(),explain:true},{},async()=>({ok:false,status:500}),true)).code,200);
});
test('oversized payloads - CSV text over 2MB and JSON body over 2MB rejected', async () => {
  const huge='time_s,value\n'+'0,1\n'.repeat(600000);
  assert.ok(huge.length>2000000);
  assert.throws(()=> parseCSV(huge),/under 2 MB/);
  assert.throws(()=> analyze(demo('healthy',{n:LIMIT+1})), new RegExp(String(LIMIT)));
  const over=Array.from({length:LIMIT+1},(_,i)=>[i*0.004,1.65]);
  assert.throws(()=> analyze(over), new RegExp(String(LIMIT)));
  const big={rows:demo(),extra:'x'.repeat(2000000)};
  assert.ok(Buffer.byteLength(JSON.stringify(big))>2000000);
});
test('oversized payloads - LIMIT boundary and rail injection', () => {
  assert.doesNotThrow(()=> analyze(demo('healthy',{n:LIMIT})));
  assert.throws(()=> analyze(Array.from({length:LIMIT+1},(_,i)=>[i*0.004,1.65])));
  assert.throws(()=> analyze(demo(),{railMin:-1e7,railMax:1e7}));
  assert.throws(()=> analyze(demo(),{railMin:Number.POSITIVE_INFINITY,railMax:3.3}));
});
test('duplicate evidenceIds rejection - validator must reject duplicates', () => {
  const r=analyze(demo('hum'));
  const good={summary:'Valid hum summary.',evidenceIds:['E4'],findingIds:['hum'],uncertainty:'Root cause unknown.'};
  assert.deepEqual(validateExplanation(good,r),good);
  assert.throws(()=> validateExplanation({...good,evidenceIds:['E4','E4']},r),/Duplicate evidence/);
  assert.throws(()=> validateExplanation({...good,evidenceIds:['E1','E1','E2']},r),/Duplicate evidence/);
});
test('duplicate findingIds rejection - validator must reject duplicates', () => {
  const r=analyze(demo('hum'));
  const good={summary:'Valid',evidenceIds:['E4'],findingIds:['hum'],uncertainty:'Root cause unknown.'};
  assert.throws(()=> validateExplanation({...good,findingIds:['hum','hum']},r),/Duplicate finding/);
  const g=analyze(demo('gaps'));
  const v={summary:'Timing',evidenceIds:['E5'],findingIds:['timing'],uncertainty:'Root unknown'};
  assert.deepEqual(validateExplanation(v,g),v);
  assert.throws(()=> validateExplanation({...v,findingIds:['timing','timing']},g),/Duplicate finding/);
});
test('fabricated E4 rejection - gaps and jitter must not allow hum claim', async () => {
  const gapsReport=analyze(demo('gaps'));
  assert.equal(gapsReport.evidence.find(e=>e.id==='E4').value,null);
  const fab={summary:'Fabricated hum',evidenceIds:['E4'],findingIds:['hum'],uncertainty:'Root cause unknown.'};
  assert.throws(()=> validateExplanation(fab,gapsReport),/Unknown finding/);
  const fs=250,n=1000,step=1/fs;
  const dts=Array.from({length:n-1},(_,i)=>step*(i%3===0?0.875:i%3===1?1.0:1.125));
  const ts=[0]; for(const d of dts) ts.push(ts[ts.length-1]+d);
  const rows=ts.map(t=>[t,1.65+0.32*Math.sin(2*Math.PI*12*t)]);
  const jitterReport=analyze(rows);
  assert.equal(jitterReport.evidence.find(e=>e.id==='E4').value,null);
  assert.throws(()=> validateExplanation(fab,jitterReport),/Unknown finding/);
  const s1=process.env.FIREWORKS_API_KEY,s2=process.env.BASETEN_API_KEY;
  process.env.FIREWORKS_API_KEY='test-not-a-real-key'; delete process.env.BASETEN_API_KEY;
  try{
    await assert.rejects(()=> explain(gapsReport,'en',async()=>({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(fab)}}],usage:{total_tokens:11}})} )),/Unknown finding/);
    const h=await handle({rows:demo('gaps'),explain:true},{},async()=>({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(fab)}}],usage:{total_tokens:11}})}),true);
    assert.equal(h.code,200);
    assert.equal(h.body.explanation.status,'unavailable');
  } finally { if(s1===undefined) delete process.env.FIREWORKS_API_KEY; else process.env.FIREWORKS_API_KEY=s1; if(s2===undefined) delete process.env.BASETEN_API_KEY; else process.env.BASETEN_API_KEY=s2; }
});
test('fabricated E4 rejection - sub-120Hz and sub-1.0s captures must reject hum', async () => {
  const sub120=analyze(demo('healthy',{fs:100,n:1000}));
  assert.ok(sub120.fs<120);
  assert.equal(sub120.evidence.find(e=>e.id==='E4').value,null);
  const fab={summary:'Fabricated',evidenceIds:['E4'],findingIds:['hum'],uncertainty:'Unknown'};
  assert.throws(()=> validateExplanation(fab,sub120),/Unknown finding/);
  const short=analyze(demo('healthy',{fs:250,n:64}));
  assert.ok(short.duration<1.0);
  assert.equal(short.evidence.find(e=>e.id==='E4').value,null);
  assert.throws(()=> validateExplanation(fab,short),/Unknown finding/);
  const s1=process.env.FIREWORKS_API_KEY,s2=process.env.BASETEN_API_KEY;
  process.env.FIREWORKS_API_KEY='test-not-a-real-key'; delete process.env.BASETEN_API_KEY;
  try{
    await assert.rejects(()=> explain(sub120,'en',async()=>({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(fab)}}],usage:{total_tokens:11}})} )),/Unknown finding/);
    await assert.rejects(()=> explain(short,'en',async()=>({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(fab)}}],usage:{total_tokens:11}})} )),/Unknown finding/);
  } finally { if(s1===undefined) delete process.env.FIREWORKS_API_KEY; else process.env.FIREWORKS_API_KEY=s1; if(s2===undefined) delete process.env.BASETEN_API_KEY; else process.env.BASETEN_API_KEY=s2; }
});
test('cli.mjs --demo hum output verification - evidence ledger and spectrum', () => {
  const a=runCLI(['--demo','hum']);
  assert.equal(a.status,0);
  assert.ok(a.stdout.includes('SignalProof Bench Inspector'));
  assert.ok(a.stdout.includes('Synthetic / hum'));
  assert.ok(a.stdout.includes('hum'));
  assert.ok(a.stdout.includes('Strong energy near 50 Hz'));
  assert.ok(a.stdout.includes('E4'));
  assert.ok(a.stdout.includes('Hann-windowed'));
  assert.ok(a.stdout.includes('Spectrum (Hann-windowed'));
  assert.ok(a.stdout.includes('Peak:'));
  assert.ok(a.stdout.includes('Sparkline'));
  const j=runCLI(['--demo','hum','--json']);
  assert.equal(j.status,0);
  const p=JSON.parse(j.stdout);
  assert.equal(p.report.findings[0].id,'hum');
  assert.ok(p.report.evidence.find(e=>e.id==='E4').value>15);
  assert.ok(p.report.spectrum.length===257);
});
test('cli.mjs --demo gaps output verification - withheld spectrum', () => {
  const a=runCLI(['--demo','gaps']);
  assert.equal(a.status,0);
  assert.ok(a.stdout.includes('Synthetic / gaps'));
  assert.ok(a.stdout.includes('timing'));
  assert.ok(a.stdout.includes('spectrum-unavailable'));
  assert.ok(a.stdout.includes('Observed timing gaps'));
  assert.ok(a.stdout.match(/1\s+gaps/));
  assert.ok(a.stdout.includes('Spectrum: WITHHELD'));
  assert.ok(a.stdout.includes('E4 is null'));
  assert.ok(a.stdout.includes('Withheld-spectrum warning'));
  const j=runCLI(['--demo','gaps','--json']);
  assert.equal(j.status,0);
  const p=JSON.parse(j.stdout);
  assert.equal(p.report.evidence.find(e=>e.id==='E4').value,null);
  assert.equal(p.report.spectrum.length,0);
  assert.ok(p.report.findings.some(f=>f.id==='timing'));
  assert.ok(p.report.findings.some(f=>f.id==='spectrum-unavailable'));
});
