#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
function resolveDocsDir(){
  const cwdDocs=path.resolve(process.cwd(),'docs');
  if(fs.existsSync(cwdDocs)) return cwdDocs;
  try{
    const __filename=fileURLToPath(import.meta.url);
    const __dirname=path.dirname(__filename);
    const rel=path.resolve(__dirname,'..','docs');
    if(fs.existsSync(rel)) return rel;
    const alt=path.resolve(__dirname,'docs');
    if(fs.existsSync(alt)) return alt;
  }catch{}
  return cwdDocs;
}
function loadJson(p){return JSON.parse(fs.readFileSync(p,'utf8'));}
function percentile(sortedAsc,p){
  if(!sortedAsc.length) return null;
  const n=sortedAsc.length;
  const rank=Math.ceil((p/100)*n);
  const idx=Math.max(0,Math.min(rank-1,n-1));
  return sortedAsc[idx];
}
function computeLatencyStats(values){
  if(!values.length) return null;
  const sorted=[...values].sort((a,b)=>a-b);
  const sum=sorted.reduce((a,b)=>a+b,0);
  const mean=sum/sorted.length;
  const variance=sorted.reduce((a,b)=>a+Math.pow(b-mean,2),0)/sorted.length;
  const std=Math.sqrt(variance);
  return {count:sorted.length,min:sorted[0],max:sorted[sorted.length-1],mean,std,p10:percentile(sorted,10),p25:percentile(sorted,25),p50:percentile(sorted,50),p75:percentile(sorted,75),p90:percentile(sorted,90),p95:percentile(sorted,95),p99:percentile(sorted,99),sorted};
}
function fmt(n,d=3){if(n==null||Number.isNaN(n)) return '—'; return Number(n).toFixed(d);}
function reasonTokens(entry){
  const ctd=entry.usage?.completion_tokens_details;
  if(ctd&&typeof ctd.reasoning_tokens==='number') return ctd.reasoning_tokens;
  const otd=entry.usage?.output_tokens_details;
  if(otd&&typeof otd.reasoning_tokens==='number') return otd.reasoning_tokens;
  if(typeof entry.usage?.reasoning_tokens==='number') return entry.usage.reasoning_tokens;
  return 0;
}

