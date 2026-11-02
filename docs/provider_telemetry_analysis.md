# SignalProof provider telemetry audit

Generated from committed records with `npm run audit:benchmarks`. No inference calls are made.

520 archived successful synthetic calls, 1,313,133 recorded tokens. This is an archive-integrity result, not 100% factual accuracy or a hardware benchmark.

| Provider | Calls | Recorded tokens | Mean seconds | P50 | P95 | Max | Additional attempts |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Baseten | 410 | 1091580 | 6.901 | 6.632 | 10.418 | 13.053 | 76 |
| Fireworks | 110 | 221553 | 14.816 | 14.062 | 22.948 | 24.549 | 1 |

The providers have different sample counts and case mixes. These aggregate latencies do not establish a controlled speed advantage. Durations describe successful calls, excluding unrecorded retry/backoff time and failed-attempt tokens.

## Source correction

The canonical baseline array contained eight rows labeled Fireworks with a Baseten model ID and duplicated Baseten telemetry. The audit rejects these mismatches and recovers eight original Fireworks rows from the legacy provider array. It deduplicates baseline entries by provider, example, and language. Original JSON stays unchanged. See [machine-readable corrections](benchmark_audit.json).

The old 1,315,835-token total and 13.83-second Fireworks mean came from the corrupted baseline. Corrected totals appear above.

## Speculative decoding

Baseten records 624895 accepted and 846491 rejected prediction tokens. Acceptance is accepted / (accepted + rejected), or 42.47%. It is not accepted / reasoning tokens. No causal latency claim follows from this ratio.

## What can be checked

All 520 normalized rows have recorded live status, duration, usage, and valid ID arrays. Source success booleans alone do not establish semantic grounding. The archive contains full summary and uncertainty text for 200 rows. 320 rows contain telemetry without both text fields. Ten saved Baseten examples are also available in [recorded responses](verified_live_responses.json).

Findings come from the deterministic engine. Muse explains those findings. Calling finding IDs model predictions would misstate this architecture.

- Source rows report successful validation. Full response text is absent for some calls, so those semantic claims cannot be independently regraded.
- Latency is recorded successful-call duration. Retry backoff, failed-attempt tokens, cost, and total user wait are not fully captured.
- Provider samples differ in size and case mix. Aggregate latency is descriptive, not a controlled speed comparison.
- E4 null can mean timing, rate, duration, FFT coverage, or insufficient AC power. An ID reference alone does not validate prose.
- All captures are synthetic. No hardware, user-outcome, or production-reliability evaluation.

Raw historical [stress report](stress_benchmark.md) and [baseline audit](local_audit.md) describe the earlier run. Use this audit for corrected aggregate metrics.
