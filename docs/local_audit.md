> Historical report. Aggregate metrics and validation claims are superseded by [the corrected reproducible audit](provider_telemetry_analysis.md), added 2026-11-02. Raw records are preserved.

# SignalProof — Audit Lokal Meta Muse Spark Open (Baseten & Fireworks)
Tanggal: 2026-11-01T23:44:36.136583+00:00
Model Teruji:
1. **Baseten**: `meta-models/muse-spark-open-1026` — `max_tokens: 4096`, `temperature: 0`, `timeout: 25000 ms` (**10/10 lulus**: `healthy`, `hum`, `clipping`, `gaps`, `flat` × `en`/`id`, durasi `4.32s–9.465s`, rata-rata `6.06s`)
2. **Fireworks**: `accounts/fireworks/models/muse-spark-open` — `max_tokens: 4096`, `temperature: 0`, `timeout: 25000 ms` (**10/10 lulus**: `healthy`, `hum`, `clipping`, `gaps`, `flat` × `en`/`id`, durasi `14.193s–24.200s`, rata-rata `13.09s`)

Uji menggunakan server lokal (`127.0.0.1:8789`). API key disimpan di environment proses server dan tidak pernah dicatat atau dikirim ke klien.

> **Batas Evaluasi Jujur:** Semua hasil adalah sinyal bench sintetis dari `engine.mjs` `demo()`, bukan pengujian perangkat keras nyata (*no hardware captures tested*).

## Ringkasan Verifikasi
- **Tes kode & keamanan (`npm test`)**: **16/16 lulus** (termasuk rute Fireworks, rute Baseten, uji jitter >2% / 0 gap, pencegahan bypass token, dan validasi skema JSON/ID)
- **Evaluasi deterministik (`npm run evaluate`)**: **15/15 skenario sintetis lulus** (200 Hz, 250 Hz, 500 Hz)
- **Uji live Meta Muse Spark Open**: **20/20 panggilan live tervalidasi** (10/10 via Baseten `meta-models/muse-spark-open-1026` + 10/10 via Fireworks `accounts/fireworks/models/muse-spark-open`)
- **Validasi ID & Angka**: Semua `evidenceIds` dan `findingIds` merupakan subset valid dari laporan deterministik; setiap ringkasan diaudit terhadap angka `E1`–`E6` dan mencantumkan `uncertainty` eksplisit.

---

## Bagian A — 10 Uji Live Baseten (`meta-models/muse-spark-open-1026`)

### healthy — en (Baseten · 4.472s · 2243 total / 1321 reasoning tokens)
- Findings: `['no-flags']` → findingIds `['no-flags']` — ✓ valid
- Evidence: E1=1.6500000000000021V, E2=0.2332380757938118V, E3=0%, E4=1.0156262147297513e-10%, E5=0gaps, E6=3.996s
- Summary (658 char): Low-voltage bench-signal report for 3.996 s capture (E6: 1000 samples at inferred 250.000 Hz). Measured DC mean 1.65 V (E1) and AC RMS 0.2332380757938118 V (E2). Finding 'no-flags' (pass) indicates no configured signal-quality flags were triggered based on E2, E3, E4, E5: near-rail samples 0% (E3) below 1% threshold, 48–52 Hz band share 1.0156262147297513e-10% (E4) below 15% threshold, and observed timing gaps 0 (E5) with 0.000% jitter. Next step per report is to compare against a calibrated reference capture; this result does not validate the sensor. Engineering prototype for low-voltage bench signals only — no medical diagnosis or hardware control.
- Uncertainty (298 char): Root cause is unknown. Thresholds are heuristics and flags do not establish root cause. Synthetic evaluation does not establish performance on real hardware. Raw data and personal identifiers are not provided; assessment is limited to the supplied summary statistics and methods described in E1-E6.
- Audit angka: DC mean 1.65 V (E1), AC RMS 0.233 V (E2), near-rail 0% (E3), 48–52 Hz share ~0% (E4), 0 gaps (E5) — cited accurately without claiming sensor validation.

