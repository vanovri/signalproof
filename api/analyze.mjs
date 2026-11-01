import {analyze} from '../engine.mjs';
import {timingSafeEqual} from 'node:crypto';
export function resolveProvider() {
  if(process.env.FIREWORKS_API_KEY) return {provider:'Fireworks',url:'https://api.fireworks.ai/inference/v1/chat/completions',key:process.env.FIREWORKS_API_KEY,model:process.env.FIREWORKS_MODEL||'accounts/fireworks/models/muse-spark-open'};
  if(process.env.BASETEN_API_KEY) return {provider:'Baseten',url:'https://inference.baseten.co/v1/chat/completions',key:process.env.BASETEN_API_KEY,model:process.env.BASETEN_MODEL||'meta-models/muse-spark-open-1026'};
  return null;
}
export function validateExplanation(value, report) {
  if(!value||typeof value!=='object'||Array.isArray(value)||typeof value.summary!=='string'||!value.summary.trim()||value.summary.length>1800) throw Error('Invalid model summary.');
  if(!Array.isArray(value.evidenceIds)||!value.evidenceIds.length||!value.evidenceIds.every(id=>report.evidence.some(e=>e.id===id))) throw Error('Unknown evidence reference.');
  if(!Array.isArray(value.findingIds)||!value.findingIds.length||!value.findingIds.every(id=>report.findings.some(f=>f.id===id))) throw Error('Unknown finding reference.');
  if(typeof value.uncertainty!=='string'||!value.uncertainty.trim()||value.uncertainty.length>1200) throw Error('Missing uncertainty.');
  return {summary:value.summary,evidenceIds:[...new Set(value.evidenceIds)],findingIds:[...new Set(value.findingIds)],uncertainty:value.uncertainty};
}
export async function explain(report, language='en', requestFetch=fetch) {
  const cfg=resolveProvider();
  if(!cfg) return {status:'unconfigured',message:'Measurements are local. Meta Muse Spark Open explanation needs a server-side Fireworks or Baseten API key.'};
  const context={findings:report.findings,evidence:report.evidence,limits:report.limits};
  const prompt=`Explain this low-voltage bench-signal report in ${language==='id'?'Indonesian':'English'}. Keep internal reasoning concise and focused on the supplied numbers. Return JSON with summary (string), evidenceIds (array of supplied IDs), findingIds (array of supplied finding IDs), uncertainty (string). Refer to measured numbers and IDs. Do not invent readings, causes, diagnoses, tests already performed, or model confidence. Do not prescribe mains measurements, human-body experiments, or hardware control. Do not change the findings. Root cause is unknown. Raw data and personal identifiers are not provided.`;
  const response=await requestFetch(cfg.url,{method:'POST',signal:AbortSignal.timeout(25000),headers:{'Authorization':`Bearer ${cfg.key}`,'Content-Type':'application/json'},body:JSON.stringify({model:cfg.model,temperature:0,max_tokens:4096,response_format:{type:'json_object'},messages:[{role:'system',content:prompt},{role:'user',content:JSON.stringify(context)}]})});
  if(!response.ok) throw Error(`${cfg.provider} returned HTTP ${response.status}. Check model availability and account credits.`);
  const body=await response.json();
  if(body.choices?.[0]?.finish_reason!=='stop') throw Error('Model output was incomplete.');
  const rawContent=String(body.choices[0].message.content||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  const result=validateExplanation(JSON.parse(rawContent),report);
  return {status:'live',provider:cfg.provider,model:cfg.model,...result,usage:body.usage??null,notice:'Evidence IDs are validated. Text can still be wrong. Verify against the measurements.'};
}
export async function handle(body, headers={}, requestFetch=fetch, local=false) {
  try {
    if(!body||typeof body!=='object'||Array.isArray(body)) throw Error('Send a JSON object.');
    const report=analyze(body.rows,body.options);
    if(body.language!==undefined&&!['en','id'].includes(body.language)) throw Error('Language must be en or id.');
    if(!body.explain) return {code:200,body:{report,explanation:{status:'not-requested'}}};
    // Public deployments require an access token before spending API credits.
    const secret=process.env.SIGNALPROOF_ACCESS_TOKEN;
    const auth=String(headers.authorization||'').replace(/^Bearer /,'');
    if(!local&&(!secret||Buffer.byteLength(auth)!==Buffer.byteLength(secret)||!timingSafeEqual(Buffer.from(auth),Buffer.from(secret)))) return {code:403,body:{error:'Model access requires the owner access token. Local measurements remain available.'}};
    let explanation;
    try {explanation=await explain(report,body.language,requestFetch);} catch(e) {explanation={status:'unavailable',message:e instanceof SyntaxError?'Model returned invalid JSON.':String(e.message).slice(0,200)};}
    return {code:200,body:{report,explanation}};
  } catch(e) {return {code:400,body:{error:String(e.message).slice(0,250)}};}
}
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST') return res.status(405).json({error:'Use POST.'});
  let body=req.body;
  try {if(typeof body==='string')body=JSON.parse(body);} catch {return res.status(400).json({error:'Invalid JSON.'});}
  if(Buffer.byteLength(JSON.stringify(body??null))>2_000_000) return res.status(413).json({error:'Request exceeds 2 MB.'});
  const result=await handle(body,req.headers); return res.status(result.code).json(result.body);
}
