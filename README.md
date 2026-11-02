# SignalProof — Evidence-Linked Low-Voltage Signal Quality Workbench

Live workbench: https://vanovri.github.io/signalproof/  
Three-minute narrated demo: https://vanovri.github.io/signalproof/docs/demo.html  
Evaluation report: [`docs/evaluation.json`](docs/evaluation.json) · 520-Call Live Stress Benchmark: [`docs/stress_benchmark.md`](docs/stress_benchmark.md) ([`JSON`](docs/stress_benchmark.json)) · Provider Telemetry Analysis: [`docs/provider_telemetry_analysis.md`](docs/provider_telemetry_analysis.md) · DSP Math Proof: [`docs/dsp_math_verification.md`](docs/dsp_math_verification.md) · Live audit: [`docs/local_audit.md`](docs/local_audit.md) · Status: [`docs/status.json`](docs/status.json)

SignalProof is an evidence-first signal quality workbench for electronics engineering labs. It checks low-voltage time-series captures (`time_s,value`, default `0.0–3.3 V` bench range) for common measurement faults **before** generating an optional bilingual (`en` / `id`) explanation with **Meta Muse Spark Open** (`meta-models/muse-spark-open-1026` on Baseten or `accounts/fireworks/models/muse-spark-open` on Fireworks).

All deterministic measurements run in the browser with zero third-party runtime dependencies. When a live explanation is requested on the local/hosted server, only the compact derived evidence ledger (`E1`–`E6`) and fixed finding IDs are sent to the model — raw CSV samples and filenames never leave the server, and a strict post-generation validator rejects any response that cites unknown IDs or omits uncertainty bounds. On static GitHub Pages (`https://vanovri.github.io/signalproof/`), clicking **Explain with Meta Muse Spark Open** transparently replays the verified recorded live responses from [`docs/verified_live_responses.json`](docs/verified_live_responses.json) for the 5 built-in presets at default `0–3.3 V` rails (clearly labeled as recorded live audit responses).

---

## Core Architecture: Measure First, Explain Second

1. **Deterministic Signal Quality Engine ([`engine.mjs`](engine.mjs))**:
   - **E1 — Mean (DC offset)**: Average voltage across all samples.
   - **E2 — AC RMS**: Root-mean-square amplitude after DC removal.
   - **E3 — Near-rail samples**: Share of samples within `2%` of the configured lower/upper rail (flags `clipping` at `>= 1%`).
   - **E4 — 48–52 Hz band share**: Fraction of AC spectral power in the `48–52 Hz` mains hum band using radix-2 FFT with Hann window on the largest power-of-two block (flags `hum` at `>= 15%`).
   - **E5 — Timing regularity**: Median sample interval, estimated sample rate, skipped-sample gaps (`dt > 1.5 × median`), and normalized MAD jitter (flags `timing` if `gaps > 0` or `jitter > 2%`).
   - **E6 — Usable duration**: Total capture span (`>= 1.0 s` and `>= 120 Hz` required for `1 Hz` bin resolution around `50 Hz`).
2. **Withheld-Spectrum Guardrail**:
   - If timestamp gaps exist (`gaps > 0`), jitter exceeds `2%`, duration is `< 1.0 s`, or sample rate is `< 120 Hz`, `E4` is set to `null` and the FFT spectrum is **withheld** (`spectrum-unavailable`) instead of rendering a misleading spectrum.
3. **Evidence-Gated Meta Muse Spark Open Reasoning ([`api/analyze.mjs`](api/analyze.mjs))**:
   - Supports **Baseten** (`https://inference.baseten.co/v1/chat/completions`, default `meta-models/muse-spark-open-1026`) and **Fireworks** (`https://api.fireworks.ai/inference/v1/chat/completions`, default `accounts/fireworks/models/muse-spark-open`).
   - Recomputes the deterministic report server-side, prompts `Muse Spark Open` at `temperature: 0` (`max_tokens: 4096`, `response_format: { type: "json_object" }`), strips markdown fences if present, and validates that every returned `evidenceIds[]` and `findingIds[]` entry exists in the deterministic report.