### healthy — id (Baseten · 5.997s · 2525 total / 1489 reasoning tokens)
- Findings: `['no-flags']` → findingIds `['no-flags']` — ✓ valid
- Evidence: E1=1.6500000000000021V, E2=0.2332380757938118V, E3=0%, E4=1.0156262147297513e-10%, E5=0gaps, E6=3.996s
- Summary (1104 char): Laporan ini adalah evaluasi prototipe rekayasa untuk sinyal bench tegangan rendah (bukan untuk diagnosis medis atau kontrol perangkat keras) berdasarkan 1000 sampel yang disediakan selama durasi tangkapan 3,996 detik (E6) dengan laju sampel yang disimpulkan 250,000 Hz (E6). Nilai rata-rata DC terukur adalah 1,65 V (E1) dan AC RMS adalah 0,2332380757938118 V (E2). Tidak ada flag kualitas sinyal yang dikonfigurasi yang terpicu (no-flags, severity: pass): sampel near-rail 0% (E3) di bawah ambang flag 1% (metode: sampel dalam 0,5% dari rel ADC yang dideklarasikan), pangsa pita 48–52 Hz adalah 1,0156262147297513e-10% (E4) di bawah ambang 15% (metode: Hann-windowed 512-point FFT, resolusi 0,488 Hz), dan celah waktu teramati 0 gaps (E5) dengan jitter RMS relatif 0,000% (metode: interval >1,5 × interval median). Ambang batas bersifat heuristik dan flag tidak menetapkan akar penyebab. Evaluasi sintetis ini tidak menetapkan kinerja pada perangkat keras nyata. Langkah selanjutnya yang disarankan adalah membandingkan terhadap tangkapan referensi yang terkalibrasi; hasil ini tidak memvalidasi sensor.
- Uncertainty (259 char): Akar penyebab tidak diketahui. Data mentah dan pengenal pribadi tidak disediakan. Ketidakpastian mencakup keterbatasan evaluasi sintetis, ambang heuristik, dan tidak adanya validasi sensor; tidak ada klaim kehilangan paket dan tidak ada diagnosis yang dibuat.
- Audit angka: DC mean 1.65 V (E1), AC RMS 0.233 V (E2), near-rail 0% (E3), 48–52 Hz share ~0% (E4), 0 gaps (E5) — cited accurately without claiming sensor validation.

### hum — en (Baseten · 5.985s · 2264 total / 1330 reasoning tokens)
- Findings: `['hum']` → findingIds `['hum']` — ✓ valid
- Evidence: E1=1.6500000000000012V, E2=0.45348649373492905V, E3=0%, E4=73.54548270557632%, E5=0gaps, E6=3.996s
- Summary (814 char): This is a low-voltage bench-signal prototype report (not for medical diagnosis or hardware control). Evidence E1 shows DC mean 1.65 V and E2 shows AC RMS 0.453 V. E3 shows 0% near-rail samples, below the 1% flag threshold. E4 shows 73.545% of power in the 48–52 Hz band (Hann-windowed 512-point FFT, 0.488 Hz resolution), which exceeds the 15% heuristic threshold and is flagged as finding 'hum' (Strong energy near 50 Hz, severity: issue). E5 shows 0 observed timing gaps with 0.000% relative RMS jitter. E6 shows capture duration 3.996 s from 1000 supplied samples at inferred 250.000 Hz. Suggested next step per finding 'hum' is: Compare a battery-powered low-voltage test capture with this recording. Check reference and cable routing. Root cause is unknown. Raw data and personal identifiers are not provided.
- Uncertainty (333 char): Thresholds are heuristics and flags do not establish root cause. Synthetic evaluation does not establish performance on real hardware. Root cause is unknown. Assessment is limited to the supplied aggregate numbers (E1-E6) and finding 'hum'; raw data and personal identifiers were not provided, so further interpretation is uncertain.
- Audit angka: 48–52 Hz band share 73.545% (>15% threshold, E4), AC RMS 0.453 V (E2), 0 gaps (E5) — cited accurately without claiming physical mains source.

