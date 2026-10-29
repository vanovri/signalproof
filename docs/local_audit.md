# SignalProof — Audit Lokal Muse Spark Open
Tanggal: 2026-10-29T16:32:21.892998+00:00
Model: accounts/fireworks/models/muse-spark-open — max_tokens 2400, temperature 0, timeout 25000 ms
Uji menggunakan server lokal. API key tidak dicatat.

> **Submission tidak diubah.** Dokumen ini mencatat uji lokal. Semua hasil adalah sintetis dari `engine.mjs` demo(), bukan pengujian hardware.

## Ringkasan
- Tes kode: 14/14 lulus
- Tes live sintetis: 8/8 live (healthy, clipping, gaps, flat × en/id)
- Durasi terlama: 24.2s (flat en) — dekat batas 25s, risiko timeout jika reasoning bertambah
- Validasi ID: semua evidenceIds/findingIds adalah subset dari report

## Temuan per Skenario

### healthy — en
- Findings: ['no-flags'] → findingIds ['no-flags'] — ✓ valid
- Evidence: E1=1.6500000000000021V, E2=0.2332380757938118V, E3=0%, E4=1.0156262147297513e-10%, E5=0gaps, E6=3.996s
- Summary (582 char): Low-voltage bench-signal report (engineering prototype, not medical/hardware-control): 1000 samples over 3.996 s at inferred 250.000 Hz (E6) with DC mean 1.65 V (E1) and AC RMS 0.233 V (E2). No configured signal-quality flags triggered (finding no-flags, severity pass) based on: AC RMS (E2), near-rail samples 0% vs 1% threshold (E3), 48–52 Hz band ...
- Uncertainty: Thresholds are heuristics and flags do not establish root cause, which is unknown. Synthetic evaluation does not establish performance on real hardware. No raw data or personal identifiers were provid...
- Cek: status_live=True, mentions_evidence=True, uncertainty=True
- Audit angka: DC mean 1.65V, AC RMS 0.23V, near-rail 0%, band ~0% — semua disebutkan akurat, tidak ada klaim penyebab.