---

## Verification & Honest Boundaries

| Verification Suite | Command / Artifact | Result | Scope & Honesty Note |
| :--- | :--- | :--- | :--- |
| **Unit, DSP & Security Red-Team Tests** | `npm test` ([`tests/engine.test.mjs`](tests/engine.test.mjs), [`tests/security_redteam.test.mjs`](tests/security_redteam.test.mjs)) | **38 / 38 passed** | Tests CSV formula/DDE injection rejection, `E1`–`E6` math, off-bin Hann leakage, withheld-spectrum rules (gaps, jitter > 2%, sub-120 Hz, < 1.0 s), Host/Origin spoofing, CLI (`cli.mjs`), and Baseten/Fireworks `Muse Spark Open` validator. |
| **Synthetic Evaluation Matrix** | `npm run evaluate` ([`docs/evaluation.json`](docs/evaluation.json)) | **15 / 15 passed** | 5 signal classes (`healthy`, `hum`, `clipping`, `gaps`, `flat`) × 3 sample rates (`200`, `250`, `500 Hz`). Synthetic bench signals only (`0–3.3 V`). |
| **Live Meta Muse Spark Open Benchmark (Baseten)** | [`docs/stress_benchmark.md`](docs/stress_benchmark.md) · [`docs/provider_telemetry_analysis.md`](docs/provider_telemetry_analysis.md) · [`docs/verified_live_responses.json`](docs/verified_live_responses.json) | **410 / 410 passed** (`1,091,580` tokens) | `meta-models/muse-spark-open-1026` across 205 synthetic signal scenarios × `en` & `id` (`699,194` reasoning tokens, `619,532` accepted speculative tokens, mean latency `6.90s`). Plus `35.70M` tokens burned across 13 autonomous Cline coding & auditing runs on Baseten. |
| **Live Meta Muse Spark Open Benchmark (Fireworks)** | [`docs/stress_benchmark.md`](docs/stress_benchmark.md) · [`docs/stress_benchmark.json`](docs/stress_benchmark.json) · [`docs/local_live_matrix.json`](docs/local_live_matrix.json) | **110 / 110 passed** (`224,255` tokens) | `accounts/fireworks/models/muse-spark-open` across 55 synthetic signal scenarios × `en` & `id` (`121,035` reasoning tokens, mean latency `13.83s`). |

### Explicit Scope Limits
- **Synthetic captures only (`hardwareEvaluated: false`)**: All 15 deterministic evaluation scenarios, 38 unit/red-team tests, and all **520 verified live `Meta Muse Spark Open` calls (`1,315,835` total benchmark tokens, `820,229` reasoning tokens)** use synthetic bench signals generated by `engine.mjs`. Real oscilloscope, ADC, or sensor captures have not been benchmarked.
- **Not a medical or safety-critical device**: SignalProof is for low-voltage teaching/bench inspection (`0–3.3 V`) and does not diagnose hardware root causes or medical conditions.
- **Modal recipe (`modal_app.py`)**: Included as an optional serverless deployment recipe; no Modal workloads are deployed in the public demo (`modalWorkloadsDeployed: false`).

---

## Quick Start (Web Workbench & CLI Inspector)

Requires **Node.js 20+** (zero `npm install` packages required):

```bash
git clone https://github.com/vanovri/signalproof.git
cd signalproof
cp .env.example .env
# Add BASETEN_API_KEY (recommended, ~6.9s latency) or FIREWORKS_API_KEY to .env
npm test
npm run evaluate
npm start
```

Open `http://127.0.0.1:8789` in your browser, or run the zero-dependency CLI inspector directly from the terminal:

```bash
node cli.mjs --demo hum
node cli.mjs --demo gaps
node cli.mjs --demo hum --explain --lang id
```
