import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditBenchmark} from './benchmark-audit.mjs';
const read=name=>JSON.parse(readFileSync(new URL(`../docs/${name}`,import.meta.url)));
const stress=read('stress_benchmark.json'),matrix=read('local_live_matrix.json');
test('archive audit recovers original Fireworks baseline and removes mislabeled duplicates',()=>{
  const r=auditBenchmark(stress,matrix);
  assert.equal(r.totals.calls,520);
  assert.equal(r.providers.Baseten.calls,410);
  assert.equal(r.providers.Fireworks.calls,110);
  assert.equal(r.baselineCalls,20);
  assert.equal(r.recoveredBaselinePairs.length,8);
  assert.equal(r.providers.Fireworks.minSeconds,8.562);
  assert.equal(r.providers.Fireworks.acceptedPredictionTokens,0);
  assert.equal(r.textCoverage.completeTextInBenchmarkArchive,200);
  assert.equal(r.textCoverage.telemetryOnly,320);
  const b=r.providers.Baseten;
  assert.equal(b.speculativeAcceptance,b.acceptedPredictionTokens/(b.acceptedPredictionTokens+b.rejectedPredictionTokens));
  assert.ok(b.speculativeAcceptance>.42&&b.speculativeAcceptance<.43);
});
test('audit fails on unavailable telemetry and forged known-finding validation booleans',()=>{
  const bad=structuredClone(stress);
  bad.fireworks_100_stress_results[0].duration_s=null;
  assert.throws(()=>auditBenchmark(bad,matrix),/Incomplete live telemetry/);
  const forged=structuredClone(stress);
  forged.fireworks_100_stress_results[0].findingIds=['invented'];
  assert.throws(()=>auditBenchmark(forged,matrix),/Invalid finding IDs/);
});