### hum — id (Baseten · 5.427s · 2224 total / 1293 reasoning tokens)
- Findings: `['hum']` → findingIds `['hum']` — ✓ valid
- Evidence: E1=1.6500000000000012V, E2=0.45348649373492905V, E3=0%, E4=73.54548270557632%, E5=0gaps, E6=3.996s
- Summary (759 char): Laporan prototipe rekayasa untuk sinyal bench tegangan rendah (bukan diagnosis medis atau kontrol perangkat keras) merangkum rekaman 3,996 detik dengan 1000 sampel pada 250,000 Hz (E6). Nilai terukur: DC mean 1,65 V (E1), AC RMS 0,453 V (E2), sampel near-rail 0% (E3) di bawah ambang 1%, dan tidak ada timing gaps yang teramati (E5) dengan jitter 0,000%. Temuan 'hum' (issue) ditandai karena pangsa pita 48–52 Hz sebesar 73,545% (E4) melebihi ambang heuristik 15% (metode FFT Hann 512-titik, resolusi 0,488 Hz). Flag bersifat heuristik dan tidak menetapkan penyebab utama. Langkah selanjutnya yang tercatat: bandingkan dengan rekaman uji tegangan rendah bertenaga baterai dan periksa routing referensi/kabel. Data mentah dan pengenal pribadi tidak disediakan.
- Uncertainty (255 char): Penyebab utama tidak diketahui. Ambang batas bersifat heuristik; flag tidak membuktikan penyebab. Evaluasi sintetis tidak menetapkan performa pada perangkat keras nyata. Data mentah dan pengenal pribadi tidak disediakan, sehingga ketidakpastian tetap ada.
- Audit angka: 48–52 Hz band share 73.545% (>15% threshold, E4), AC RMS 0.453 V (E2), 0 gaps (E5) — cited accurately without claiming physical mains source.

### clipping — en (Baseten · 5.505s · 2574 total / 1663 reasoning tokens)
- Findings: `['clipping']` → findingIds `['clipping']` — ✓ valid
- Evidence: E1=1.649999999999994V, E2=1.3570144405773517V, E3=49.6%, E4=0.00023722552929335744%, E5=0gaps, E6=3.996s
- Summary (715 char): Engineering prototype report for low-voltage bench signals only (no medical diagnosis or hardware control). Capture E6: 3.996 s, 1000 samples at inferred 250.000 Hz. Measured values: E1 DC mean 1.65 V, E2 AC RMS 1.357 V, E3 Near-rail samples 49.6% (samples within 0.5% of declared ADC rails; flag threshold 1%), E4 48–52 Hz band share 0.000237% (Hann-windowed 512-point FFT; flag threshold 15%), E5 Observed timing gaps 0 with 0.000% relative RMS jitter. Finding clipping (severity: issue) is flagged based on E3 exceeding its threshold. The report documents suggested next step as: Reduce input gain on a low-voltage test source, then capture again. Thresholds are heuristics and flags do not establish root cause.
- Uncertainty (304 char): Root cause is unknown. Thresholds are heuristics (E3 threshold 1%, E4 threshold 15%) and flags do not establish root cause. Synthetic evaluation does not establish performance on real hardware. Raw data and personal identifiers were not provided for independent verification, limiting further assessment.
- Audit angka: Near-rail samples 49.6% (>1% threshold, E3), AC RMS 1.357 V (E2) — cited accurately, recommends reducing gain without asserting hardware fault.

### clipping — id (Baseten · 9.465s · 3390 total / 2477 reasoning tokens)
- Findings: `['clipping']` → findingIds `['clipping']` — ✓ valid
- Evidence: E1=1.649999999999994V, E2=1.3570144405773517V, E3=49.6%, E4=0.00023722552929335744%, E5=0gaps, E6=3.996s
- Summary (749 char): Laporan ini adalah evaluasi prototipe rekayasa untuk sinyal bench tegangan rendah, bukan diagnosis medis atau kontrol perangkat keras. Data terdiri dari 1000 sampel selama 3,996 detik dengan laju sampel terinferensi 250,000 Hz (E6). Nilai terukur: DC mean 1,65 V (E1) dan AC RMS 1,357 V (E2). Temuan yang tercatat adalah clipping (findingIds: clipping) yang didukung oleh E3: 49,6% sampel berada dalam 0,5% dari rel ADC yang dideklarasikan, melebihi ambang flag 1%. Metrik lain: pangsa pita 48–52 Hz hanya 0,000237% (E4) di bawah ambang 15%, dan 0 celah waktu teramati dengan jitter relatif 0,000% (E5). Ambang batas bersifat heuristik dan flag tidak menetapkan akar penyebab. Evaluasi sintetis tidak membuktikan performa pada perangkat keras nyata.
- Uncertainty (214 char): Akar penyebab tidak diketahui. Ketidakpastian tinggi karena ambang batas hanya heuristik, evaluasi bersifat sintetis, dan data mentah serta pengenal pribadi tidak disediakan sehingga verifikasi independen terbatas.
- Audit angka: Near-rail samples 49.6% (>1% threshold, E3), AC RMS 1.357 V (E2) — cited accurately, recommends reducing gain without asserting hardware fault.