### healthy — id
- Findings: ['no-flags'] → findingIds ['no-flags'] — ✓ valid
- Evidence: E1=1.6500000000000021V, E2=0.2332380757938118V, E3=0%, E4=1.0156262147297513e-10%, E5=0gaps, E6=3.996s
- Summary (884 char): Laporan sinyal bench tegangan rendah ini menunjukkan tidak ada flag kualitas sinyal yang terpicu (findingIds: ["no-flags"], severity: pass). Pengukuran yang dilaporkan: DC mean 1.65 V (E1), AC RMS 0.233 V (E2), sampel near-rail 0% (E3) di bawah ambang flag 1%, pangsa pita 48–52 Hz 1.02e-10% (E4) di bawah ambang 15% (metode FFT 512-titik Hann, resol...
- Uncertainty: Ketidakpastian tinggi: ambang batas bersifat heuristik dan flag tidak menetapkan akar penyebab; evaluasi sintetis tidak menetapkan performa pada perangkat keras nyata (limits). Tidak ada klaim kehilan...
- Cek: status_live=True, mentions_evidence=True, uncertainty=True
- Audit angka: DC mean 1.65V, AC RMS 0.23V, near-rail 0%, band ~0% — semua disebutkan akurat, tidak ada klaim penyebab.

### clipping — en
- Findings: ['clipping'] → findingIds ['clipping'] — ✓ valid
- Evidence: E1=1.649999999999994V, E2=1.3570144405773517V, E3=49.6%, E4=0.00023722552929335744%, E5=0gaps, E6=3.996s
- Summary (731 char): This is an engineering prototype report for low-voltage bench signals only (no medical diagnosis or hardware control). Over a 3.996 s capture of 1000 samples at ~250 Hz (E6), the DC mean was ~1.65 V (E1) with AC RMS ~1.357 V (E2). The report flags one issue: Samples approach the ADC rails (findingId: clipping) because Near-rail samples were 49.6% (...
- Uncertainty: Thresholds are heuristics and flags do not establish root cause, which is unknown. Synthetic evaluation does not establish performance on real hardware. Raw data and personal identifiers were not prov...
- Cek: status_live=True, mentions_evidence=True, uncertainty=True
- Audit angka: Near-rail 49.6% (>1% threshold) — disebutkan tepat, tidak mengklaim penyebab hardware pasti.

### clipping — id
- Findings: ['clipping'] → findingIds ['clipping'] — ✓ valid
- Evidence: E1=1.649999999999994V, E2=1.3570144405773517V, E3=49.6%, E4=0.00023722552929335744%, E5=0gaps, E6=3.996s
- Summary (991 char): Laporan ini adalah evaluasi prototipe rekayasa untuk sinyal bench tegangan rendah, bukan diagnosis medis atau kontrol perangkat keras. Temuan utama adalah clipping (ID: clipping) karena sampel mendekati rel ADC: E3 mencatat 49,6% sampel berada dalam 0,5% dari rel ADC yang dideklarasikan, melebihi ambang flag 1%. Pengukuran lain yang tercatat: E1 DC...
- Uncertainty: Penyebab utama clipping tidak diketahui. Ambang batas heuristik; flag tidak membuktikan penyebab. Evaluasi sintetis tidak membuktikan performa pada perangkat keras nyata. Data mentah dan pengenal prib...
- Cek: status_live=True, mentions_evidence=True, uncertainty=True
- Audit angka: Near-rail 49.6% (>1% threshold) — disebutkan tepat, tidak mengklaim penyebab hardware pasti.

### gaps — en
- Findings: ['timing', 'spectrum-unavailable'] → findingIds ['timing', 'spectrum-unavailable'] — ✓ valid
- Evidence: E1=1.6485408675153814V, E2=0.23337434289036432V, E3=0%, E4=None%, E5=1gaps, E6=3.996s
- Summary (1021 char): Low-voltage bench-signal report (engineering prototype, no medical diagnosis or hardware control): DC mean (E1) 1.6485408675153814 V and AC RMS (E2) 0.23337434289036432 V were calculated from supplied values. Near-rail samples (E3) 0% (threshold 1%). Capture duration (E6) 3.996 s for 970 samples at inferred 250.000 Hz. Observed timing gaps (E5) 1 g...
- Uncertainty: Uncertainty is high for spectral interpretation because timing gaps (E5) triggered withholding of 48-52 Hz band share (E4); thresholds are heuristic and do not establish root cause, which remains unkn...
- Cek: status_live=True, mentions_evidence=True, uncertainty=True
- Audit angka: 1 gap, E4 null/withheld — dijelaskan sebagai spectrum ditahan, tidak mengklaim packet-loss.

### gaps — id
- Findings: ['timing', 'spectrum-unavailable'] → findingIds ['timing', 'spectrum-unavailable'] — ✓ valid
- Evidence: E1=1.6485408675153814V, E2=0.23337434289036432V, E3=0%, E4=None%, E5=1gaps, E6=3.996s
- Summary (880 char): Laporan ini adalah evaluasi prototipe rekayasa untuk sinyal bench tegangan rendah, bukan diagnosis medis atau kontrol perangkat keras. Nilai terukur: DC mean 1,6485 V (E1) dan AC RMS 0,2334 V (E2) dihitung dari nilai yang diberikan; sampel near-rail 0% (E3) di bawah ambang flag 1%. Durasi capture 3,996 s dari 970 sampel dengan sample rate terinfere...
- Uncertainty: Akar penyebab tidak diketahui dan tidak diubah dari temuan. Spektrum ditahan sehingga interpretasi frekuensi tidak dapat dilakukan dari data ini. Data mentah dan pengenal pribadi tidak disediakan; eva...
- Cek: status_live=True, mentions_evidence=True, uncertainty=True
- Audit angka: 1 gap, E4 null/withheld — dijelaskan sebagai spectrum ditahan, tidak mengklaim packet-loss.

### flat — en
- Findings: ['flat'] → findingIds ['flat'] — ✓ valid
- Evidence: E1=1.6500000000000246V, E2=2.4646951146678475e-14V, E3=0%, E4=None%, E5=0gaps, E6=3.996s
- Summary (502 char): Bench-signal report (engineering prototype, no medical diagnosis): DC mean (E1) is 1.65 V. AC RMS (E2) is 2.46e-14 V, flagged as 'Almost no AC variation' (finding 'flat', severity: issue). Near-rail samples (E3) 0% (threshold 1%). 48–52 Hz band share (E4) is null. Timing (E5) shows 0 gaps with 0.000% relative RMS jitter. Capture duration (E6) is 3....
- Uncertainty: Thresholds are heuristics and flags do not establish root cause; root cause is unknown. E4 band share is null as reported. Synthetic evaluation does not establish performance on real hardware. Raw dat...
- Cek: status_live=True, mentions_evidence=True, uncertainty=True
- Audit angka: AC RMS ~2.4e-14V (hampir nol) — disebutkan, E4 null dijelaskan.

### flat — id
- Findings: ['flat'] → findingIds ['flat'] — ✓ valid
- Evidence: E1=1.6500000000000246V, E2=2.4646951146678475e-14V, E3=0%, E4=None%, E5=0gaps, E6=3.996s
- Summary (715 char): Laporan ini adalah evaluasi prototipe rekayasa untuk sinyal bench tegangan rendah (bukan diagnosis medis atau kontrol perangkat keras). Durasi capture 3,996 detik (E6) dengan 1000 sampel pada laju sampel 250,000 Hz (E6) menunjukkan DC mean 1,65 V (E1) dan AC RMS 2,4646951146678475e-14 V (E2) yang mengindikasikan hampir tidak ada variasi AC. Near-ra...
- Uncertainty: Thresholds bersifat heuristik dan flag tidak menetapkan akar penyebab; akar penyebab tidak diketahui. E4 bernilai null sehingga tidak ada klaim tentang porsi daya 48–52 Hz. Evaluasi sintetis tidak men...
- Cek: status_live=True, mentions_evidence=True, uncertainty=True
- Audit angka: AC RMS ~2.4e-14V (hampir nol) — disebutkan, E4 null dijelaskan.


## Analisis Isi vs Validasi ID

Validasi ID saja tidak membuktikan kebenaran kalimat. Audit manual di atas menunjukkan:
- Ringkasan ditinjau terhadap angka dan temuan yang relevan untuk setiap skenario
- Tidak ada yang mengubah findings atau menambah diagnosis medis / mains / confidence palsu
- Frasa "no medical diagnosis / bukan diagnosis medis" adalah disclaimer yang diwajibkan prompt, bukan halusinasi
- Uncertainty selalu ada dan menyebut "root cause unknown / akar penyebab tidak diketahui" dan "synthetic / prototipe"

## Risiko & Batasan

- **Timeout:** flat en 24.2s (96.8% dari 25s). Jika reasoning >1700 token, bisa `Model output was incomplete` atau timeout. Mitigasi: sudah naik ke 2400; jika masih length, naik ke 2600 atau perpendek prompt.
- **Sintetis vs Hardware:** 15 skenario sintetis + 8 live sintetis hanya membuktikan logika flags dan format JSON, bukan akurasi sensor nyata. Hardware belum diuji (lihat `docs/evaluation.json` liveModelEvaluated:false, hardwareEvaluated:false).
- **Keacakan:** Model deterministik via temperature 0, tapi Fireworks bisa variasi kecil. Perlu re-test berkala.

## File Bukti
- `docs/local_live_matrix.json` — status, token, durasi (tanpa summary)
- `C:\tmp\audit_accum.jsonl` — summary & uncertainty lengkap untuk audit lokal (tidak di-commit jika sensitif)
