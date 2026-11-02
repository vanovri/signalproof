import {readFile,writeFile} from 'node:fs/promises';
import {auditBenchmark} from './benchmark-audit.mjs';
const read=async name=>JSON.parse(await readFile(new URL(`../docs/${name}`,import.meta.url),'utf8'));
const r=auditBenchmark(await read('stress_benchmark.json'),await read('local_live_matrix.json'));
await writeFile(new URL('../docs/benchmark_audit.json',import.meta.url),JSON.stringify(r,null,2)+'\n');
const f=n=>n.toFixed(3);
const md=`# SignalProof provider telemetry audit

Generated from committed records with \`npm run audit:benchmarks\`. No inference calls are made.

${r.totals.calls} archived successful synthetic calls, ${r.totals.totalTokens.toLocaleString('en-US')} recorded tokens. This is an archive-integrity result, not 100% factual accuracy or a hardware benchmark.

| Provider | Calls | Recorded tokens | Mean seconds | P50 | P95 | Max | Additional attempts |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${Object.entries(r.providers).map(([p,s])=>`| ${p} | ${s.calls} | ${s.totalTokens} | ${f(s.meanSeconds)} | ${f(s.p50Seconds)} | ${f(s.p95Seconds)} | ${f(s.maxSeconds)} | ${s.additionalAttempts} |`).join('\n')}

The providers have different sample counts and case mixes. These aggregate latencies do not establish a controlled speed advantage. Durations describe successful calls, excluding unrecorded retry/backoff time and failed-attempt tokens.

## Source correction

The canonical baseline array contained eight rows labeled Fireworks with a Baseten model ID and duplicated Baseten telemetry. The audit rejects these mismatches and recovers eight original Fireworks rows from the legacy provider array. It deduplicates baseline entries by provider, example, and language. Original JSON stays unchanged. See [machine-readable corrections](benchmark_audit.json).

The old 1,315,835-token total and 13.83-second Fireworks mean came from the corrupted baseline. Corrected totals appear above.

## Speculative decoding

Baseten records ${r.providers.Baseten.acceptedPredictionTokens} accepted and ${r.providers.Baseten.rejectedPredictionTokens} rejected prediction tokens. Acceptance is accepted / (accepted + rejected), or ${(100*r.providers.Baseten.speculativeAcceptance).toFixed(2)}%. It is not accepted / reasoning tokens. No causal latency claim follows from this ratio.

## What can be checked

All ${r.totals.calls} normalized rows have recorded live status, duration, usage, and valid ID arrays. Source success booleans alone do not establish semantic grounding. The archive contains full summary and uncertainty text for ${r.textCoverage.completeTextInBenchmarkArchive} rows. ${r.textCoverage.telemetryOnly} rows contain telemetry without both text fields. Ten saved Baseten examples are also available in [recorded responses](verified_live_responses.json).

Findings come from the deterministic engine. Muse explains those findings. Calling finding IDs model predictions would misstate this architecture.

${r.limits.map(s=>`- ${s}`).join('\n')}

Raw historical [stress report](stress_benchmark.md) and [baseline audit](local_audit.md) describe the earlier run. Use this audit for corrected aggregate metrics.
`;
await writeFile(new URL('../docs/provider_telemetry_analysis.md',import.meta.url),md);
console.log(JSON.stringify({calls:r.totals.calls,tokens:r.totals.totalTokens,providers:r.providers,recovered:r.recoveredBaselinePairs.length,textCoverage:r.textCoverage},null,2));