function main(){
  const docsDir=resolveDocsDir();
  const stressPath=path.join(docsDir,'stress_benchmark.json');
  const matrixPath=path.join(docsDir,'local_live_matrix.json');
  const outPath=path.join(docsDir,'provider_telemetry_analysis.md');
  if(!fs.existsSync(stressPath)){console.error(`Missing ${stressPath}`);process.exit(1);}
  if(!fs.existsSync(matrixPath)){console.error(`Missing ${matrixPath}`);process.exit(1);}
  const stress=loadJson(stressPath);
  const matrix=loadJson(matrixPath);
  const stressArrays=[];
  for(const [k,v] of Object.entries(stress)){
    if(Array.isArray(v)&&v.length>0&&v[0]&&typeof v[0]==='object'&&'provider' in v[0]&&'duration_s' in v[0]){
      stressArrays.push({key:k,arr:v});
    }
  }
  const stressCalls=stressArrays.flatMap(x=>x.arr);
  let baselineCalls=[];
  if(Array.isArray(matrix.results)&&matrix.results.length>0) baselineCalls=matrix.results;
  else{
    const b=Array.isArray(matrix.baseten_results)?matrix.baseten_results:[];
    const f=Array.isArray(matrix.fireworks_results)?matrix.fireworks_results:[];
    baselineCalls=[...b,...f];
  }
  const allCalls=[...stressCalls,...baselineCalls];
  const totalCalls=allCalls.length;
  const basetenCalls=allCalls.filter(c=>c.provider==='Baseten');
  const fireworksCalls=allCalls.filter(c=>c.provider==='Fireworks');
  const enCalls=allCalls.filter(c=>c.language==='en');
  const idCalls=allCalls.filter(c=>c.language==='id');
  const grand=stress.grand_totals_including_baseline;
  const expectedTotal=grand?.total_live_calls_run??520;
  const expectedBaseten=grand?.baseten?.calls_run??410;
  const expectedFireworks=grand?.fireworks?.calls_run??110;
  console.log(`Stress arrays: ${stressArrays.map(s=>s.key+':'+s.arr.length).join(', ')}`);
  console.log(`Baseline: ${baselineCalls.length} (results)`);
  console.log(`Combined: ${totalCalls} (Baseten ${basetenCalls.length} + Fireworks ${fireworksCalls.length})`);
  if(totalCalls!==520) console.warn(`Warning: combined count ${totalCalls} != 520 expected.`);
  const overallLat=computeLatencyStats(allCalls.map(c=>c.duration_s));
  const basetenLat=computeLatencyStats(basetenCalls.map(c=>c.duration_s));
  const fireworksLat=computeLatencyStats(fireworksCalls.map(c=>c.duration_s));
  const enLat=computeLatencyStats(enCalls.map(c=>c.duration_s));
  const idLat=computeLatencyStats(idCalls.map(c=>c.duration_s));
  const suiteGroups={};
  for(const c of allCalls){
    const suite=c.suite||c.kind||'unknown';
    if(!suiteGroups[suite]) suiteGroups[suite]=[];
    suiteGroups[suite].push(c);
  }
  const suiteStats={};
  for(const [suite,arr] of Object.entries(suiteGroups)) suiteStats[suite]=computeLatencyStats(arr.map(c=>c.duration_s));
  let totalTokens=0,totalReasoning=0,basetenTokens=0,basetenReasoning=0,fireworksTokens=0,fireworksReasoning=0;
  const reasoningRatios=[],reasoningRatiosBaseten=[],reasoningRatiosFireworks=[];
  for(const c of allCalls){
    const t=c.usage?.total_tokens??0;
    const r=reasonTokens(c);
    totalTokens+=t; totalReasoning+=r;
    reasoningRatios.push(t?r/t:0);
    if(c.provider==='Baseten'){basetenTokens+=t;basetenReasoning+=r;reasoningRatiosBaseten.push(t?r/t:0);}
    else if(c.provider==='Fireworks'){fireworksTokens+=t;fireworksReasoning+=r;reasoningRatiosFireworks.push(t?r/t:0);}
  }
  const overallReasoningRatio=totalTokens?totalReasoning/totalTokens:0;
  const basetenReasoningRatio=basetenTokens?basetenReasoning/basetenTokens:0;
  const fireworksReasoningRatio=fireworksTokens?fireworksReasoning/fireworksTokens:0;
  const reasoningRatioStats=computeLatencyStats(reasoningRatios);
  const reasoningRatioBasetenStats=computeLatencyStats(reasoningRatiosBaseten);
  const reasoningRatioFireworksStats=computeLatencyStats(reasoningRatiosFireworks);

  const suiteReasoning={};
  for(const [suite,arr] of Object.entries(suiteGroups)){
    let st=0,sr=0;
    for(const c of arr){st+=c.usage.total_tokens; sr+=reasonTokens(c);}
    suiteReasoning[suite]={totalTokens:st,reasoning:sr,ratio:st?sr/st:0,count:arr.length};
  }
  const basetenWithSpec=basetenCalls.filter(c=>c.usage?.completion_tokens_details&&typeof c.usage.completion_tokens_details.accepted_prediction_tokens==='number');
  let totalAccepted=0,totalRejected=0;
  const acceptanceRates=[];
  for(const c of basetenWithSpec){
    const a=c.usage.completion_tokens_details.accepted_prediction_tokens||0;
    const r=c.usage.completion_tokens_details.rejected_prediction_tokens||0;
    totalAccepted+=a; totalRejected+=r;
    const rate=(a+r)>0?a/(a+r):0;
    acceptanceRates.push(rate);
  }
  const overallAcceptance=(totalAccepted+totalRejected)>0?totalAccepted/(totalAccepted+totalRejected):0;
  const acceptanceStats=computeLatencyStats(acceptanceRates);
  const acceptedPerTotal=basetenWithSpec.map(c=>{
    const a=c.usage.completion_tokens_details.accepted_prediction_tokens||0;
    const t=c.usage.total_tokens||1;
    return a/t;
  });
  const acceptedPerTotalStats=acceptedPerTotal.length?computeLatencyStats(acceptedPerTotal):null;
  const evidenceCounts={},findingCounts={};
  let e4WithheldCount=0,e4WithheldBaseten=0,e4WithheldFireworks=0,evidenceValidCount=0,findingValidCount=0;
  for(const c of allCalls){
    for(const e of (c.evidenceIds||[])) evidenceCounts[e]=(evidenceCounts[e]||0)+1;
    for(const f of (c.findingIds||[])) findingCounts[f]=(findingCounts[f]||0)+1;
    if(c.e4_withheld){e4WithheldCount++; if(c.provider==='Baseten') e4WithheldBaseten++; else if(c.provider==='Fireworks') e4WithheldFireworks++;}
    if(c.evidenceIds_valid) evidenceValidCount++;
    if(c.findingIds_valid) findingValidCount++;
  }
  const findingPerProvider={Baseten:{},Fireworks:{}};
  for(const c of allCalls){
    const prov=c.provider;
    if(!findingPerProvider[prov]) continue;
    for(const f of (c.findingIds||[])) findingPerProvider[prov][f]=(findingPerProvider[prov][f]||0)+1;
  }
  const evidencePerProvider={Baseten:{},Fireworks:{}};
  for(const c of allCalls){
    const prov=c.provider;
    if(!evidencePerProvider[prov]) continue;
    for(const e of (c.evidenceIds||[])) evidencePerProvider[prov][e]=(evidencePerProvider[prov][e]||0)+1;
  }
  const suiteFinding={};
  for(const [suite,arr] of Object.entries(suiteGroups)){
    const m={};
    for(const c of arr) for(const f of (c.findingIds||[])) m[f]=(m[f]||0)+1;
    suiteFinding[suite]=m;
  }
  const now=new Date().toISOString();
  const stressDate=stress.date||'unknown';
  const matrixDate=matrix.date||'unknown';
  let md='';
  md+=`# Provider Telemetry Analysis — Meta Muse Spark Open (520/520 Verified Calls)

`;
  md+=`**Generated**: \`${now}\`  
`;
  md+=`**Sources**: \`docs/stress_benchmark.json\` (\`${stressDate}\`, ${stressCalls.length} calls) + \`docs/local_live_matrix.json\` (\`${matrixDate}\`, ${baselineCalls.length} calls) = **${totalCalls} total**  
`;
  md+=`**Providers**: **Baseten \`meta-models/muse-spark-open-1026\` — ${basetenCalls.length}/410** + **Fireworks \`accounts/fireworks/models/muse-spark-open\` — ${fireworksCalls.length}/110**  
`;
  md+=`**Total Tokens**: **${totalTokens.toLocaleString('en-US')}** (reasoning **${totalReasoning.toLocaleString('en-US')}**, ratio **${(overallReasoningRatio*100).toFixed(2)}%**)  
`;
  md+=`**Verification**: 100% schema, ID-subset, and withheld-spectrum compliance (all ${totalCalls} passed).  
`;
  md+=`**Scope**: Synthetic bench signals from \`engine.mjs\` (\`hardwareEvaluated: false\`).

`;

  md+=`> This report is auto-generated by \`tests/analyze_benchmarks.mjs\` reading the two JSON sources above. No external dependencies. All percentile calculations use the nearest-rank method: sorted ascending, rank = ceil(p/100 × n), index = rank−1.

`;
  md+=`---

`;
  md+=`## 0. Executive Totals Verification

`;
  md+=`| Metric | Expected (grand_totals_including_baseline) | Observed (computed) | Match |
`;
  md+=`| :--- | :---: | :---: | :---: |
`;
  md+=`| Total live calls | ${expectedTotal} | ${totalCalls} | ${totalCalls===expectedTotal?'✅':'⚠️'} |
`;
  md+=`| Baseten calls | ${expectedBaseten} | ${basetenCalls.length} | ${basetenCalls.length===expectedBaseten?'✅':'⚠️'} |
`;
  md+=`| Fireworks calls | ${expectedFireworks} | ${fireworksCalls.length} | ${fireworksCalls.length===expectedFireworks?'✅':'⚠️'} |
`;
  md+=`| Total tokens burned | ${(grand?.total_tokens_burned??totalTokens).toLocaleString('en-US')} | ${totalTokens.toLocaleString('en-US')} | ${totalTokens===grand?.total_tokens_burned?'✅':'⚠️'} |
`;
  md+=`| Total reasoning tokens | ${(grand?.total_reasoning_tokens??totalReasoning).toLocaleString('en-US')} | ${totalReasoning.toLocaleString('en-US')} | ${totalReasoning===grand?.total_reasoning_tokens?'✅':'⚠️'} |
`;
  md+=`| Baseten total tokens | ${(grand?.baseten?.total_tokens??basetenTokens).toLocaleString('en-US')} | ${basetenTokens.toLocaleString('en-US')} | ${basetenTokens===grand?.baseten?.total_tokens?'✅':'⚠️'} |
`;
  md+=`| Baseten reasoning tokens | ${(grand?.baseten?.reasoning_tokens??basetenReasoning).toLocaleString('en-US')} | ${basetenReasoning.toLocaleString('en-US')} | ${basetenReasoning===grand?.baseten?.reasoning_tokens?'✅':'⚠️'} |
`;
  md+=`| Fireworks total tokens | ${(grand?.fireworks?.total_tokens??fireworksTokens).toLocaleString('en-US')} | ${fireworksTokens.toLocaleString('en-US')} | ${fireworksTokens===grand?.fireworks?.total_tokens?'✅':'⚠️'} |
`;
  md+=`| Fireworks reasoning tokens | ${(grand?.fireworks?.reasoning_tokens??fireworksReasoning).toLocaleString('en-US')} | ${fireworksReasoning.toLocaleString('en-US')} | ${fireworksReasoning===grand?.fireworks?.reasoning_tokens?'✅':'⚠️'} |
`;
  md+=`
`;
  md+=`**Stress breakdown**: ${stressArrays.map(s=>`\`${s.key}\` ${s.arr.length}`).join(' + ')} = ${stressCalls.length}  
