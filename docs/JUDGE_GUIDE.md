# SignalProof judge guide

Open https://vanovri.github.io/signalproof/. No account, upload, or API key is needed for browser measurements and saved examples.

## Ninety-second interactive demo

1. Start on **50 Hz interference**. E4 shows about 73.545% power in 48-52 Hz and links to the hum finding. Open E4 to inspect its method. The spectrum note identifies the first 512 of 1,000 samples, with about 0.488 Hz bin spacing.
2. Click **Pin current capture**, then **Reference signal**. The comparison shows the change in band share and RMS. The cleared hum flag describes these synthetic examples only.
3. Select **Missing samples**. E5 reports one timing gap. E4 is unavailable. The app refuses to show a misleading spectrum. Matching sample count is required for the comparison, so this shorter capture correctly cannot be compared to the pinned 1,000-sample capture.
4. Choose **Recorded example, no new inference** and **Bahasa Indonesia**. Click **View recorded Meta response**. The status identifies the saved response, date, provider, and absence of a new inference request. Follow the evidence links.
5. Click **Export report**. The JSON preserves measurements, source type, and the displayed explanation. The live/recorded distinction remains in the export.

## What Meta adds

Muse Spark Open turns a compact measurement ledger into an explanation in English or Indonesian. The deterministic engine owns the numbers, finding IDs, and predefined next checks. The model can explain why a spectrum was withheld and what the supplied measurements support. A validator rejects malformed output, invented IDs, duplicate references, and missing uncertainty text. Valid IDs alone cannot guarantee truthful prose.

The model receives derived measurements and findings rather than the raw CSV or its filename. Live custom-capture inference works through the Node server. Static GitHub Pages serves recorded examples explicitly.

## Verify the evidence

Run `npm test`, `npm run evaluate`, and `npm run audit:benchmarks` after cloning. No inference credit is consumed by these commands. The audit reconstructs the baseline from the committed source records, rejects provider/model mismatches, and computes token totals and percentiles.

The archive contains 520 successful synthetic inference records, not a 100% correctness score. Eight canonical baseline rows were mislabeled duplicates. The corrected audit recovers their original Fireworks counterparts from the legacy array, keeping raw JSON intact. Full response text exists for 200 benchmark records; telemetry-only records cannot support a new semantic grading claim. Recorded examples provide ten additional inspectable saved responses.

No hardware tests or user-outcome study have been completed. The next validation step is an independently captured low-voltage reference dataset with instrument settings and ground-truth annotations. This is planned work, not a result.
