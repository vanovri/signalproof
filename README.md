# SignalProof: measure before you explain

An evidence-linked workbench for low-voltage electronics captures. Inspect a CSV, identify capture-quality flags, compare a new recording, and ask Meta Muse Spark Open to explain the measured evidence in English or Indonesian.

[Open workbench](https://vanovri.github.io/signalproof/) · [Three-minute narrated walkthrough](https://vanovri.github.io/signalproof/docs/demo.html) · [Judge guide](docs/JUDGE_GUIDE.md) · [Corrected benchmark audit](docs/provider_telemetry_analysis.md)

## A concrete workflow

An electronics student sees a plausible waveform. Is there strong 50 Hz energy? Did the capture approach its ADC rails? Can the timestamps support a spectrum?

1. Open **50 Hz interference**. Follow the hum finding to E4, about 73.545% band power.
2. Click **Pin current capture**, then **Reference signal**. Compare AC RMS, near-rail percentage, and band share. The band-share change is about -73.545 percentage points. These are two synthetic examples, not proof of a hardware repair.
3. Open **Missing samples**. E5 records one timing gap. E4 becomes unavailable and no spectrum is shown.
4. Choose **Recorded example** and view a saved Meta response in either language. The page labels its date and provider and states that no new inference occurs.
5. Export the report. It includes measurements, source type, the currently displayed explanation, and the pinned comparison. It never includes the owner access token.

The deterministic engine supplies the measurements and suggested next bench checks. Meta provides an optional bilingual explanation. It does not calculate the FFT, classify faults independently, or control hardware. This separation makes the numbers reproducible and keeps an AI failure from changing measurements. Human usefulness and time savings have not been measured.

## What runs where

| Component | Responsibility |
| --- | --- |
| `engine.mjs` | Browser/local CSV validation, timing checks, AC RMS, rail proximity, Hann-windowed radix-2 FFT, heuristic findings |
| `comparison.mjs` | Measurement deltas with matching rails, sample rate, and sample count. Unavailable values stay unavailable. |
| `app.mjs` | Charts, evidence links, reference capture, explicit recorded/live mode, JSON export |
| `api/analyze.mjs` | Recompute on server; send only E1-E6, fixed findings, and limits to Muse; validate response schema and ID references |
| `server.mjs` | Loopback server, body-size limit, origin check, static-file allowlist, server-side API keys |
| `cli.mjs` | Terminal inspector for CSVs and synthetic presets |

Static GitHub Pages provides browser analysis and recorded examples. Live custom-CSV explanations require the Node server and a server-side API key. A live request sends CSV samples to that server for recomputation. Only derived evidence and findings go from the server to the model. Explanations can still contain incorrect prose despite valid references.

Muse Spark Open model IDs: `meta-models/muse-spark-open-1026` on Baseten and `accounts/fireworks/models/muse-spark-open` on Fireworks. Fireworks takes precedence if both API keys are configured. Public server deployments require `SIGNALPROOF_ACCESS_TOKEN` before spending inference credits.

## Reproduce locally

Requires Node.js 22.9+ for optional `.env` loading. There are no third-party runtime packages to install.

```sh
git clone https://github.com/vanovri/signalproof.git
cd signalproof
# Optional: copy .env.example to .env and configure one provider key.
npm test
npm run evaluate
npm run audit:benchmarks
npm start
```

Open `http://127.0.0.1:8789`. `npm start` loads `.env` if present. Existing environment variables take precedence.

```sh
node cli.mjs --demo hum
node cli.mjs --demo gaps
node cli.mjs --demo healthy --compare-demo hum
node cli.mjs --file samples/hum.csv --json
# Explicit env loading for a live CLI request:
node --env-file=.env cli.mjs --demo hum --explain --lang id
```

## Measurements and limits

- E1: arithmetic DC mean, volts.
- E2: RMS deviation from the DC mean, volts.
- E3: percentage of samples within 0.5% of either declared ADC rail. Flag threshold: at least 1% of samples. Proximity does not prove physical clipping.
- E4: 48-52 Hz power divided by power from 5 Hz to min(200 Hz, Nyquist), using a Hann-windowed FFT. Flag threshold: at least 15%. This checks the configured 50 Hz band, not every noise source.
- E5: count of timestamp intervals greater than 1.5 times the median interval. Relative RMS jitter excludes those gaps. It does not identify packet loss.
- E6: total time span. The sample rate comes from median timestamp spacing.

The spectrum requires no gaps, at most 2% RMS jitter, at least one second of capture, at least 120 Hz sample rate, and retained FFT bin spacing at most 1 Hz. The engine uses the first largest power-of-two block. The UI reports exactly how many samples it uses. Later changes may be missed. Bin spacing does not equal physical resolving power. A flat capture can have a valid FFT window but undefined band share because AC power is negligible.

## Evidence, not an accuracy score

- 54 unit, DSP, archive-integrity, HTTP, comparison, and CLI tests pass. See `npm test`.
- 15/15 deterministic synthetic scenarios pass across five classes and three sample rates. See [evaluation JSON](docs/evaluation.json).
- The normalized archive contains 520 successful synthetic inference records: 410 Baseten and 110 Fireworks. Corrected recorded token total: 1,313,133. See [reproducible audit](docs/benchmark_audit.json).
- Recorded mean successful-call duration: Baseten 6.901 seconds, Fireworks 14.816 seconds. Different case mixes and sample counts prevent interpreting these aggregate means as a controlled speed comparison. Retry backoff and failed-attempt tokens are not fully recorded.
- Full summary and uncertainty text exists for 200 benchmark rows. The remaining 320 rows contain telemetry without both text fields. Ten saved Baseten example responses are separately available in [recorded responses](docs/verified_live_responses.json).
- Schema and ID-subset checks do not establish factual accuracy, cause attribution, or real-hardware performance. Coding-agent token consumption is not a product-quality metric.

The new audit rejects eight mislabeled duplicate baseline rows and recovers the original Fireworks rows from the legacy provider array. Raw source JSON stays unchanged. Earlier reports contain historical totals; use the corrected audit and [status](docs/status.json) for aggregate claims.

All evaluation captures are synthetic. No hardware validation, clinical use, production-reliability claim, or measured user outcome. The optional `modal_app.py` recipe is not deployed. The existing video predates the comparison feature; the judge guide covers the current interactive demo.