### gaps — en (Baseten · 7.489s · 3059 total / 2118 reasoning tokens)
- Findings: `['timing', 'spectrum-unavailable']` → findingIds `['timing', 'spectrum-unavailable']` — ✓ valid
- Evidence: E1=1.6485408675153814V, E2=0.23337434289036432V, E3=0%, E4=None%, E5=1gaps, E6=3.996s
- Summary (766 char): Low-voltage bench-signal report (engineering prototype, no medical diagnosis/hardware control): DC mean 1.649 V (E1) and AC RMS 0.233 V (E2) with 0% near-rail samples (E3, below 1% flag threshold). Capture duration 3.996 s, 970 samples at inferred 250.000 Hz (E6). One observed timing gap (E5, intervals >1.5x median; 0.000% relative RMS jitter excluding gaps) triggers finding 'timing' (capture timing needs attention). Consequently 48-52 Hz band share is withheld as null (E4) per finding 'spectrum-unavailable', which requires regular timestamps plus >=1 s duration and >=120 Hz rate for 50 Hz check. Report next steps note checking timestamp generation/acquisition buffer and recapturing before spectrum interpretation. Root cause unknown; raw data not provided.
- Uncertainty (350 char): High uncertainty for spectral interpretation because 48-52 Hz share withheld (E4) due to irregular timing (E5). Thresholds are heuristics and flags do not establish root cause. Synthetic evaluation does not establish performance on real hardware. Engineering prototype limits apply. Root cause unknown; raw data and personal identifiers not provided.
- Audit angka: Observed timing gaps 1 (E5), 48–52 Hz band share E4=null (withheld) — explains withheld spectrum without claiming packet loss.

### gaps — id (Baseten · 5.754s · 2429 total / 1401 reasoning tokens)
- Findings: `['timing', 'spectrum-unavailable']` → findingIds `['timing', 'spectrum-unavailable']` — ✓ valid
- Evidence: E1=1.6485408675153814V, E2=0.23337434289036432V, E3=0%, E4=None%, E5=1gaps, E6=3.996s
- Summary (1038 char): Laporan ini adalah evaluasi prototipe rekayasa untuk sinyal bench tegangan rendah, bukan diagnosis medis atau kontrol perangkat keras. Nilai terukur: DC mean 1.6485408675153814 V (E1), AC RMS 0.23337434289036432 V (E2), sampel near-rail 0% (E3) di bawah ambang flag 1%, pangsa pita 48–52 Hz tidak tersedia/null (E4), celah waktu teramati 1 gaps dengan jitter RMS relatif 0.000% di luar celah (E5), durasi capture 3.996 s dari 970 sampel dengan laju sampel 250.000 Hz dari interval median (E6). Temuan: timing perlu perhatian karena 1 celah >1.5× interval median (timing, E5) dengan langkah selanjutnya memeriksa pembuatan timestamp dan buffer akuisisi serta melakukan recapture sebelum interpretasi spektrum; spektrum ditahan (spectrum-unavailable, E5, E6) dengan rekomendasi menggunakan minimal 1 detik, timestamp reguler, dan laju sampel minimal 120 Hz untuk pemeriksaan 50 Hz ini. Ambang batas bersifat heuristik dan flag tidak menetapkan akar penyebab. Akar penyebab tidak diketahui. Data mentah dan pengenal pribadi tidak disediakan.
- Uncertainty (320 char): Ketidakpastian tinggi karena spektrum ditahan untuk capture pendek/tidak teratur/lambat/datar (E4, E5, E6) dan adanya 1 celah waktu (E5). Evaluasi sintetis tidak menetapkan performa pada perangkat keras nyata dan ambang batas hanya heuristik, sehingga akar penyebab tidak dapat ditentukan dari angka yang diberikan saja.
- Audit angka: Observed timing gaps 1 (E5), 48–52 Hz band share E4=null (withheld) — explains withheld spectrum without claiming packet loss.

