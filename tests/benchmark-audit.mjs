const models={Baseten:'meta-models/muse-spark-open-1026',Fireworks:'accounts/fireworks/models/muse-spark-open'};
const sum=(a,f)=>a.reduce((s,c)=>s+f(c),0);
const reason=c=>c.usage?.completion_tokens_details?.reasoning_tokens??c.usage?.output_tokens_details?.reasoning_tokens??0;
const percentile=(a,p)=>[...a].sort((a,b)=>a-b)[Math.max(0,Math.ceil(a.length*p)-1)];

export function collectCalls(stress,matrix){
  const rejected=[],baseline=new Map();
  const valid=(c,source)=>{
    if(models[c.provider]!==c.model){rejected.push({source,kind:c.kind??c.id,language:c.language,reason:'Provider/model mismatch',provider:c.provider,model:c.model});return false;}
    if(c.status!=='live'||!Number.isFinite(c.duration_s)||c.duration_s<=0||!Number.isFinite(c.usage?.total_tokens))throw Error(`Incomplete live telemetry in ${source}`);
    if(c.evidenceIds_valid!==true||c.findingIds_valid!==true)throw Error(`Recorded validation failed in ${source}`);
    return true;
  };
  // Canonical results were partially overwritten. Recover missing baseline pairs
  // from the original provider arrays, keeping each provider/kind/language once.
  for(const key of ['results','baseten_results','fireworks_results'])for(const c of matrix[key]??[]){
    if(!valid(c,`local_live_matrix.json:${key}`))continue;
    const id=`${c.provider}:${c.kind}:${c.language}`;
    if(!baseline.has(id))baseline.set(id,{...c,source:`local_live_matrix.json:${key}`});
  }
  const stressCalls=[];
  for(const [key,rows] of Object.entries(stress))if(Array.isArray(rows)&&rows[0]?.provider)for(const c of rows){
    if(!valid(c,`stress_benchmark.json:${key}`))throw Error('Invalid stress provider.');
    stressCalls.push({...c,source:`stress_benchmark.json:${key}`});
  }
  return {calls:[...stressCalls,...baseline.values()],rejected,baseline:[...baseline.values()]};
}
function stats(calls){
  if(!calls.length)throw Error('No benchmark calls.');
  const times=calls.map(c=>c.duration_s),accepted=sum(calls,c=>c.usage?.completion_tokens_details?.accepted_prediction_tokens??0),rejected=sum(calls,c=>c.usage?.completion_tokens_details?.rejected_prediction_tokens??0);
  return {calls:calls.length,totalTokens:sum(calls,c=>c.usage.total_tokens),reasoningTokens:sum(calls,reason),meanSeconds:sum(calls,c=>c.duration_s)/calls.length,minSeconds:Math.min(...times),maxSeconds:Math.max(...times),p50Seconds:percentile(times,.5),p95Seconds:percentile(times,.95),additionalAttempts:sum(calls,c=>(c.attempts??1)-1),acceptedPredictionTokens:accepted,rejectedPredictionTokens:rejected,speculativeAcceptance:accepted+rejected?accepted/(accepted+rejected):null};
}
export function auditBenchmark(stress,matrix){
  const {calls,rejected,baseline}=collectCalls(stress,matrix);
  const providers=Object.fromEntries(Object.keys(models).map(p=>[p,{model:models[p],...stats(calls.filter(c=>c.provider===p))}]));
  const evidenceCounts={},findingCounts={};
  for(const c of calls){
    if(!Array.isArray(c.evidenceIds)||!c.evidenceIds.length||new Set(c.evidenceIds).size!==c.evidenceIds.length||c.evidenceIds.some(id=>!/^E[1-6]$/.test(id)))throw Error('Invalid evidence IDs in archive.');
    if(!Array.isArray(c.findingIds)||!c.findingIds.length||new Set(c.findingIds).size!==c.findingIds.length||c.findingIds.some(id=>!c.findings_actual.includes(id)))throw Error('Invalid finding IDs in archive.');
    for(const id of c.evidenceIds)evidenceCounts[id]=(evidenceCounts[id]??0)+1;
    for(const id of c.findingIds)findingCounts[id]=(findingCounts[id]??0)+1;
  }
  const textCount=calls.filter(c=>typeof c.summary==='string'&&typeof c.uncertainty==='string').length;
  return {
    schemaVersion:1,sources:['docs/stress_benchmark.json','docs/local_live_matrix.json'],
    scope:'Archived synthetic inference records. Schema and ID checks are not a semantic accuracy score. No new model calls.',
    totals:stats(calls),providers,baselineCalls:baseline.length,
    recoveredBaselinePairs:baseline.filter(c=>c.source.endsWith(':fireworks_results')).map(c=>`${c.provider}:${c.kind}:${c.language}`),
    rejectedProviderRows:rejected,
    textCoverage:{completeTextInBenchmarkArchive:textCount,telemetryOnly:calls.length-textCount,recordedExamplesFile:'docs/verified_live_responses.json'},
    evidenceCounts,findingCounts,
    limits:['Source rows report successful validation. Full response text is absent for some calls, so those semantic claims cannot be independently regraded.','Latency is recorded successful-call duration. Retry backoff, failed-attempt tokens, cost, and total user wait are not fully captured.','Provider samples differ in size and case mix. Aggregate latency is descriptive, not a controlled speed comparison.','E4 null can mean timing, rate, duration, FFT coverage, or insufficient AC power. An ID reference alone does not validate prose.','All captures are synthetic. No hardware, user-outcome, or production-reliability evaluation.']
  };
}
