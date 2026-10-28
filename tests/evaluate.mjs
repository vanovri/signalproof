import {analyze,demo} from '../engine.mjs';
import {writeFile} from 'node:fs/promises';
const cases=[];
for(const fs of [200,250,500])for(const kind of ['healthy','hum','clipping','gaps','flat']) {
  const report=analyze(demo(kind,{fs,n:fs*4}));
  const actual=report.findings.map(f=>f.id).sort();
  const expected={healthy:['no-flags'],hum:['hum'],clipping:['clipping'],gaps:['spectrum-unavailable','timing'],flat:['flat']}[kind].sort();
  cases.push({name:`${kind}-${fs}Hz`,expected,actual,pass:JSON.stringify(actual)===JSON.stringify(expected)});
}
const result={date:new Date().toISOString(),scope:'15 synthetic scenarios using known construction labels. Checks deterministic flags, not AI quality or real-world accuracy.',passed:cases.filter(c=>c.pass).length,total:cases.length,cases,liveModelEvaluated:false,hardwareEvaluated:false};
await writeFile(new URL('../docs/evaluation.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));if(result.passed!==result.total)process.exitCode=1;