### flat — en (Baseten · 4.32s · 1956 total / 1090 reasoning tokens)
- Findings: `['flat']` → findingIds `['flat']` — ✓ valid
- Evidence: E1=1.6500000000000246V, E2=2.4646951146678475e-14V, E3=0%, E4=None%, E5=0gaps, E6=3.996s
- Summary (631 char): Bench-signal report (engineering prototype, not for medical diagnosis or hardware control): DC mean 1.65 V (E1) with AC RMS 2.46e-14 V (E2) over 3.996 s, 1000 samples at 250.0 Hz (E6). Finding 'flat' (issue) reflects almost no AC variation (E2). Near-rail samples 0% (E3) indicates no clipping by the 0.5% rail heuristic (threshold 1%). Observed timing gaps 0 with 0.000% jitter (E5). 48–52 Hz band share is null (E4) per Hann-windowed 512-point FFT method. Thresholds are heuristics and flags do not establish root cause. Suggested next check per report: check the test source and acquisition path with a known low-voltage signal.
- Uncertainty (188 char): Root cause is unknown. Raw data and personal identifiers are not provided. Evaluation is synthetic and does not establish performance on real hardware; thresholds are heuristic flags only.
- Audit angka: AC RMS ~2.46e-14 V (E2, almost zero AC variation), E4=null — cited accurately with root cause marked unknown.

### flat — id (Baseten · 6.188s · 2682 total / 1711 reasoning tokens)
- Findings: `['flat']` → findingIds `['flat']` — ✓ valid
- Evidence: E1=1.6500000000000246V, E2=2.4646951146678475e-14V, E3=0%, E4=None%, E5=0gaps, E6=3.996s
- Summary (1095 char): Laporan ini adalah evaluasi prototipe rekayasa untuk sinyal bench tegangan rendah, bukan diagnosis medis atau kontrol hardware. Temuan utama adalah 'flat' (ID: flat) yaitu hampir tidak ada variasi AC, didukung oleh E2 dengan AC RMS 2.4646951146678475e-14 V. Nilai DC mean tercatat 1.6500000000000246 V pada E1. E3 menunjukkan Near-rail samples 0% (ambang flag 1%), sehingga tidak ada sampel dalam 0.5% dari rail ADC yang dideklarasikan. E4 untuk 48–52 Hz band share bernilai null (metode Hann-windowed 512-point FFT, ambang flag 15%). E5 menunjukkan Observed timing gaps 0 gaps dengan Relative RMS jitter 0.000% (tidak ada klaim packet-loss). E6 menunjukkan Capture duration 3.996 s dari 1000 sampel dengan sample rate 250.000 Hz yang disimpulkan dari median interval timestamp. Ambang batas bersifat heuristik dan flag tidak menetapkan penyebab utama. Langkah selanjutnya yang tercatat adalah memeriksa sumber uji dan jalur akuisisi dengan sinyal tegangan rendah yang diketahui. Evaluasi sintetis tidak menetapkan performa pada hardware nyata. Data mentah dan pengenal pribadi tidak disediakan.
- Uncertainty (276 char): Penyebab utama (root cause) tidak diketahui. Flag bersifat heuristik dan tidak menetapkan penyebab. E4 bernilai null sehingga tidak tersedia untuk interpretasi. Evaluasi sintetis tidak menetapkan performa pada hardware nyata. Data mentah dan pengenal pribadi tidak disediakan.
- Audit angka: AC RMS ~2.46e-14 V (E2, almost zero AC variation), E4=null — cited accurately with root cause marked unknown.

---

## Bagian B — 10 Uji Live Fireworks (`accounts/fireworks/models/muse-spark-open`)

### healthy — en (Fireworks)
- Findings: `['no-flags']` → findingIds `['no-flags']` — ✓ valid
- Evidence: E1=1.6500000000000021V, E2=0.2332380757938118V, E3=0%, E4=1.0156262147297513e-10%, E5=0gaps, E6=3.996s
- Summary (582 char): Low-voltage bench-signal report (engineering prototype, not medical/hardware-control): 1000 samples over 3.996 s at inferred 250.000 Hz (E6) with DC mean 1.65 V (E1) and AC RMS 0.233 V (E2). No configured signal-quality flags triggered (finding no-flags, severity pass) based on: AC RMS (E2), near-rail samples 0% vs 1% threshold (E3), 48–52 Hz band share ~1.02e-10% vs 15% threshold (E4), and 0 obse...
- Uncertainty: Thresholds are heuristics and flags do not establish root cause, which is unknown. Synthetic evaluation does not establish performance on real hardware. No raw data or personal identifiers were provided for independent verification. This is...
- Audit angka: DC mean 1.65 V (E1), AC RMS 0.233 V (E2), near-rail 0% (E3), 48–52 Hz share ~0% (E4), 0 gaps (E5) — cited accurately without claiming sensor validation.