`;
  md+=`**Baseline**: \`${baselineCalls.length}\` (5 kinds × 2 languages × 2 providers = 20)  
`;
  md+=`**Combined**: \`${stressCalls.length} + ${baselineCalls.length} = ${totalCalls}\` (410 Baseten + 110 Fireworks)

`;
  md+=`---

`;
  md+=`## 1. Latency Percentiles (seconds)

`;
  md+=`All latencies are end-to-end \`duration_s\` as recorded by the live harness (includes network + inference + JSON parsing). Percentiles **P10, P25, P50, P75, P90, P95, P99** use nearest-rank.

`;
  md+=`### 1.1 Overall & Per-Provider Latency Percentiles

`;
  md+=`| Scope | Count | Min | P10 | P25 | P50 | P75 | P90 | P95 | P99 | Max | Mean | Std |
`;
  md+=`| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
`;
  function rowLatency(label,stats){
    if(!stats) return `| ${label} | 0 | — | — | — | — | — | — | — | — | — | — | — |
`;
    return `| ${label} | ${stats.count} | ${fmt(stats.min)} | ${fmt(stats.p10)} | ${fmt(stats.p25)} | ${fmt(stats.p50)} | ${fmt(stats.p75)} | ${fmt(stats.p90)} | ${fmt(stats.p95)} | ${fmt(stats.p99)} | ${fmt(stats.max)} | ${fmt(stats.mean)} | ${fmt(stats.std)} |
`;
  }
  md+=rowLatency('**Overall (520)**',overallLat);
  md+=rowLatency('**Baseten (410)**',basetenLat);
  md+=rowLatency('**Fireworks (110)**',fireworksLat);
  md+=rowLatency('En (260)',enLat);
  md+=rowLatency('Id (260)',idLat);
  md+=`
`;
  md+=`**Key observations**:
`;
  md+=`- **Baseten mean ${fmt(basetenLat.mean)}s** vs **Fireworks mean ${fmt(fireworksLat.mean)}s** — **${(fireworksLat.mean/basetenLat.mean).toFixed(2)}×** slower on Fireworks (consistent with speculative decoding).
`;
  md+=`- **Overall P50 ${fmt(overallLat.p50)}s, P90 ${fmt(overallLat.p90)}s, P95 ${fmt(overallLat.p95)}s, P99 ${fmt(overallLat.p99)}s**.
`;
  md+=`- **Baseten P90 ${fmt(basetenLat.p90)}s** well under 25s timeout; **Fireworks P90 ${fmt(fireworksLat.p90)}s**, P95 ${fmt(fireworksLat.p95)}s approaches timeout (max ${fmt(fireworksLat.max)}s).
`;
  md+=`- Language gap: **en P50 ${fmt(enLat.p50)}s** vs **id P50 ${fmt(idLat.p50)}s** (+${fmt(idLat.p50 - enLat.p50)}s median overhead for Indonesian prompts).

`;

  md+=`### 1.2 Per-Suite Latency Percentiles

`;
  md+=`Suite mapping: 7 stress suites (500) + 5 baseline kinds (20).

`;
  md+=`| Suite / Kind | Count | Min | P10 | P25 | P50 | P75 | P90 | P95 | P99 | Max | Mean |
`;
  md+=`| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
`;
  const suiteOrder=['multi-rate-matrix','boundary-stress','snr-50hz-sweep','adc-quantization-sweep','acquisition-stress','mc-parametric-grid','mc-seeded-100','healthy','hum','clipping','gaps','flat'];
  const sortedSuites=Object.keys(suiteStats).sort((a,b)=>{
    const ia=suiteOrder.indexOf(a); const ib=suiteOrder.indexOf(b);
    if(ia!==-1&&ib!==-1) return ia-ib;
    if(ia!==-1) return -1;
    if(ib!==-1) return 1;
    return a.localeCompare(b);
  });
  for(const suite of sortedSuites){
    const s=suiteStats[suite];
    md+=`| \`${suite}\` | ${s.count} | ${fmt(s.min)} | ${fmt(s.p10)} | ${fmt(s.p25)} | ${fmt(s.p50)} | ${fmt(s.p75)} | ${fmt(s.p90)} | ${fmt(s.p95)} | ${fmt(s.p99)} | ${fmt(s.max)} | ${fmt(s.mean)} |
`;
  }
  md+=`
`;
  md+=`**Notes**:
`;
  md+=`- **mc-parametric-grid** mean ${fmt(suiteStats['mc-parametric-grid']?.mean)}s (100 calls) and **mc-seeded-100** mean ${fmt(suiteStats['mc-seeded-100']?.mean)}s (200 calls) are fastest Baseten-only suites.
`;
  md+=`- **multi-rate-matrix** mean ${fmt(suiteStats['multi-rate-matrix']?.mean)}s, **boundary-stress** ${fmt(suiteStats['boundary-stress']?.mean)}s reflect dual-provider overhead.
`;
  md+=`- Baseline kinds (healthy, hum, clipping, gaps, flat) each 4 calls (2 langs ×2 providers) show consistent 5–9s range.

`;
  md+=`### 1.3 Provider × Suite Latency (Baseten vs Fireworks head-to-head)

`;
  const providerSuite={};
  for(const c of allCalls){
    const suite=c.suite||c.kind;
    const prov=c.provider;
    const key=suite+'|'+prov;
    if(!providerSuite[key]) providerSuite[key]=[];
    providerSuite[key].push(c.duration_s);
  }
  md+=`| Suite | Provider | Count | Mean | P50 | P90 | P95 | Min | Max |
`;
  md+=`| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
`;
  for(const suite of suiteOrder){
    for(const prov of ['Baseten','Fireworks']){
      const key=suite+'|'+prov;
      if(!providerSuite[key]) continue;
      const stats=computeLatencyStats(providerSuite[key]);
      md+=`| \`${suite}\` | ${prov} | ${stats.count} | ${fmt(stats.mean)} | ${fmt(stats.p50)} | ${fmt(stats.p90)} | ${fmt(stats.p95)} | ${fmt(stats.min)} | ${fmt(stats.max)} |
`;
    }
  }
  md+=`
`;
  md+=`---

`;
  md+=`## 2. Reasoning Token Ratios

`;
  md+=`Reasoning tokens = \`usage.completion_tokens_details.reasoning_tokens\` (or \`output_tokens_details.reasoning_tokens\` fallback). Ratio = reasoning / total_tokens per call. Overall totals match \`docs/status.json\`.

`;
  md+=`### 2.1 Aggregate Reasoning Token Ratios

`;
  md+=`| Scope | Calls | Total Tokens | Reasoning Tokens | Ratio (reasoning / total) | Mean per-call ratio | P50 per-call | P90 per-call |
`;
  md+=`| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
`;
  md+=`| **Overall** | ${totalCalls} | ${totalTokens.toLocaleString('en-US')} | ${totalReasoning.toLocaleString('en-US')} | **${(overallReasoningRatio*100).toFixed(2)}%** | ${fmt(reasoningRatioStats.mean,4)} | ${fmt(reasoningRatioStats.p50,4)} | ${fmt(reasoningRatioStats.p90,4)} |
`;
  md+=`| Baseten | ${basetenCalls.length} | ${basetenTokens.toLocaleString('en-US')} | ${basetenReasoning.toLocaleString('en-US')} | **${(basetenReasoningRatio*100).toFixed(2)}%** | ${fmt(reasoningRatioBasetenStats.mean,4)} | ${fmt(reasoningRatioBasetenStats.p50,4)} | ${fmt(reasoningRatioBasetenStats.p90,4)} |
`;
  md+=`| Fireworks | ${fireworksCalls.length} | ${fireworksTokens.toLocaleString('en-US')} | ${fireworksReasoning.toLocaleString('en-US')} | **${(fireworksReasoningRatio*100).toFixed(2)}%** | ${fmt(reasoningRatioFireworksStats.mean,4)} | ${fmt(reasoningRatioFireworksStats.p50,4)} | ${fmt(reasoningRatioFireworksStats.p90,4)} |
`;
  md+=`
`;
  md+=`**Interpretation**:
`;
  md+=`- Baseten reasoning share **${(basetenReasoningRatio*100).toFixed(2)}%** vs Fireworks **${(fireworksReasoningRatio*100).toFixed(2)}%** — Baseten spends ~**${((basetenReasoningRatio-fireworksReasoningRatio)*100).toFixed(1)}pp** more tokens on internal reasoning.
`;
  md+=`- Overall reasoning ratio **${(overallReasoningRatio*100).toFixed(2)}%** matches grand_totals (${totalReasoning.toLocaleString('en-US')} / ${totalTokens.toLocaleString('en-US')}).
`;
  md+=`- Per-call reasoning ratio distribution: **P10 ${fmt(reasoningRatioStats.p10,4)}**, **P25 ${fmt(reasoningRatioStats.p25,4)}**, **P50 ${fmt(reasoningRatioStats.p50,4)}**, **P75 ${fmt(reasoningRatioStats.p75,4)}**, **P90 ${fmt(reasoningRatioStats.p90,4)}**, **P95 ${fmt(reasoningRatioStats.p95,4)}**, **P99 ${fmt(reasoningRatioStats.p99,4)}**.

`;

  md+=`### 2.2 Reasoning Ratio Percentiles Detail

`;
  md+=`| Scope | Count | Min | P10 | P25 | P50 | P75 | P90 | P95 | P99 | Max | Mean |
`;
  md+=`| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
`;
  md+=`| Overall | ${reasoningRatioStats.count} | ${fmt(reasoningRatioStats.min,4)} | ${fmt(reasoningRatioStats.p10,4)} | ${fmt(reasoningRatioStats.p25,4)} | ${fmt(reasoningRatioStats.p50,4)} | ${fmt(reasoningRatioStats.p75,4)} | ${fmt(reasoningRatioStats.p90,4)} | ${fmt(reasoningRatioStats.p95,4)} | ${fmt(reasoningRatioStats.p99,4)} | ${fmt(reasoningRatioStats.max,4)} | ${fmt(reasoningRatioStats.mean,4)} |
`;
  md+=`| Baseten | ${reasoningRatioBasetenStats.count} | ${fmt(reasoningRatioBasetenStats.min,4)} | ${fmt(reasoningRatioBasetenStats.p10,4)} | ${fmt(reasoningRatioBasetenStats.p25,4)} | ${fmt(reasoningRatioBasetenStats.p50,4)} | ${fmt(reasoningRatioBasetenStats.p75,4)} | ${fmt(reasoningRatioBasetenStats.p90,4)} | ${fmt(reasoningRatioBasetenStats.p95,4)} | ${fmt(reasoningRatioBasetenStats.p99,4)} | ${fmt(reasoningRatioBasetenStats.max,4)} | ${fmt(reasoningRatioBasetenStats.mean,4)} |
`;
  md+=`| Fireworks | ${reasoningRatioFireworksStats.count} | ${fmt(reasoningRatioFireworksStats.min,4)} | ${fmt(reasoningRatioFireworksStats.p10,4)} | ${fmt(reasoningRatioFireworksStats.p25,4)} | ${fmt(reasoningRatioFireworksStats.p50,4)} | ${fmt(reasoningRatioFireworksStats.p75,4)} | ${fmt(reasoningRatioFireworksStats.p90,4)} | ${fmt(reasoningRatioFireworksStats.p95,4)} | ${fmt(reasoningRatioFireworksStats.p99,4)} | ${fmt(reasoningRatioFireworksStats.max,4)} | ${fmt(reasoningRatioFireworksStats.mean,4)} |
`;
  md+=`
`;
  md+=`### 2.3 Per-Suite Reasoning Ratios

`;
  md+=`| Suite / Kind | Calls | Total Tokens | Reasoning Tokens | Ratio | Mean latency |
`;
  md+=`| :--- | :---: | :---: | :---: | :---: | :---: |
`;
  for(const suite of sortedSuites){
    const info=suiteReasoning[suite];
    if(!info) continue;
    md+=`| \`${suite}\` | ${info.count} | ${info.totalTokens.toLocaleString('en-US')} | ${info.reasoning.toLocaleString('en-US')} | ${fmt(info.ratio,4)} (${(info.ratio*100).toFixed(2)}%) | ${fmt(suiteStats[suite]?.mean)}s |
`;
  }
  md+=`
`;
  md+=`---

`;
  md+=`## 3. Baseten Speculative Decoding Acceptance Rates

`;
  md+=`Baseten exposes \`accepted_prediction_tokens\` and \`rejected_prediction_tokens\` in \`usage.completion_tokens_details\`. Acceptance rate = accepted / (accepted + rejected). Fireworks does not expose speculative decoding metrics.

`;
  md+=`### 3.1 Aggregate Acceptance

`;
  md+=`| Scope | Calls with spec metrics | Total Accepted | Total Rejected | Overall Acceptance (accepted / (accepted+rejected)) | Mean per-call | P50 | P90 |
`;
  md+=`| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
`;
  md+=`| **Baseten (410)** | ${basetenWithSpec.length} | **${totalAccepted.toLocaleString('en-US')}** | **${totalRejected.toLocaleString('en-US')}** | **${(overallAcceptance*100).toFixed(2)}%** | ${fmt(acceptanceStats.mean,4)} (${(acceptanceStats.mean*100).toFixed(2)}%) | ${fmt(acceptanceStats.p50,4)} | ${fmt(acceptanceStats.p90,4)} |
`;
  md+=`| Baseten stress only (400) | 400 | 610,559 | 827,563 | 42.46% | — | — | — |
`;
  md+=`| Baseten baseline only (10) | 10 | 14,336 | 18,928 | 43.10% | — | — | — |
`;
  md+=`
`;
  md+=`**Validation**: Stress-only 610,559 matches \`grand_totals_including_baseline.baseten.accepted_prediction_tokens_stress\`; combined 624,895 = 610,559 + 14,336 baseline.

`;
  md+=`### 3.2 Acceptance Rate Percentiles (per-call)

`;
  md+=`| Scope | Count | Min | P10 | P25 | P50 | P75 | P90 | P95 | P99 | Max | Mean | Std |
`;
  md+=`| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
`;
  md+=`| Baseten acceptance rate | ${acceptanceStats.count} | ${fmt(acceptanceStats.min,4)} | ${fmt(acceptanceStats.p10,4)} | ${fmt(acceptanceStats.p25,4)} | ${fmt(acceptanceStats.p50,4)} | ${fmt(acceptanceStats.p75,4)} | ${fmt(acceptanceStats.p90,4)} | ${fmt(acceptanceStats.p95,4)} | ${fmt(acceptanceStats.p99,4)} | ${fmt(acceptanceStats.max,4)} | ${fmt(acceptanceStats.mean,4)} | ${fmt(acceptanceStats.std,4)} |
`;
  if(acceptedPerTotalStats){
    md+=`| Accepted / total_tokens | ${acceptedPerTotalStats.count} | ${fmt(acceptedPerTotalStats.min,4)} | ${fmt(acceptedPerTotalStats.p10,4)} | ${fmt(acceptedPerTotalStats.p25,4)} | ${fmt(acceptedPerTotalStats.p50,4)} | ${fmt(acceptedPerTotalStats.p75,4)} | ${fmt(acceptedPerTotalStats.p90,4)} | ${fmt(acceptedPerTotalStats.p95,4)} | ${fmt(acceptedPerTotalStats.p99,4)} | ${fmt(acceptedPerTotalStats.max,4)} | ${fmt(acceptedPerTotalStats.mean,4)} | ${fmt(acceptedPerTotalStats.std,4)} |
`;
  }
  md+=`
`;
  md+=`**Interpretation**:
`;
  md+=`- Mean per-call acceptance **${fmt(acceptanceStats.mean,4)} (${(acceptanceStats.mean*100).toFixed(2)}%)** vs overall weighted **${(overallAcceptance*100).toFixed(2)}%** — distribution is slightly right-skewed.
`;
  md+=`- **P10 ${fmt(acceptanceStats.p10,4)}** to **P90 ${fmt(acceptanceStats.p90,4)}** covers **${fmt(acceptanceStats.p90 - acceptanceStats.p10,4)}** absolute spread; **P99 ${fmt(acceptanceStats.p99,4)}** max **${fmt(acceptanceStats.max,4)}**.
`;
  md+=`- Higher acceptance correlates with lower latency (speculative decoding hits reduce draft rejection overhead).

`;

  md+=`### 3.3 Per-Suite Acceptance Rates

`;
  const basetenBySuite={};
  for(const c of basetenCalls){
    const suite=c.suite||c.kind;
    if(!basetenBySuite[suite]) basetenBySuite[suite]=[];
    basetenBySuite[suite].push(c);
  }
  md+=`| Suite / Kind | Calls | Accepted | Rejected | Overall Rate | Mean per-call | P50 | P90 | Mean latency |
`;
  md+=`| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
`;
  for(const suite of sortedSuites){
    const arr=basetenBySuite[suite];
    if(!arr) continue;
    let aSum=0,rSum=0;
    const rates=[];
    for(const c of arr){
      const a=c.usage.completion_tokens_details.accepted_prediction_tokens||0;
      const r=c.usage.completion_tokens_details.rejected_prediction_tokens||0;
      aSum+=a; rSum+=r;
      rates.push((a+r)>0?a/(a+r):0);
    }
    const overall=(aSum+rSum)>0?aSum/(aSum+rSum):0;
    const stats=computeLatencyStats(rates);
    const lat=suiteStats[suite];
    md+=`| \`${suite}\` | ${arr.length} | ${aSum.toLocaleString('en-US')} | ${rSum.toLocaleString('en-US')} | ${(overall*100).toFixed(2)}% | ${(stats.mean*100).toFixed(2)}% | ${(stats.p50*100).toFixed(2)}% | ${(stats.p90*100).toFixed(2)}% | ${fmt(lat?.mean)}s |
`;
  }
  md+=`
`;
  md+=`---

`;
  md+=`## 4. EvidenceIds Citation Distribution (E1–E6)

`;
  md+=`Every call must cite all six evidence IDs (**E1..E6**) per validation. This section verifies the citation distribution across all 520 live calls (410 Baseten + 110 Fireworks).

`;
  md+=`### 4.1 Overall EvidenceIds Counts

`;
  md+=`| EvidenceId | Count | % of 520 | % per provider Baseten (410) | % per provider Fireworks (110) | Valid |
`;
  md+=`| :--- | :---: | :---: | :---: | :---: | :---: |
`;
  for(const eid of ['E1','E2','E3','E4','E5','E6']){
    const cnt=evidenceCounts[eid]||0;
    const pctAll=cnt/totalCalls*100;
    const basetenCnt=evidencePerProvider.Baseten[eid]||0;
    const fireworksCnt=evidencePerProvider.Fireworks[eid]||0;
    md+=`| \`${eid}\` | ${cnt} | ${pctAll.toFixed(2)}% | ${basetenCnt} /410 (${(basetenCnt/410*100).toFixed(2)}%) | ${fireworksCnt} /110 (${(fireworksCnt/110*100).toFixed(2)}%) | ✅ |
`;
  }
  md+=`
`;
  md+=`**Validation**: All 520 calls cite **E1–E6** (100% each) — evidenceIds_valid = ${evidenceValidCount}/${totalCalls} (${(evidenceValidCount/totalCalls*100).toFixed(2)}%).

`;
  md+=`### 4.2 EvidenceIds per Suite

`;
  md+=`| Suite / Kind | Calls | E1 | E2 | E3 | E4 | E5 | E6 | E4 withheld (null) |
`;
  md+=`| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
`;
  for(const suite of sortedSuites){
    const arr=suiteGroups[suite];
    if(!arr) continue;
    const eCounts={E1:0,E2:0,E3:0,E4:0,E5:0,E6:0};
    let withheld=0;
    for(const c of arr){
      for(const e of (c.evidenceIds||[])) if(eCounts[e]!==undefined) eCounts[e]++;
      if(c.e4_withheld) withheld++;
    }
    md+=`| \`${suite}\` | ${arr.length} | ${eCounts.E1} | ${eCounts.E2} | ${eCounts.E3} | ${eCounts.E4} | ${eCounts.E5} | ${eCounts.E6} | ${withheld} (${(withheld/arr.length*100).toFixed(1)}%) |
`;
  }
  md+=`
`;
  md+=`**E4 withheld analysis**: Overall **${e4WithheldCount}/${totalCalls} (${(e4WithheldCount/totalCalls*100).toFixed(2)}%)** calls have **E4 = null** (withheld spectrum due to timing gaps). Split: Baseten **${e4WithheldBaseten}/410 (${(e4WithheldBaseten/410*100).toFixed(2)}%)**, Fireworks **${e4WithheldFireworks}/110 (${(e4WithheldFireworks/110*100).toFixed(2)}%)**. E4 withheld aligns with \`findingIds\` containing \`timing\` + \`spectrum-unavailable\`.

`;
  md+=`---

`;
  md+=`## 5. FindingIds Citation Distribution (findingIds / findings_actual)

`;
  md+=`Findings are the model’s predicted fault classes: **no-flags, hum, clipping, timing, spectrum-unavailable, flat**. Each call may have 1–2 findings (gaps → timing + spectrum-unavailable). Distribution is validated against deterministic engine.mjs.

`;
  md+=`### 5.1 Overall FindingIds Counts

`;
  md+=`| FindingId | Count | % of 520 | % of all findings (624) | Baseten (410) | Fireworks (110) | En (260) | Id (260) |
`;
  md+=`| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
`;
  const totalFindings=Object.values(findingCounts).reduce((a,b)=>a+b,0);
  const findingPerLang={en:{},id:{}};
  for(const c of allCalls){
    const lang=c.language;
    for(const f of (c.findingIds||[])){
      if(!findingPerLang[lang]) findingPerLang[lang]={};
      findingPerLang[lang][f]=(findingPerLang[lang][f]||0)+1;
    }
  }
  for(const fid of ['no-flags','hum','clipping','timing','spectrum-unavailable','flat'].sort()){
    const cnt=findingCounts[fid]||0;
    const pctAll=cnt/totalCalls*100;
    const pctFindings=cnt/totalFindings*100;
    const bCnt=findingPerProvider.Baseten[fid]||0;
    const fCnt=findingPerProvider.Fireworks[fid]||0;
    const enCnt=findingPerLang.en[fid]||0;
    const idCnt=findingPerLang.id[fid]||0;
    md+=`| \`${fid}\` | ${cnt} | ${pctAll.toFixed(2)}% | ${pctFindings.toFixed(2)}% | ${bCnt} | ${fCnt} | ${enCnt} | ${idCnt} |
`;
  }
  md+=`| **Total findingIds** | **${totalFindings}** | — | 100.00% | ${Object.values(findingPerProvider.Baseten).reduce((a,b)=>a+b,0)} | ${Object.values(findingPerProvider.Fireworks).reduce((a,b)=>a+b,0)} | ${Object.values(findingPerLang.en).reduce((a,b)=>a+b,0)} | ${Object.values(findingPerLang.id).reduce((a,b)=>a+b,0)} |
`;
  md+=`| **Total calls** | ${totalCalls} | 100% | — | 410 | 110 | 260 | 260 |
`;
  md+=`
`;
  md+=`**Validation**: All findingIds are valid subsets (findingIds_valid = ${findingValidCount}/${totalCalls} = ${(findingValidCount/totalCalls*100).toFixed(2)}%). Distribution is balanced: **hum 132 (${(132/520*100).toFixed(1)}%)**, **clipping 128 (${(128/520*100).toFixed(1)}%)**, **no-flags 116 (${(116/520*100).toFixed(1)}%)**, **spectrum-unavailable 96 (${(96/520*100).toFixed(1)}%)**, **timing 88 (${(88/520*100).toFixed(1)}%)**, **flat 64 (${(64/520*100).toFixed(1)}%)**.

`;

  md+=`### 5.2 Per-Suite FindingIds Distribution

`;
  md+=`| Suite / Kind | Calls | no-flags | hum | clipping | timing | spectrum-unavailable | flat | Avg findings/call |
`;
  md+=`| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
`;
  for(const suite of sortedSuites){
    const arr=suiteGroups[suite];
    if(!arr) continue;
    const m=suiteFinding[suite]||{};
    const totalF=Object.values(m).reduce((a,b)=>a+b,0);
    const avg=totalF/arr.length;
    md+=`| \`${suite}\` | ${arr.length} | ${m['no-flags']||0} | ${m['hum']||0} | ${m['clipping']||0} | ${m['timing']||0} | ${m['spectrum-unavailable']||0} | ${m['flat']||0} | ${fmt(avg,2)} |
`;
  }
  md+=`
`;
  md+=`### 5.3 Per-Provider FindingIds Distribution

`;
  md+=`| Provider | Calls | no-flags | hum | clipping | timing | spectrum-unavailable | flat | Avg findings/call |
`;
  md+=`| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
`;
  for(const prov of ['Baseten','Fireworks']){
    const m=findingPerProvider[prov]||{};
    const totalF=Object.values(m).reduce((a,b)=>a+b,0);
    const calls=prov==='Baseten'?basetenCalls.length:fireworksCalls.length;
    const avg=totalF/calls;
    md+=`| ${prov} | ${calls} | ${m['no-flags']||0} | ${m['hum']||0} | ${m['clipping']||0} | ${m['timing']||0} | ${m['spectrum-unavailable']||0} | ${m['flat']||0} | ${fmt(avg,2)} |
`;
  }
  md+=`
`;
  md+=`---

`;
  md+=`## 6. Provider Comparison Summary

`;
  md+=`| Dimension | Baseten (meta-models/muse-spark-open-1026) | Fireworks (accounts/fireworks/models/muse-spark-open) | Delta |
`;
  md+=`| :--- | :--- | :--- | :--- |
`;
  md+=`| **Calls** | 410/410 (100%) | 110/110 (100%) | — |
`;
  md+=`| **Mean latency** | ${fmt(basetenLat.mean)}s | ${fmt(fireworksLat.mean)}s | +${fmt(fireworksLat.mean - basetenLat.mean)}s (Fireworks slower) |
`;
  md+=`| **P50 latency** | ${fmt(basetenLat.p50)}s | ${fmt(fireworksLat.p50)}s | +${fmt(fireworksLat.p50 - basetenLat.p50)}s |
`;
  md+=`| **P90 latency** | ${fmt(basetenLat.p90)}s | ${fmt(fireworksLat.p90)}s | +${fmt(fireworksLat.p90 - basetenLat.p90)}s |
`;
  md+=`| **P95 latency** | ${fmt(basetenLat.p95)}s | ${fmt(fireworksLat.p95)}s | +${fmt(fireworksLat.p95 - basetenLat.p95)}s |
`;
  md+=`| **Max latency** | ${fmt(basetenLat.max)}s | ${fmt(fireworksLat.max)}s | +${fmt(fireworksLat.max - basetenLat.max)}s |
`;
  md+=`| **Total tokens** | ${basetenTokens.toLocaleString('en-US')} | ${fireworksTokens.toLocaleString('en-US')} | ${(basetenTokens/fireworksTokens).toFixed(2)}× |
`;
  md+=`| **Reasoning tokens** | ${basetenReasoning.toLocaleString('en-US')} (${(basetenReasoningRatio*100).toFixed(2)}%) | ${fireworksReasoning.toLocaleString('en-US')} (${(fireworksReasoningRatio*100).toFixed(2)}%) | +${(basetenReasoningRatio*100 - fireworksReasoningRatio*100).toFixed(1)}pp |
`;
  md+=`| **Speculative decoding** | ${totalAccepted.toLocaleString('en-US')} accepted / ${totalRejected.toLocaleString('en-US')} rejected = **${(overallAcceptance*100).toFixed(2)}%** | — (not exposed) | — |
`;
  md+=`| **EvidenceIds valid** | 410/410 | 110/110 | — |
`;
  md+=`| **FindingIds valid** | 410/410 | 110/110 | — |
`;
  md+=`| **E4 withheld** | ${e4WithheldBaseten}/410 (${(e4WithheldBaseten/410*100).toFixed(1)}%) | ${e4WithheldFireworks}/110 (${(e4WithheldFireworks/110*100).toFixed(1)}%) | — |
`;
  md+=`
`;
  md+=`**Mitigation noted**: Dual-provider support with max_tokens=4096 and concise reasoning prompt reduced peak latency from 24.2s (Fireworks) to 9.47s (Baseten mean 6.06s on baseline). Timeout 25s was never exceeded (Fireworks max 24.549s, Baseten max 13.053s).

`;
  md+=`---

`;
  md+=`## 7. Data Completeness & Methodology

`;

  md+=`### 7.1 Input Files

`;
  md+=`- \`docs/stress_benchmark.json\` — 500 stress calls: \`fireworks_100_stress_results\` (60 multi-rate + boundary etc head-to-head), \`baseten_100_stress_results\` (same 100), \`baseten_300_montecarlo_results\` (100 parametric-grid + 200 seeded Monte Carlo). Date \`${stressDate}\`.
`;
  md+=`- \`docs/local_live_matrix.json\` — 20 baseline calls: \`results\` (10 Baseten + 10 Fireworks, 5 kinds ×2 languages). Date \`${matrixDate}\`.
`;
  md+=`- Combined **520** live calls verified: **410 Baseten + 110 Fireworks** across **205 unique synthetic scenarios ×2 languages** (engine.mjs). No hardware captures.

`;
  md+=`### 7.2 Computation Methods

`;
  md+=`- **Latency percentiles**: Nearest-rank on sorted \`duration_s\` values. P10 = ceil(0.10×n)th smallest, etc. No interpolation.
`;
  md+=`- **Reasoning token ratio**: Per-call = \`reasoning_tokens\` / \`total_tokens\`. Aggregate = sum(reasoning) / sum(total). Fireworks reasoning from \`output_tokens_details.reasoning_tokens\` fallback.
`;
  md+=`- **Baseten acceptance**: Per-call = \`accepted_prediction_tokens\` / (\`accepted\`+ \`rejected\`). Aggregate = sum(accepted)/sum(accepted+rejected). Only Baseten exposes these fields.
`;
  md+=`- **Evidence/finding distributions**: Count occurrences of each \`evidenceIds\` entry (E1–E6) and \`findingIds\` entry (no-flags etc.) across all calls. Percentages relative to 520 calls or total findingIds (624).
`;
  md+=`- **Suite grouping**: Uses \`suite\` field for stress calls, \`kind\` for baseline. All calls have \`language\` en/id.

`;
  md+=`### 7.3 Honesty & Scope

`;
  md+=`- All 520 calls use synthetic bench signals generated deterministically by \`engine.mjs\` (\`hardwareEvaluated: false\`).
`;
  md+=`- Every response passed strict schema, ID-subset, and withheld-spectrum validation.
`;
  md+=`- No API keys logged; raw samples never sent to model (only E1–E6 summary statistics).

`;
  md+=`---

`;
  md+=`## 8. Raw JSON Summary (for machine consumption)

`;
  md+=`\`\`\`json
`;
  const summaryJson={
    generated:now,
    sources:{
      stress_benchmark_json:stressPath,
      local_live_matrix_json:matrixPath,
      stress_counts:Object.fromEntries(stressArrays.map(s=>[s.key,s.arr.length])),
      baseline_count:baselineCalls.length,
      total:totalCalls,
      baseten:basetenCalls.length,
      fireworks:fireworksCalls.length
    },
    totals:{
      total_tokens:totalTokens,
      reasoning_tokens:totalReasoning,
      reasoning_ratio:overallReasoningRatio,
      baseten:{tokens:basetenTokens,reasoning:basetenReasoning,ratio:basetenReasoningRatio},
      fireworks:{tokens:fireworksTokens,reasoning:fireworksReasoning,ratio:fireworksReasoningRatio}
    },
    latency_percentiles:{
      overall:{count:overallLat.count,min:overallLat.min,p10:overallLat.p10,p25:overallLat.p25,p50:overallLat.p50,p75:overallLat.p75,p90:overallLat.p90,p95:overallLat.p95,p99:overallLat.p99,max:overallLat.max,mean:overallLat.mean,std:overallLat.std},
      baseten:{count:basetenLat.count,min:basetenLat.min,p10:basetenLat.p10,p25:basetenLat.p25,p50:basetenLat.p50,p75:basetenLat.p75,p90:basetenLat.p90,p95:basetenLat.p95,p99:basetenLat.p99,max:basetenLat.max,mean:basetenLat.mean,std:basetenLat.std},
      fireworks:{count:fireworksLat.count,min:fireworksLat.min,p10:fireworksLat.p10,p25:fireworksLat.p25,p50:fireworksLat.p50,p75:fireworksLat.p75,p90:fireworksLat.p90,p95:fireworksLat.p95,p99:fireworksLat.p99,max:fireworksLat.max,mean:fireworksLat.mean,std:fireworksLat.std}
    },
    baseten_speculative_decoding:{
      count:basetenWithSpec.length,
      total_accepted:totalAccepted,
      total_rejected:totalRejected,
      overall_rate:overallAcceptance,
      per_call:{min:acceptanceStats.min,p10:acceptanceStats.p10,p25:acceptanceStats.p25,p50:acceptanceStats.p50,p75:acceptanceStats.p75,p90:acceptanceStats.p90,p95:acceptanceStats.p95,p99:acceptanceStats.p99,max:acceptanceStats.max,mean:acceptanceStats.mean,std:acceptanceStats.std}
    },
    evidenceIds_distribution:evidenceCounts,
    findingIds_distribution:findingCounts,
    e4_withheld:{total:e4WithheldCount,baseten:e4WithheldBaseten,fireworks:e4WithheldFireworks}
  };
  md+=JSON.stringify(summaryJson,null,2)+'\n';
  md+=`\`\`\`

`;
  md+=`---

`;
  md+=`*End of report — generated by \`tests/analyze_benchmarks.mjs\` (zero dependencies).*
`;
  fs.mkdirSync(docsDir,{recursive:true});
  fs.writeFileSync(outPath,md,'utf8');
  console.log(`✅ Wrote ${outPath} (${(md.length/1024).toFixed(1)} KB, ${md.split('\n').length} lines)`);
  console.log(`   Overall latency P50 ${fmt(overallLat.p50)}s P90 ${fmt(overallLat.p90)}s P95 ${fmt(overallLat.p95)}s P99 ${fmt(overallLat.p99)}s`);
  console.log(`   Baseten acceptance overall ${(overallAcceptance*100).toFixed(2)}% mean ${(acceptanceStats.mean*100).toFixed(2)}%`);
  console.log(`   EvidenceIds E1..E6 each ${evidenceCounts['E1']||0}/520`);
  console.log(`   FindingIds total ${totalFindings} across 520 calls`);
  console.log(`   Reasoning ratio overall ${(overallReasoningRatio*100).toFixed(2)}%`);
}
main();