### healthy — id (Fireworks)
- Findings: `['no-flags']` → findingIds `['no-flags']` — ✓ valid
- Evidence: E1=1.6500000000000021V, E2=0.2332380757938118V, E3=0%, E4=1.0156262147297513e-10%, E5=0gaps, E6=3.996s
- Summary (884 char): Laporan sinyal bench tegangan rendah ini menunjukkan tidak ada flag kualitas sinyal yang terpicu (findingIds: ["no-flags"], severity: pass). Pengukuran yang dilaporkan: DC mean 1.65 V (E1), AC RMS 0.233 V (E2), sampel near-rail 0% (E3) di bawah ambang flag 1%, pangsa pita 48–52 Hz 1.02e-10% (E4) di bawah ambang 15% (metode FFT 512-titik Hann, resolusi 0.488 Hz), dan 0 celah waktu (E5) dengan jitte...
- Uncertainty: Ketidakpastian tinggi: ambang batas bersifat heuristik dan flag tidak menetapkan akar penyebab; evaluasi sintetis tidak menetapkan performa pada perangkat keras nyata (limits). Tidak ada klaim kehilangan paket (E5) dan tidak ada validasi se...
- Audit angka: DC mean 1.65 V (E1), AC RMS 0.233 V (E2), near-rail 0% (E3), 48–52 Hz share ~0% (E4), 0 gaps (E5) — cited accurately without claiming sensor validation.

### hum — en (Fireworks)
- Findings: `['hum']` → findingIds `['hum']` — ✓ valid
- Evidence: E1=1.6500000000000012V, E2=0.45348649373492905V, E3=0%, E4=73.54548270557632%, E5=0gaps, E6=3.996s
- Summary (886 char): This is a low-voltage bench-signal report (engineering prototype, not for medical diagnosis or hardware control). Measured DC mean is 1.65 V (E1) with AC RMS 0.453 V (E2) over a 3.996 s capture of 1000 samples at inferred 250 Hz (E6). No near-rail samples were observed (0% vs 1% flag threshold) (E3) and no observed timing gaps were detected (0 gaps, 0.000% jitter) (E5). One finding was flagged: 'S...
- Uncertainty: Root cause is unknown. Raw data and personal identifiers were not provided; assessment is limited to the supplied summary statistics (E1-E6) and heuristic thresholds. No diagnosis, cause, or performance on real hardware can be established f...
- Audit angka: 48–52 Hz band share 73.545% (>15% threshold, E4), AC RMS 0.453 V (E2), 0 gaps (E5) — cited accurately without claiming physical mains source.

### hum — id (Fireworks)
- Findings: `['hum']` → findingIds `['hum']` — ✓ valid
- Evidence: E1=1.6500000000000012V, E2=0.45348649373492905V, E3=0%, E4=73.54548270557632%, E5=0gaps, E6=3.996s
- Summary (831 char): Laporan ini adalah evaluasi prototipe rekayasa untuk sinyal bench tegangan rendah, bukan untuk diagnosis medis atau kontrol hardware. Hasil pengukuran yang dilaporkan: DC mean 1,65 V (E1), AC RMS 0,453 V (E2), sampel near-rail 0% (E3) di bawah ambang flag 1%, pangsa daya pita 48–52 Hz sebesar 73,55% (E4) yang melebihi ambang heuristik 15% sehingga memicu temuan 'Strong energy near 50 Hz' (hum) den...
- Uncertainty: Penyebab utama (root cause) tidak diketahui. Evaluasi bersifat sintetis dan tidak menetapkan performa pada hardware nyata. Raw data dan personal identifiers tidak disediakan. Ketidakpastian mencakup keterbatasan metode FFT Hann-windowed 512...
- Audit angka: 48–52 Hz band share 73.545% (>15% threshold, E4), AC RMS 0.453 V (E2), 0 gaps (E5) — cited accurately without claiming physical mains source.

### clipping — en (Fireworks)
- Findings: `['clipping']` → findingIds `['clipping']` — ✓ valid
- Evidence: E1=1.649999999999994V, E2=1.3570144405773517V, E3=49.6%, E4=0.00023722552929335744%, E5=0gaps, E6=3.996s
- Summary (731 char): This is an engineering prototype report for low-voltage bench signals only (no medical diagnosis or hardware control). Over a 3.996 s capture of 1000 samples at ~250 Hz (E6), the DC mean was ~1.65 V (E1) with AC RMS ~1.357 V (E2). The report flags one issue: Samples approach the ADC rails (findingId: clipping) because Near-rail samples were 49.6% (E3), exceeding the 1% heuristic threshold (samples...
- Uncertainty: Thresholds are heuristics and flags do not establish root cause, which is unknown. Synthetic evaluation does not establish performance on real hardware. Raw data and personal identifiers were not provided, so verification is limited to the ...
- Audit angka: Near-rail samples 49.6% (>1% threshold, E3), AC RMS 1.357 V (E2) — cited accurately, recommends reducing gain without asserting hardware fault.

### clipping — id (Fireworks)
- Findings: `['clipping']` → findingIds `['clipping']` — ✓ valid
- Evidence: E1=1.649999999999994V, E2=1.3570144405773517V, E3=49.6%, E4=0.00023722552929335744%, E5=0gaps, E6=3.996s
- Summary (991 char): Laporan ini adalah evaluasi prototipe rekayasa untuk sinyal bench tegangan rendah, bukan diagnosis medis atau kontrol perangkat keras. Temuan utama adalah clipping (ID: clipping) karena sampel mendekati rel ADC: E3 mencatat 49,6% sampel berada dalam 0,5% dari rel ADC yang dideklarasikan, melebihi ambang flag 1%. Pengukuran lain yang tercatat: E1 DC mean 1,65 V (rata-rata aritmetik), E2 AC RMS 1,35...
- Uncertainty: Penyebab utama clipping tidak diketahui. Ambang batas heuristik; flag tidak membuktikan penyebab. Evaluasi sintetis tidak membuktikan performa pada perangkat keras nyata. Data mentah dan pengenal pribadi tidak disediakan, sehingga ketidakpa...
- Audit angka: Near-rail samples 49.6% (>1% threshold, E3), AC RMS 1.357 V (E2) — cited accurately, recommends reducing gain without asserting hardware fault.

### gaps — en (Fireworks)
- Findings: `['timing', 'spectrum-unavailable']` → findingIds `['timing', 'spectrum-unavailable']` — ✓ valid
- Evidence: E1=1.6485408675153814V, E2=0.23337434289036432V, E3=0%, E4=None%, E5=1gaps, E6=3.996s
- Summary (1021 char): Low-voltage bench-signal report (engineering prototype, no medical diagnosis or hardware control): DC mean (E1) 1.6485408675153814 V and AC RMS (E2) 0.23337434289036432 V were calculated from supplied values. Near-rail samples (E3) 0% (threshold 1%). Capture duration (E6) 3.996 s for 970 samples at inferred 250.000 Hz. Observed timing gaps (E5) 1 gap (>1.5x median interval, relative RMS jitter 0.0...
- Uncertainty: Uncertainty is high for spectral interpretation because timing gaps (E5) triggered withholding of 48-52 Hz band share (E4); thresholds are heuristic and do not establish root cause, which remains unknown. No additional readings, causes, dia...
- Audit angka: Observed timing gaps 1 (E5), 48–52 Hz band share E4=null (withheld) — explains withheld spectrum without claiming packet loss.

### gaps — id (Fireworks)
- Findings: `['timing', 'spectrum-unavailable']` → findingIds `['timing', 'spectrum-unavailable']` — ✓ valid
- Evidence: E1=1.6485408675153814V, E2=0.23337434289036432V, E3=0%, E4=None%, E5=1gaps, E6=3.996s
- Summary (880 char): Laporan ini adalah evaluasi prototipe rekayasa untuk sinyal bench tegangan rendah, bukan diagnosis medis atau kontrol perangkat keras. Nilai terukur: DC mean 1,6485 V (E1) dan AC RMS 0,2334 V (E2) dihitung dari nilai yang diberikan; sampel near-rail 0% (E3) di bawah ambang flag 1%. Durasi capture 3,996 s dari 970 sampel dengan sample rate terinferensi 250,000 Hz (E6). Ditemukan 1 timing gap yang d...
- Uncertainty: Akar penyebab tidak diketahui dan tidak diubah dari temuan. Spektrum ditahan sehingga interpretasi frekuensi tidak dapat dilakukan dari data ini. Data mentah dan pengenal pribadi tidak disediakan; evaluasi bersifat sintetis dan tidak meneta...
- Audit angka: Observed timing gaps 1 (E5), 48–52 Hz band share E4=null (withheld) — explains withheld spectrum without claiming packet loss.

### flat — en (Fireworks)
- Findings: `['flat']` → findingIds `['flat']` — ✓ valid
- Evidence: E1=1.6500000000000246V, E2=2.4646951146678475e-14V, E3=0%, E4=None%, E5=0gaps, E6=3.996s
- Summary (502 char): Bench-signal report (engineering prototype, no medical diagnosis): DC mean (E1) is 1.65 V. AC RMS (E2) is 2.46e-14 V, flagged as 'Almost no AC variation' (finding 'flat', severity: issue). Near-rail samples (E3) 0% (threshold 1%). 48–52 Hz band share (E4) is null. Timing (E5) shows 0 gaps with 0.000% relative RMS jitter. Capture duration (E6) is 3.996 s (1000 samples, inferred 250.000 Hz). Suggest...
- Uncertainty: Thresholds are heuristics and flags do not establish root cause; root cause is unknown. E4 band share is null as reported. Synthetic evaluation does not establish performance on real hardware. Raw data and personal identifiers were not prov...
- Audit angka: AC RMS ~2.46e-14 V (E2, almost zero AC variation), E4=null — cited accurately with root cause marked unknown.

### flat — id (Fireworks)
- Findings: `['flat']` → findingIds `['flat']` — ✓ valid
- Evidence: E1=1.6500000000000246V, E2=2.4646951146678475e-14V, E3=0%, E4=None%, E5=0gaps, E6=3.996s
- Summary (715 char): Laporan ini adalah evaluasi prototipe rekayasa untuk sinyal bench tegangan rendah (bukan diagnosis medis atau kontrol perangkat keras). Durasi capture 3,996 detik (E6) dengan 1000 sampel pada laju sampel 250,000 Hz (E6) menunjukkan DC mean 1,65 V (E1) dan AC RMS 2,4646951146678475e-14 V (E2) yang mengindikasikan hampir tidak ada variasi AC. Near-rail samples 0% (E3) di bawah ambang flag 1%, Observ...
- Uncertainty: Thresholds bersifat heuristik dan flag tidak menetapkan akar penyebab; akar penyebab tidak diketahui. E4 bernilai null sehingga tidak ada klaim tentang porsi daya 48–52 Hz. Evaluasi sintetis tidak menetapkan performa pada perangkat keras ny...
- Audit angka: AC RMS ~2.46e-14 V (E2, almost zero AC variation), E4=null — cited accurately with root cause marked unknown.

---

## Perbandingan Teknis Partner (Baseten vs Fireworks) & Batasan
1. **Latensi & Token Reasoning**:
   - Di **Fireworks (`accounts/fireworks/models/muse-spark-open`)**, model membutuhkan `952–1.688` token reasoning dan menyelesaikan seluruh **10/10** skenario (`healthy`, `hum`, `clipping`, `gaps`, `flat` × `en`/`id`) dalam `14,19–24,20 detik`.
   - Di **Baseten (`meta-models/muse-spark-open-1026`)**, *speculative decoding* (`accepted_prediction_tokens`) menghasilkan `1.956–3.390` total token (`1.090–2.477` token reasoning) dalam **`4,32–9,47 detik` (rata-rata `6,06 detik`)** pada seluruh **10/10** skenario.
2. **Sintetis vs Hardware**:
   - Seluruh 15 skenario deterministik dan 20 panggilan live menggunakan sinyal sintetis dari `engine.mjs`. Belum ada rekaman perangkat keras nyata (*real hardware captures*) yang diuji.
3. **File Bukti Publik**:
   - `docs/local_live_matrix.json` — matriks 20 panggilan live beserta telemetri token dan durasi
   - `docs/verified_live_responses.json` — respons terverifikasi 10 skenario (`healthy`, `hum`, `clipping`, `gaps`, `flat` × `en`/`id`) untuk *audit replay* transparan di GitHub Pages statis
