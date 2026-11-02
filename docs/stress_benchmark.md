# Live Stress, Sweep & Monte Carlo Benchmark — Meta Muse Spark Open (520/520 Verified Calls)

- **Timestamp (UTC)**: `2026-11-02T01:39:17.282116+00:00`
- **Total Verified Live Model Calls**: **`520 / 520` (`100%` pass rate)**
- **Total Live Benchmark Tokens Burned**: **`1,315,835` tokens** (`820,229` internal reasoning tokens)
- **Cline Agentic Coding & Auditing Sessions (Baseten `meta-models/muse-spark-open-1026`)**: **`21,776,319` tokens** (`21,637,531` input tokens + `138,788` output tokens across 4 autonomous engineering sessions that built `cli.mjs` and expanded `tests/engine.test.mjs` to `25/25` unit tests)
- **Providers Benchmarked**:
  1. **Baseten (`meta-models/muse-spark-open-1026`)**: **`410 / 410` passed** (`1,091,580` total benchmark tokens, `699,194` reasoning tokens, `610,559` accepted speculative prediction tokens, latency `3.55s–13.05s`, mean `6.90s`)
  2. **Fireworks (`accounts/fireworks/models/muse-spark-open`)**: **`110 / 110` passed** (`224,255` total benchmark tokens, `121,035` reasoning tokens, latency `4.32s–24.55s`, mean `13.83s`)
- **Honesty & Scope Boundary**: All 520 live model calls evaluate synthetic bench signals generated deterministically by `engine.mjs` (`hardwareEvaluated: false`).

---

## 1. Benchmark Suite Breakdown (520 Live Calls)

| Suite | Scenarios × Langs | Baseten (`meta-models/muse-spark-open-1026`) | Fireworks (`accounts/fireworks/models/muse-spark-open`) | Total Calls | Key Guardrail Verified |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Baseline Preset Audit** (`docs/local_live_matrix.json`) | `5 × 2` | `10 / 10` (`25,346` tok) | `10 / 10` (`24,723` tok) | **20 / 20** | 5 core presets (`healthy`, `hum`, `clipping`, `gaps`, `flat`) in `en` & `id` |
| **Multi-Rate Evaluation Matrix** (`multi-rate-matrix`) | `15 × 2` | `30 / 30` | `30 / 30` | **60 / 60** | `200 Hz`, `250 Hz`, `500 Hz` rate invariance across all 5 fault classes |
| **Boundary & Multi-Fault Stress** (`boundary-stress`) | `15 × 2` | `30 / 30` | `30 / 30` | **60 / 60** | Exact threshold boundaries (`14.2%` vs `15.8%` hum, `0.9%` vs `1.2%` clip, `jitter > 2%` with 0 gaps, `5V`/`±2.5V` rails, multi-faults) |
| **50 Hz SNR & Amplitude Sweep** (`snr-50hz-sweep`) | `6 × 2` | `12 / 12` | `12 / 12` | **24 / 24** | Monotonic `E4` band-share transition across `0.02V–0.85V` 50 Hz interference on `0.30V` carrier |
| **ADC Bit-Depth Quantization Sweep** (`adc-quantization-sweep`) | `8 × 2` | `16 / 16` | `16 / 16` | **32 / 32** | `6-bit`, `8-bit`, `10-bit`, `12-bit` step quantization noise on clean and 50 Hz hum signals |
| **Acquisition & Low-Power Rail Stress** (`acquisition-stress`) | `6 × 2` | `12 / 12` | `12 / 12` | **24 / 24** | 3-gap dropout bursts, `0.0 V` ground clipping/short, `1.8 V` MCU rails, `125 Hz` Nyquist limit |
| **Parametric 10-Rate Grid** (`mc-parametric-grid`) | `50 × 2` | `100 / 100` | — | **100 / 100** | 10 sample rates (`125–800 Hz`) × 5 fault archetypes (`clean`, `50+100Hz harmonic`, `clipping`, `2-gap`, `flat`) |
| **Seeded Monte Carlo Multi-Rail Suite** (`mc-seeded-100`) | `100 × 2` | `200 / 200` | — | **200 / 200** | 100 Mulberry32-seeded synthetic captures across 5 ADC voltage domains (`3.3V`, `1.8V`, `5.0V`, `±2.5V`, `2.5V`) |
| **Total** | **205 unique scenarios** | **`410 / 410` (`1,091,580` tok)** | **`110 / 110` (`224,255` tok)** | **`520 / 520` (`1,315,835` tok)** | **100% schema, ID-subset, and withheld-spectrum compliance** |

---

## 2. Head-to-Head Stress & Sweep Results (50 Scenarios × EN/ID × 2 Providers = 200 Calls)

| # | Suite | Scenario ID | Lang | Deterministic Findings (`engine.mjs`) | E4 Withheld | Fireworks Latency / Tokens | Baseten Latency / Tokens | Valid IDs |
| :---: | :--- | :--- | :---: | :--- | :---: | :---: | :---: | :---: |
| 1 | `multi-rate-matrix` | `healthy-200Hz` | `en` | `no-flags` | No | `14.06s` (`1760` / `874`r) | `8.15s` (`3250` / `2319`r) | ✅ |
| 2 | `multi-rate-matrix` | `healthy-200Hz` | `id` | `no-flags` | No | `15.73s` (`1884` / `974`r) | `7.74s` (`2747` / `1794`r) | ✅ |
| 3 | `multi-rate-matrix` | `hum-200Hz` | `en` | `hum` | No | `24.55s` (`2663` / `1779`r) | `6.73s` (`2470` / `1468`r) | ✅ |
| 4 | `multi-rate-matrix` | `hum-200Hz` | `id` | `hum` | No | `12.28s` (`1619` / `750`r) | `11.65s` (`2985` / `2049`r) | ✅ |
| 5 | `multi-rate-matrix` | `clipping-200Hz` | `en` | `clipping` | No | `23.92s` (`2597` / `1704`r) | `7.47s` (`2780` / `1891`r) | ✅ |
| 6 | `multi-rate-matrix` | `clipping-200Hz` | `id` | `clipping` | No | `18.45s` (`2083` / `1143`r) | `10.51s` (`2944` / `2002`r) | ✅ |
| 7 | `multi-rate-matrix` | `gaps-200Hz` | `en` | `timing`, `spectrum-unavailable` | Yes (`null`) | `12.78s` (`1563` / `559`r) | `6.47s` (`2334` / `1344`r) | ✅ |
| 8 | `multi-rate-matrix` | `gaps-200Hz` | `id` | `timing`, `spectrum-unavailable` | Yes (`null`) | `14.74s` (`1735` / `763`r) | `6.66s` (`2077` / `1113`r) | ✅ |
| 9 | `multi-rate-matrix` | `flat-200Hz` | `en` | `flat` | Yes (`null`) | `10.91s` (`1778` / `858`r) | `6.00s` (`2159` / `1288`r) | ✅ |
| 10 | `multi-rate-matrix` | `flat-200Hz` | `id` | `flat` | Yes (`null`) | `20.28s` (`2326` / `1365`r) | `6.30s` (`2684` / `1730`r) | ✅ |
| 11 | `multi-rate-matrix` | `healthy-250Hz` | `en` | `no-flags` | No | `15.15s` (`1975` / `1084`r) | `4.95s` (`2018` / `1149`r) | ✅ |
| 12 | `multi-rate-matrix` | `healthy-250Hz` | `id` | `no-flags` | No | `14.14s` (`2055` / `1055`r) | `6.64s` (`2859` / `1883`r) | ✅ |
| 13 | `multi-rate-matrix` | `hum-250Hz` | `en` | `hum` | No | `10.81s` (`1789` / `920`r) | `5.58s` (`2564` / `1664`r) | ✅ |
| 14 | `multi-rate-matrix` | `hum-250Hz` | `id` | `hum` | No | `13.97s` (`2186` / `1214`r) | `7.41s` (`2812` / `1777`r) | ✅ |
| 15 | `multi-rate-matrix` | `clipping-250Hz` | `en` | `clipping` | No | `17.46s` (`2241` / `1352`r) | `9.67s` (`3334` / `2420`r) | ✅ |
| 16 | `multi-rate-matrix` | `clipping-250Hz` | `id` | `clipping` | No | `11.40s` (`1826` / `877`r) | `8.30s` (`2709` / `1754`r) | ✅ |
| 17 | `multi-rate-matrix` | `gaps-250Hz` | `en` | `timing`, `spectrum-unavailable` | Yes (`null`) | `9.42s` (`1501` / `609`r) | `5.55s` (`2413` / `1417`r) | ✅ |
| 18 | `multi-rate-matrix` | `gaps-250Hz` | `id` | `timing`, `spectrum-unavailable` | Yes (`null`) | `10.90s` (`1815` / `773`r) | `6.59s` (`2707` / `1642`r) | ✅ |
| 19 | `multi-rate-matrix` | `flat-250Hz` | `en` | `flat` | Yes (`null`) | `15.66s` (`1860` / `992`r) | `6.54s` (`2450` / `1566`r) | ✅ |
| 20 | `multi-rate-matrix` | `flat-250Hz` | `id` | `flat` | Yes (`null`) | `14.45s` (`1758` / `892`r) | `8.60s` (`3116` / `2120`r) | ✅ |
| 21 | `multi-rate-matrix` | `healthy-500Hz` | `en` | `no-flags` | No | `14.09s` (`1841` / `929`r) | `6.28s` (`2651` / `1720`r) | ✅ |
| 22 | `multi-rate-matrix` | `healthy-500Hz` | `id` | `no-flags` | No | `13.22s` (`1771` / `837`r) | `6.28s` (`2688` / `1760`r) | ✅ |
| 23 | `multi-rate-matrix` | `hum-500Hz` | `en` | `hum` | No | `20.65s` (`2309` / `1411`r) | `5.91s` (`2817` / `1881`r) | ✅ |
| 24 | `multi-rate-matrix` | `hum-500Hz` | `id` | `hum` | No | `12.47s` (`1925` / `982`r) | `7.44s` (`2748` / `1831`r) | ✅ |
| 25 | `multi-rate-matrix` | `clipping-500Hz` | `en` | `clipping` | No | `12.32s` (`1700` / `783`r) | `4.53s` (`2155` / `1246`r) | ✅ |
| 26 | `multi-rate-matrix` | `clipping-500Hz` | `id` | `clipping` | No | `11.43s` (`1746` / `810`r) | `9.56s` (`3623` / `2617`r) | ✅ |
| 27 | `multi-rate-matrix` | `gaps-500Hz` | `en` | `timing`, `spectrum-unavailable` | Yes (`null`) | `19.09s` (`2491` / `1431`r) | `5.82s` (`2566` / `1598`r) | ✅ |
| 28 | `multi-rate-matrix` | `gaps-500Hz` | `id` | `timing`, `spectrum-unavailable` | Yes (`null`) | `10.10s` (`1869` / `879`r) | `7.14s` (`2424` / `1470`r) | ✅ |
| 29 | `multi-rate-matrix` | `flat-500Hz` | `en` | `flat` | Yes (`null`) | `11.61s` (`1763` / `909`r) | `4.03s` (`1997` / `1138`r) | ✅ |
| 30 | `multi-rate-matrix` | `flat-500Hz` | `id` | `flat` | Yes (`null`) | `20.92s` (`2455` / `1452`r) | `9.09s` (`3186` / `2240`r) | ✅ |
| 31 | `boundary-stress` | `borderline-hum-below-11pct` | `en` | `no-flags` | No | `11.70s` (`1751` / `865`r) | `5.31s` (`2709` / `1796`r) | ✅ |
| 32 | `boundary-stress` | `borderline-hum-below-11pct` | `id` | `no-flags` | No | `14.44s` (`2014` / `1034`r) | `6.28s` (`2461` / `1518`r) | ✅ |
| 33 | `boundary-stress` | `borderline-hum-above-19pct` | `en` | `hum` | No | `8.56s` (`1551` / `679`r) | `4.89s` (`2038` / `1141`r) | ✅ |
| 34 | `boundary-stress` | `borderline-hum-above-19pct` | `id` | `hum` | No | `18.10s` (`2538` / `1486`r) | `7.64s` (`2353` / `1426`r) | ✅ |
| 35 | `boundary-stress` | `borderline-clip-below-0.5pct` | `en` | `no-flags` | No | `10.15s` (`1701` / `802`r) | `5.37s` (`2376` / `1446`r) | ✅ |
| 36 | `boundary-stress` | `borderline-clip-below-0.5pct` | `id` | `no-flags` | No | `14.89s` (`2109` / `1144`r) | `9.11s` (`2899` / `1846`r) | ✅ |
| 37 | `boundary-stress` | `borderline-clip-above-1.5pct` | `en` | `clipping` | No | `10.93s` (`1703` / `814`r) | `6.34s` (`2861` / `1945`r) | ✅ |
| 38 | `boundary-stress` | `borderline-clip-above-1.5pct` | `id` | `clipping` | No | `11.91s` (`1887` / `929`r) | `8.98s` (`2664` / `1714`r) | ✅ |
| 39 | `boundary-stress` | `borderline-jitter-below-1.2pct` | `en` | `no-flags` | No | `9.96s` (`1697` / `814`r) | `6.23s` (`2727` / `1762`r) | ✅ |
| 40 | `boundary-stress` | `borderline-jitter-below-1.2pct` | `id` | `no-flags` | No | `15.45s` (`2139` / `1164`r) | `8.23s` (`2910` / `1887`r) | ✅ |
| 41 | `boundary-stress` | `borderline-jitter-above-3.5pct` | `en` | `timing`, `spectrum-unavailable` | Yes (`null`) | `9.43s` (`1716` / `762`r) | `5.39s` (`2168` / `1220`r) | ✅ |
| 42 | `boundary-stress` | `borderline-jitter-above-3.5pct` | `id` | `timing`, `spectrum-unavailable` | Yes (`null`) | `12.40s` (`1917` / `923`r) | `7.94s` (`2925` / `1911`r) | ✅ |
| 43 | `boundary-stress` | `short-capture-0.6s` | `en` | `spectrum-unavailable` | Yes (`null`) | `10.90s` (`1658` / `770`r) | `6.34s` (`2739` / `1783`r) | ✅ |
| 44 | `boundary-stress` | `short-capture-0.6s` | `id` | `spectrum-unavailable` | Yes (`null`) | `11.10s` (`1688` / `766`r) | `7.43s` (`2746` / `1762`r) | ✅ |
| 45 | `boundary-stress` | `low-rate-100Hz` | `en` | `spectrum-unavailable` | Yes (`null`) | `12.24s` (`1871` / `944`r) | `5.82s` (`2272` / `1360`r) | ✅ |
| 46 | `boundary-stress` | `low-rate-100Hz` | `id` | `spectrum-unavailable` | Yes (`null`) | `15.35s` (`2319` / `1376`r) | `6.58s` (`2407` / `1489`r) | ✅ |
| 47 | `boundary-stress` | `bipolar-rails-hum` | `en` | `hum` | No | `12.75s` (`1650` / `783`r) | `7.18s` (`2828` / `1888`r) | ✅ |
| 48 | `boundary-stress` | `bipolar-rails-hum` | `id` | `hum` | No | `14.41s` (`1812` / `829`r) | `9.71s` (`3484` / `2384`r) | ✅ |
| 49 | `boundary-stress` | `5v-rail-clipping` | `en` | `clipping` | No | `14.52s` (`2137` / `1214`r) | `5.24s` (`2386` / `1462`r) | ✅ |
| 50 | `boundary-stress` | `5v-rail-clipping` | `id` | `clipping` | No | `15.02s` (`2026` / `1098`r) | `5.12s` (`2279` / `1359`r) | ✅ |
| 51 | `boundary-stress` | `multi-fault-hum-and-clipping` | `en` | `clipping`, `hum` | No | `10.04s` (`1579` / `623`r) | `4.89s` (`2381` / `1426`r) | ✅ |
| 52 | `boundary-stress` | `multi-fault-hum-and-clipping` | `id` | `clipping`, `hum` | No | `22.44s` (`2510` / `1484`r) | `6.29s` (`2547` / `1533`r) | ✅ |
| 53 | `boundary-stress` | `multi-fault-clipping-and-gaps` | `en` | `clipping`, `timing`, `spectrum-unavailable` | Yes (`null`) | `12.15s` (`2057` / `1043`r) | `5.49s` (`2728` / `1664`r) | ✅ |
| 54 | `boundary-stress` | `multi-fault-clipping-and-gaps` | `id` | `clipping`, `timing`, `spectrum-unavailable` | Yes (`null`) | `11.08s` (`1919` / `756`r) | `6.71s` (`2707` / `1576`r) | ✅ |
| 55 | `boundary-stress` | `high-rate-1000Hz-healthy` | `en` | `no-flags` | No | `24.41s` (`2598` / `1631`r) | `5.53s` (`2326` / `1443`r) | ✅ |
| 56 | `boundary-stress` | `high-rate-1000Hz-healthy` | `id` | `no-flags` | No | `17.46s` (`2032` / `1055`r) | `5.33s` (`2403` / `1414`r) | ✅ |
| 57 | `boundary-stress` | `high-rate-1000Hz-hum` | `en` | `hum` | No | `19.30s` (`2164` / `1247`r) | `5.91s` (`2643` / `1714`r) | ✅ |
| 58 | `boundary-stress` | `high-rate-1000Hz-hum` | `id` | `hum` | No | `21.21s` (`2296` / `1347`r) | `9.04s` (`3273` / `2343`r) | ✅ |
| 59 | `boundary-stress` | `dc-stuck-at-top-rail` | `en` | `clipping`, `flat` | Yes (`null`) | `24.21s` (`2539` / `1581`r) | `6.03s` (`2617` / `1644`r) | ✅ |
| 60 | `boundary-stress` | `dc-stuck-at-top-rail` | `id` | `clipping`, `flat` | Yes (`null`) | `16.83s` (`1977` / `965`r) | `10.56s` (`3860` / `2826`r) | ✅ |
| 61 | `snr-50hz-sweep` | `snr-sweep-50Hz-amp-0.02V` | `en` | `no-flags` | No | `11.82s` (`1647` / `768`r) | `6.64s` (`2293` / `1408`r) | ✅ |
| 62 | `snr-50hz-sweep` | `snr-sweep-50Hz-amp-0.02V` | `id` | `no-flags` | No | `13.51s` (`1873` / `918`r) | `7.50s` (`2584` / `1576`r) | ✅ |
| 63 | `snr-50hz-sweep` | `snr-sweep-50Hz-amp-0.08V` | `en` | `no-flags` | No | `9.90s` (`1836` / `950`r) | `6.12s` (`2263` / `1333`r) | ✅ |
| 64 | `snr-50hz-sweep` | `snr-sweep-50Hz-amp-0.08V` | `id` | `no-flags` | No | `11.86s` (`1958` / `1022`r) | `7.82s` (`2629` / `1593`r) | ✅ |
| 65 | `snr-50hz-sweep` | `snr-sweep-50Hz-amp-0.13V` | `en` | `hum` | No | `10.99s` (`1608` / `755`r) | `6.29s` (`2405` / `1491`r) | ✅ |
| 66 | `snr-50hz-sweep` | `snr-sweep-50Hz-amp-0.13V` | `id` | `hum` | No | `17.06s` (`2101` / `1112`r) | `7.99s` (`2217` / `1237`r) | ✅ |
| 67 | `snr-50hz-sweep` | `snr-sweep-50Hz-amp-0.22V` | `en` | `hum` | No | `11.19s` (`1761` / `886`r) | `7.89s` (`2893` / `1981`r) | ✅ |
| 68 | `snr-50hz-sweep` | `snr-sweep-50Hz-amp-0.22V` | `id` | `hum` | No | `15.71s` (`2226` / `1294`r) | `9.23s` (`2839` / `1818`r) | ✅ |
| 69 | `snr-50hz-sweep` | `snr-sweep-50Hz-amp-0.45V` | `en` | `hum` | No | `19.02s` (`2297` / `1378`r) | `5.43s` (`2531` / `1623`r) | ✅ |
| 70 | `snr-50hz-sweep` | `snr-sweep-50Hz-amp-0.45V` | `id` | `hum` | No | `17.38s` (`2242` / `1258`r) | `10.73s` (`3622` / `2494`r) | ✅ |
| 71 | `snr-50hz-sweep` | `snr-sweep-50Hz-amp-0.85V` | `en` | `hum` | No | `13.63s` (`2000` / `1129`r) | `7.17s` (`2642` / `1700`r) | ✅ |
| 72 | `snr-50hz-sweep` | `snr-sweep-50Hz-amp-0.85V` | `id` | `hum` | No | `14.01s` (`2057` / `1109`r) | `7.24s` (`2621` / `1620`r) | ✅ |
| 73 | `adc-quantization-sweep` | `adc-6bit-healthy` | `en` | `no-flags` | No | `12.26s` (`1870` / `903`r) | `4.49s` (`2126` / `1213`r) | ✅ |
| 74 | `adc-quantization-sweep` | `adc-6bit-healthy` | `id` | `no-flags` | No | `11.01s` (`1855` / `924`r) | `6.23s` (`2675` / `1727`r) | ✅ |
| 75 | `adc-quantization-sweep` | `adc-8bit-healthy` | `en` | `no-flags` | No | `12.15s` (`1877` / `972`r) | `7.91s` (`2827` / `1887`r) | ✅ |
| 76 | `adc-quantization-sweep` | `adc-8bit-healthy` | `id` | `no-flags` | No | `9.24s` (`1601` / `699`r) | `8.15s` (`3135` / `2026`r) | ✅ |
| 77 | `adc-quantization-sweep` | `adc-10bit-healthy` | `en` | `no-flags` | No | `12.59s` (`1834` / `951`r) | `4.99s` (`2424` / `1503`r) | ✅ |
| 78 | `adc-quantization-sweep` | `adc-10bit-healthy` | `id` | `no-flags` | No | `19.84s` (`1821` / `873`r) | `7.29s` (`3079` / `2059`r) | ✅ |
| 79 | `adc-quantization-sweep` | `adc-12bit-healthy` | `en` | `no-flags` | No | `13.27s` (`1675` / `780`r) | `3.71s` (`2052` / `1148`r) | ✅ |
| 80 | `adc-quantization-sweep` | `adc-12bit-healthy` | `id` | `no-flags` | No | `15.89s` (`2000` / `1064`r) | `6.60s` (`2630` / `1629`r) | ✅ |
| 81 | `adc-quantization-sweep` | `adc-6bit-hum` | `en` | `hum` | No | `13.46s` (`2197` / `1261`r) | `6.14s` (`2398` / `1495`r) | ✅ |
| 82 | `adc-quantization-sweep` | `adc-6bit-hum` | `id` | `hum` | No | `15.71s` (`2425` / `1411`r) | `7.79s` (`2883` / `1845`r) | ✅ |
| 83 | `adc-quantization-sweep` | `adc-8bit-hum` | `en` | `hum` | No | `16.44s` (`2262` / `1351`r) | `4.78s` (`2326` / `1435`r) | ✅ |
| 84 | `adc-quantization-sweep` | `adc-8bit-hum` | `id` | `hum` | No | `15.33s` (`2133` / `1257`r) | `6.26s` (`2445` / `1450`r) | ✅ |
| 85 | `adc-quantization-sweep` | `adc-10bit-hum` | `en` | `hum` | No | `10.47s` (`1818` / `957`r) | `6.17s` (`2682` / `1703`r) | ✅ |
| 86 | `adc-quantization-sweep` | `adc-10bit-hum` | `id` | `hum` | No | `10.60s` (`1795` / `863`r) | `9.55s` (`3632` / `2671`r) | ✅ |
| 87 | `adc-quantization-sweep` | `adc-12bit-hum` | `en` | `hum` | No | `10.23s` (`1475` / `601`r) | `5.77s` (`2563` / `1636`r) | ✅ |
| 88 | `adc-quantization-sweep` | `adc-12bit-hum` | `id` | `hum` | No | `22.53s` (`2779` / `1748`r) | `10.23s` (`3724` / `2837`r) | ✅ |
| 89 | `acquisition-stress` | `multi-gap-burst-3gaps` | `en` | `timing`, `spectrum-unavailable` | Yes (`null`) | `12.03s` (`2096` / `1166`r) | `7.15s` (`2861` / `1901`r) | ✅ |
| 90 | `acquisition-stress` | `multi-gap-burst-3gaps` | `id` | `timing`, `spectrum-unavailable` | Yes (`null`) | `12.37s` (`2028` / `954`r) | `5.64s` (`2252` / `1195`r) | ✅ |
| 91 | `acquisition-stress` | `bottom-rail-ground-clipping` | `en` | `clipping` | No | `12.29s` (`2117` / `1225`r) | `4.99s` (`2385` / `1492`r) | ✅ |
| 92 | `acquisition-stress` | `bottom-rail-ground-clipping` | `id` | `clipping` | No | `10.43s` (`1756` / `841`r) | `6.83s` (`2811` / `1863`r) | ✅ |
| 93 | `acquisition-stress` | `1.8v-low-power-rail-hum` | `en` | `hum` | No | `21.16s` (`2322` / `1419`r) | `6.48s` (`2614` / `1701`r) | ✅ |
| 94 | `acquisition-stress` | `1.8v-low-power-rail-hum` | `id` | `hum` | No | `16.73s` (`1998` / `1012`r) | `8.18s` (`2709` / `1658`r) | ✅ |
| 95 | `acquisition-stress` | `1.8v-low-power-rail-clipping` | `en` | `clipping` | No | `11.17s` (`1780` / `869`r) | `3.91s` (`1967` / `1060`r) | ✅ |
| 96 | `acquisition-stress` | `1.8v-low-power-rail-clipping` | `id` | `clipping` | No | `22.95s` (`3011` / `2059`r) | `7.28s` (`2419` / `1493`r) | ✅ |
| 97 | `acquisition-stress` | `dc-zero-ground-short` | `en` | `clipping`, `flat` | Yes (`null`) | `13.79s` (`2157` / `1266`r) | `9.57s` (`3238` / `2233`r) | ✅ |
| 98 | `acquisition-stress` | `dc-zero-ground-short` | `id` | `clipping`, `flat` | Yes (`null`) | `17.48s` (`2390` / `1257`r) | `7.45s` (`3111` / `2122`r) | ✅ |
| 99 | `acquisition-stress` | `nyquist-boundary-125Hz-hum` | `en` | `hum` | No | `10.68s` (`1858` / `976`r) | `6.68s` (`3000` / `2090`r) | ✅ |
| 100 | `acquisition-stress` | `nyquist-boundary-125Hz-hum` | `id` | `hum` | No | `14.91s` (`2557` / `1645`r) | `9.02s` (`3299` / `2150`r) | ✅ |

---

## 3. Baseten 300-Call Parametric Grid & Seeded Monte Carlo Suite (`meta-models/muse-spark-open-1026`)

| # | Suite | Scenario ID | Lang | Rail (V) | fs (Hz) | Deterministic Findings | E4 Withheld | Latency | Total / Reasoning / Accepted-Pred Tokens | Valid IDs |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- | :---: | :---: | :---: | :---: |
| 1 | `mc-parametric-grid` | `grid-clean-125Hz` | `en` | `0..3.3` | `125` | `no-flags` | No | `5.92s` | `2291` / `1410`r / `1271`a | ✅ |
| 2 | `mc-parametric-grid` | `grid-clean-125Hz` | `id` | `0..3.3` | `125` | `no-flags` | No | `9.47s` | `2434` / `1474`r / `1333`a | ✅ |
| 3 | `mc-parametric-grid` | `grid-hum-harmonic-125Hz` | `en` | `0..3.3` | `125` | `hum` | No | `6.57s` | `2514` / `1631`r / `1444`a | ✅ |
| 4 | `mc-parametric-grid` | `grid-hum-harmonic-125Hz` | `id` | `0..3.3` | `125` | `hum` | No | `6.94s` | `2364` / `1422`r / `1253`a | ✅ |
| 5 | `mc-parametric-grid` | `grid-clipping-125Hz` | `en` | `0..3.3` | `125` | `clipping` | No | `6.81s` | `2477` / `1569`r / `1416`a | ✅ |
| 6 | `mc-parametric-grid` | `grid-clipping-125Hz` | `id` | `0..3.3` | `125` | `clipping` | No | `10.26s` | `2701` / `1718`r / `1512`a | ✅ |
| 7 | `mc-parametric-grid` | `grid-gaps-125Hz` | `en` | `0..3.3` | `125` | `timing`, `spectrum-unavailable` | Yes (`null`) | `6.13s` | `2132` / `1194`r / `1130`a | ✅ |
| 8 | `mc-parametric-grid` | `grid-gaps-125Hz` | `id` | `0..3.3` | `125` | `timing`, `spectrum-unavailable` | Yes (`null`) | `9.14s` | `2664` / `1609`r / `1456`a | ✅ |
| 9 | `mc-parametric-grid` | `grid-flat-125Hz` | `en` | `0..3.3` | `125` | `flat` | Yes (`null`) | `6.73s` | `2294` / `1343`r / `1294`a | ✅ |
| 10 | `mc-parametric-grid` | `grid-flat-125Hz` | `id` | `0..3.3` | `125` | `flat` | Yes (`null`) | `7.48s` | `2652` / `1738`r / `1534`a | ✅ |
| 11 | `mc-parametric-grid` | `grid-clean-150Hz` | `en` | `0..3.3` | `150` | `no-flags` | No | `6.68s` | `2533` / `1650`r / `1482`a | ✅ |
| 12 | `mc-parametric-grid` | `grid-clean-150Hz` | `id` | `0..3.3` | `150` | `no-flags` | No | `7.59s` | `2798` / `1829`r / `1621`a | ✅ |
| 13 | `mc-parametric-grid` | `grid-hum-harmonic-150Hz` | `en` | `0..3.3` | `150` | `hum` | No | `7.44s` | `2413` / `1507`r / `1361`a | ✅ |
| 14 | `mc-parametric-grid` | `grid-hum-harmonic-150Hz` | `id` | `0..3.3` | `150` | `hum` | No | `11.26s` | `3499` / `2458`r / `2106`a | ✅ |
| 15 | `mc-parametric-grid` | `grid-clipping-150Hz` | `en` | `0..3.3` | `150` | `clipping` | No | `11.62s` | `3362` / `2449`r / `2068`a | ✅ |
| 16 | `mc-parametric-grid` | `grid-clipping-150Hz` | `id` | `0..3.3` | `150` | `clipping` | No | `13.05s` | `3146` / `2152`r / `1902`a | ✅ |
| 17 | `mc-parametric-grid` | `grid-gaps-150Hz` | `en` | `0..3.3` | `150` | `timing`, `spectrum-unavailable` | Yes (`null`) | `6.80s` | `2561` / `1588`r / `1478`a | ✅ |
| 18 | `mc-parametric-grid` | `grid-gaps-150Hz` | `id` | `0..3.3` | `150` | `timing`, `spectrum-unavailable` | Yes (`null`) | `7.42s` | `2210` / `1187`r / `1148`a | ✅ |
| 19 | `mc-parametric-grid` | `grid-flat-150Hz` | `en` | `0..3.3` | `150` | `flat` | Yes (`null`) | `5.95s` | `2362` / `1416`r / `1355`a | ✅ |
| 20 | `mc-parametric-grid` | `grid-flat-150Hz` | `id` | `0..3.3` | `150` | `flat` | Yes (`null`) | `6.60s` | `2351` / `1343`r / `1277`a | ✅ |
| 21 | `mc-parametric-grid` | `grid-clean-180Hz` | `en` | `0..3.3` | `180` | `no-flags` | No | `5.66s` | `2288` / `1382`r / `1280`a | ✅ |
| 22 | `mc-parametric-grid` | `grid-clean-180Hz` | `id` | `0..3.3` | `180` | `no-flags` | No | `6.97s` | `2904` / `1939`r / `1676`a | ✅ |
| 23 | `mc-parametric-grid` | `grid-hum-harmonic-180Hz` | `en` | `0..3.3` | `180` | `hum` | No | `7.33s` | `3168` / `2277`r / `1921`a | ✅ |
| 24 | `mc-parametric-grid` | `grid-hum-harmonic-180Hz` | `id` | `0..3.3` | `180` | `hum` | No | `6.36s` | `2713` / `1693`r / `1551`a | ✅ |
| 25 | `mc-parametric-grid` | `grid-clipping-180Hz` | `en` | `0..3.3` | `180` | `clipping` | No | `7.07s` | `2734` / `1853`r / `1627`a | ✅ |
| 26 | `mc-parametric-grid` | `grid-clipping-180Hz` | `id` | `0..3.3` | `180` | `clipping` | No | `9.91s` | `3113` / `2180`r / `1816`a | ✅ |
| 27 | `mc-parametric-grid` | `grid-gaps-180Hz` | `en` | `0..3.3` | `180` | `timing`, `spectrum-unavailable` | Yes (`null`) | `7.17s` | `2725` / `1640`r / `1611`a | ✅ |
| 28 | `mc-parametric-grid` | `grid-gaps-180Hz` | `id` | `0..3.3` | `180` | `timing`, `spectrum-unavailable` | Yes (`null`) | `7.21s` | `3026` / `1959`r / `1782`a | ✅ |
| 29 | `mc-parametric-grid` | `grid-flat-180Hz` | `en` | `0..3.3` | `180` | `flat` | Yes (`null`) | `5.97s` | `2245` / `1366`r / `1236`a | ✅ |
| 30 | `mc-parametric-grid` | `grid-flat-180Hz` | `id` | `0..3.3` | `180` | `flat` | Yes (`null`) | `6.63s` | `2243` / `1338`r / `1180`a | ✅ |
| 31 | `mc-parametric-grid` | `grid-clean-200Hz` | `en` | `0..3.3` | `200` | `no-flags` | No | `6.05s` | `2370` / `1418`r / `1326`a | ✅ |
| 32 | `mc-parametric-grid` | `grid-clean-200Hz` | `id` | `0..3.3` | `200` | `no-flags` | No | `6.07s` | `2281` / `1293`r / `1214`a | ✅ |
| 33 | `mc-parametric-grid` | `grid-hum-harmonic-200Hz` | `en` | `0..3.3` | `200` | `hum` | No | `6.23s` | `2248` / `1328`r / `1252`a | ✅ |
| 34 | `mc-parametric-grid` | `grid-hum-harmonic-200Hz` | `id` | `0..3.3` | `200` | `hum` | No | `7.47s` | `2554` / `1571`r / `1406`a | ✅ |
| 35 | `mc-parametric-grid` | `grid-clipping-200Hz` | `en` | `0..3.3` | `200` | `clipping` | No | `7.03s` | `2750` / `1809`r / `1618`a | ✅ |
| 36 | `mc-parametric-grid` | `grid-clipping-200Hz` | `id` | `0..3.3` | `200` | `clipping` | No | `7.93s` | `2484` / `1600`r / `1345`a | ✅ |
| 37 | `mc-parametric-grid` | `grid-gaps-200Hz` | `en` | `0..3.3` | `200` | `timing`, `spectrum-unavailable` | Yes (`null`) | `8.23s` | `2938` / `1976`r / `1758`a | ✅ |
| 38 | `mc-parametric-grid` | `grid-gaps-200Hz` | `id` | `0..3.3` | `200` | `timing`, `spectrum-unavailable` | Yes (`null`) | `6.03s` | `2190` / `1179`r / `1138`a | ✅ |
| 39 | `mc-parametric-grid` | `grid-flat-200Hz` | `en` | `0..3.3` | `200` | `flat` | Yes (`null`) | `7.52s` | `2921` / `2005`r / `1734`a | ✅ |
| 40 | `mc-parametric-grid` | `grid-flat-200Hz` | `id` | `0..3.3` | `200` | `flat` | Yes (`null`) | `5.65s` | `2064` / `1111`r / `1048`a | ✅ |
| 41 | `mc-parametric-grid` | `grid-clean-240Hz` | `en` | `0..3.3` | `240` | `no-flags` | No | `6.82s` | `2402` / `1457`r / `1382`a | ✅ |
| 42 | `mc-parametric-grid` | `grid-clean-240Hz` | `id` | `0..3.3` | `240` | `no-flags` | No | `6.99s` | `2964` / `1995`r / `1740`a | ✅ |
| 43 | `mc-parametric-grid` | `grid-hum-harmonic-240Hz` | `en` | `0..3.3` | `240` | `hum` | No | `7.08s` | `2678` / `1761`r / `1569`a | ✅ |
| 44 | `mc-parametric-grid` | `grid-hum-harmonic-240Hz` | `id` | `0..3.3` | `240` | `hum` | No | `7.99s` | `3069` / `2079`r / `1786`a | ✅ |
| 45 | `mc-parametric-grid` | `grid-clipping-240Hz` | `en` | `0..3.3` | `240` | `clipping` | No | `4.88s` | `2094` / `1208`r / `1125`a | ✅ |
| 46 | `mc-parametric-grid` | `grid-clipping-240Hz` | `id` | `0..3.3` | `240` | `clipping` | No | `10.42s` | `3568` / `2597`r / `2169`a | ✅ |
| 47 | `mc-parametric-grid` | `grid-gaps-240Hz` | `en` | `0..3.3` | `240` | `timing`, `spectrum-unavailable` | Yes (`null`) | `6.08s` | `2311` / `1352`r / `1283`a | ✅ |
| 48 | `mc-parametric-grid` | `grid-gaps-240Hz` | `id` | `0..3.3` | `240` | `timing`, `spectrum-unavailable` | Yes (`null`) | `5.94s` | `1936` / `935`r / `917`a | ✅ |
| 49 | `mc-parametric-grid` | `grid-flat-240Hz` | `en` | `0..3.3` | `240` | `flat` | Yes (`null`) | `6.95s` | `2144` / `1268`r / `1170`a | ✅ |
| 50 | `mc-parametric-grid` | `grid-flat-240Hz` | `id` | `0..3.3` | `240` | `flat` | Yes (`null`) | `9.62s` | `3257` / `2333`r / `1981`a | ✅ |
| 51 | `mc-parametric-grid` | `grid-clean-250Hz` | `en` | `0..3.3` | `250` | `no-flags` | No | `3.99s` | `2020` / `1146`r / `1069`a | ✅ |
| 52 | `mc-parametric-grid` | `grid-clean-250Hz` | `id` | `0..3.3` | `250` | `no-flags` | No | `6.42s` | `2453` / `1404`r / `1334`a | ✅ |
| 53 | `mc-parametric-grid` | `grid-hum-harmonic-250Hz` | `en` | `0..3.3` | `250` | `hum` | No | `6.75s` | `2811` / `1907`r / `1665`a | ✅ |
| 54 | `mc-parametric-grid` | `grid-hum-harmonic-250Hz` | `id` | `0..3.3` | `250` | `hum` | No | `7.43s` | `2899` / `1873`r / `1641`a | ✅ |
| 55 | `mc-parametric-grid` | `grid-clipping-250Hz` | `en` | `0..3.3` | `250` | `clipping` | No | `12.55s` | `3601` / `2645`r / `2237`a | ✅ |
| 56 | `mc-parametric-grid` | `grid-clipping-250Hz` | `id` | `0..3.3` | `250` | `clipping` | No | `7.12s` | `2390` / `1420`r / `1273`a | ✅ |
| 57 | `mc-parametric-grid` | `grid-gaps-250Hz` | `en` | `0..3.3` | `250` | `timing`, `spectrum-unavailable` | Yes (`null`) | `5.11s` | `2377` / `1385`r / `1316`a | ✅ |
| 58 | `mc-parametric-grid` | `grid-gaps-250Hz` | `id` | `0..3.3` | `250` | `timing`, `spectrum-unavailable` | Yes (`null`) | `8.65s` | `3150` / `2135`r / `1858`a | ✅ |
| 59 | `mc-parametric-grid` | `grid-flat-250Hz` | `en` | `0..3.3` | `250` | `flat` | Yes (`null`) | `4.57s` | `1942` / `1058`r / `1023`a | ✅ |
| 60 | `mc-parametric-grid` | `grid-flat-250Hz` | `id` | `0..3.3` | `250` | `flat` | Yes (`null`) | `6.47s` | `2272` / `1338`r / `1226`a | ✅ |
| 61 | `mc-parametric-grid` | `grid-clean-320Hz` | `en` | `0..3.3` | `320` | `no-flags` | No | `7.33s` | `2899` / `1971`r / `1758`a | ✅ |
| 62 | `mc-parametric-grid` | `grid-clean-320Hz` | `id` | `0..3.3` | `320` | `no-flags` | No | `6.04s` | `2190` / `1219`r / `1130`a | ✅ |
| 63 | `mc-parametric-grid` | `grid-hum-harmonic-320Hz` | `en` | `0..3.3` | `320` | `hum` | No | `6.83s` | `2540` / `1618`r / `1439`a | ✅ |
| 64 | `mc-parametric-grid` | `grid-hum-harmonic-320Hz` | `id` | `0..3.3` | `320` | `hum` | No | `9.52s` | `3271` / `2220`r / `1917`a | ✅ |
| 65 | `mc-parametric-grid` | `grid-clipping-320Hz` | `en` | `0..3.3` | `320` | `clipping` | No | `6.44s` | `2536` / `1613`r / `1435`a | ✅ |
| 66 | `mc-parametric-grid` | `grid-clipping-320Hz` | `id` | `0..3.3` | `320` | `clipping` | No | `8.12s` | `2937` / `1905`r / `1670`a | ✅ |
| 67 | `mc-parametric-grid` | `grid-gaps-320Hz` | `en` | `0..3.3` | `320` | `timing`, `spectrum-unavailable` | Yes (`null`) | `6.21s` | `2445` / `1486`r / `1373`a | ✅ |
| 68 | `mc-parametric-grid` | `grid-gaps-320Hz` | `id` | `0..3.3` | `320` | `timing`, `spectrum-unavailable` | Yes (`null`) | `10.05s` | `3143` / `2043`r / `1815`a | ✅ |
| 69 | `mc-parametric-grid` | `grid-flat-320Hz` | `en` | `0..3.3` | `320` | `flat` | Yes (`null`) | `5.37s` | `2258` / `1365`r / `1249`a | ✅ |
| 70 | `mc-parametric-grid` | `grid-flat-320Hz` | `id` | `0..3.3` | `320` | `flat` | Yes (`null`) | `6.14s` | `2631` / `1699`r / `1522`a | ✅ |
| 71 | `mc-parametric-grid` | `grid-clean-400Hz` | `en` | `0..3.3` | `400` | `no-flags` | No | `7.37s` | `2846` / `1900`r / `1693`a | ✅ |
| 72 | `mc-parametric-grid` | `grid-clean-400Hz` | `id` | `0..3.3` | `400` | `no-flags` | No | `6.86s` | `2763` / `1735`r / `1580`a | ✅ |
| 73 | `mc-parametric-grid` | `grid-hum-harmonic-400Hz` | `en` | `0..3.3` | `400` | `hum` | No | `6.38s` | `2445` / `1528`r / `1369`a | ✅ |
| 74 | `mc-parametric-grid` | `grid-hum-harmonic-400Hz` | `id` | `0..3.3` | `400` | `hum` | No | `6.90s` | `2659` / `1699`r / `1447`a | ✅ |
| 75 | `mc-parametric-grid` | `grid-clipping-400Hz` | `en` | `0..3.3` | `400` | `clipping` | No | `10.64s` | `3697` / `2781`r / `2369`a | ✅ |
| 76 | `mc-parametric-grid` | `grid-clipping-400Hz` | `id` | `0..3.3` | `400` | `clipping` | No | `10.12s` | `2755` / `1724`r / `1462`a | ✅ |
| 77 | `mc-parametric-grid` | `grid-gaps-400Hz` | `en` | `0..3.3` | `400` | `timing`, `spectrum-unavailable` | Yes (`null`) | `4.60s` | `1908` / `926`r / `964`a | ✅ |
| 78 | `mc-parametric-grid` | `grid-gaps-400Hz` | `id` | `0..3.3` | `400` | `timing`, `spectrum-unavailable` | Yes (`null`) | `5.73s` | `2526` / `1447`r / `1422`a | ✅ |
| 79 | `mc-parametric-grid` | `grid-flat-400Hz` | `en` | `0..3.3` | `400` | `flat` | Yes (`null`) | `5.13s` | `2356` / `1500`r / `1326`a | ✅ |
| 80 | `mc-parametric-grid` | `grid-flat-400Hz` | `id` | `0..3.3` | `400` | `flat` | Yes (`null`) | `7.07s` | `2444` / `1465`r / `1339`a | ✅ |
| 81 | `mc-parametric-grid` | `grid-clean-500Hz` | `en` | `0..3.3` | `500` | `no-flags` | No | `6.05s` | `2730` / `1793`r / `1618`a | ✅ |
| 82 | `mc-parametric-grid` | `grid-clean-500Hz` | `id` | `0..3.3` | `500` | `no-flags` | No | `5.49s` | `2321` / `1350`r / `1230`a | ✅ |
| 83 | `mc-parametric-grid` | `grid-hum-harmonic-500Hz` | `en` | `0..3.3` | `500` | `hum` | No | `6.92s` | `2235` / `1305`r / `1228`a | ✅ |
| 84 | `mc-parametric-grid` | `grid-hum-harmonic-500Hz` | `id` | `0..3.3` | `500` | `hum` | No | `12.54s` | `3800` / `2773`r / `2292`a | ✅ |
| 85 | `mc-parametric-grid` | `grid-clipping-500Hz` | `en` | `0..3.3` | `500` | `clipping` | No | `6.27s` | `2878` / `2002`r / `1731`a | ✅ |
| 86 | `mc-parametric-grid` | `grid-clipping-500Hz` | `id` | `0..3.3` | `500` | `clipping` | No | `6.97s` | `2925` / `2013`r / `1708`a | ✅ |
| 87 | `mc-parametric-grid` | `grid-gaps-500Hz` | `en` | `0..3.3` | `500` | `timing`, `spectrum-unavailable` | Yes (`null`) | `5.87s` | `2195` / `1187`r / `1183`a | ✅ |
| 88 | `mc-parametric-grid` | `grid-gaps-500Hz` | `id` | `0..3.3` | `500` | `timing`, `spectrum-unavailable` | Yes (`null`) | `6.87s` | `2810` / `1727`r / `1588`a | ✅ |
| 89 | `mc-parametric-grid` | `grid-flat-500Hz` | `en` | `0..3.3` | `500` | `flat` | Yes (`null`) | `7.34s` | `2695` / `1788`r / `1613`a | ✅ |
| 90 | `mc-parametric-grid` | `grid-flat-500Hz` | `id` | `0..3.3` | `500` | `flat` | Yes (`null`) | `6.41s` | `2184` / `1248`r / `1156`a | ✅ |
| 91 | `mc-parametric-grid` | `grid-clean-800Hz` | `en` | `0..3.3` | `800` | `no-flags` | No | `5.57s` | `2390` / `1477`r / `1397`a | ✅ |
| 92 | `mc-parametric-grid` | `grid-clean-800Hz` | `id` | `0..3.3` | `800` | `no-flags` | No | `4.71s` | `2116` / `1171`r / `1096`a | ✅ |
| 93 | `mc-parametric-grid` | `grid-hum-harmonic-800Hz` | `en` | `0..3.3` | `800` | `hum` | No | `6.67s` | `2643` / `1714`r / `1555`a | ✅ |
| 94 | `mc-parametric-grid` | `grid-hum-harmonic-800Hz` | `id` | `0..3.3` | `800` | `hum` | No | `11.93s` | `3461` / `2496`r / `2110`a | ✅ |
| 95 | `mc-parametric-grid` | `grid-clipping-800Hz` | `en` | `0..3.3` | `800` | `clipping` | No | `5.62s` | `2447` / `1547`r / `1381`a | ✅ |
| 96 | `mc-parametric-grid` | `grid-clipping-800Hz` | `id` | `0..3.3` | `800` | `clipping` | No | `5.95s` | `2506` / `1521`r / `1380`a | ✅ |
| 97 | `mc-parametric-grid` | `grid-gaps-800Hz` | `en` | `0..3.3` | `800` | `timing`, `spectrum-unavailable` | Yes (`null`) | `5.27s` | `2489` / `1502`r / `1443`a | ✅ |
| 98 | `mc-parametric-grid` | `grid-gaps-800Hz` | `id` | `0..3.3` | `800` | `timing`, `spectrum-unavailable` | Yes (`null`) | `6.54s` | `2696` / `1670`r / `1506`a | ✅ |
| 99 | `mc-parametric-grid` | `grid-flat-800Hz` | `en` | `0..3.3` | `800` | `flat` | Yes (`null`) | `5.27s` | `2281` / `1378`r / `1307`a | ✅ |
| 100 | `mc-parametric-grid` | `grid-flat-800Hz` | `id` | `0..3.3` | `800` | `flat` | Yes (`null`) | `6.71s` | `2596` / `1679`r / `1428`a | ✅ |
| 101 | `mc-seeded-100` | `mc-seed-001-1v8-mcu` | `en` | `0..1.8` | `200` | `hum` | No | `10.86s` | `3014` / `2086`r / `1819`a | ✅ |
| 102 | `mc-seeded-100` | `mc-seed-001-1v8-mcu` | `id` | `0..1.8` | `200` | `hum` | No | `5.66s` | `2189` / `1182`r / `1096`a | ✅ |
| 103 | `mc-seeded-100` | `mc-seed-002-5v0-ttl` | `en` | `0..5` | `250` | `clipping` | No | `5.56s` | `2271` / `1425`r / `1287`a | ✅ |
| 104 | `mc-seeded-100` | `mc-seed-002-5v0-ttl` | `id` | `0..5` | `250` | `clipping` | No | `6.43s` | `2421` / `1494`r / `1320`a | ✅ |
| 105 | `mc-seeded-100` | `mc-seed-003-bipolar-2v5` | `en` | `-2.5..2.5` | `300` | `timing`, `spectrum-unavailable` | Yes (`null`) | `5.17s` | `2124` / `1170`r / `1105`a | ✅ |
| 106 | `mc-seeded-100` | `mc-seed-003-bipolar-2v5` | `id` | `-2.5..2.5` | `300` | `timing`, `spectrum-unavailable` | Yes (`null`) | `8.49s` | `2558` / `1506`r / `1418`a | ✅ |
| 107 | `mc-seeded-100` | `mc-seed-004-2v5-vref` | `en` | `0..2.5` | `400` | `flat` | Yes (`null`) | `5.43s` | `1974` / `1039`r / `1048`a | ✅ |
| 108 | `mc-seeded-100` | `mc-seed-004-2v5-vref` | `id` | `0..2.5` | `400` | `flat` | Yes (`null`) | `8.28s` | `3026` / `2070`r / `1800`a | ✅ |
| 109 | `mc-seeded-100` | `mc-seed-005-3v3-cmos` | `en` | `0..3.3` | `500` | `no-flags` | No | `8.61s` | `2652` / `1723`r / `1576`a | ✅ |
| 110 | `mc-seeded-100` | `mc-seed-005-3v3-cmos` | `id` | `0..3.3` | `500` | `no-flags` | No | `9.10s` | `2949` / `1947`r / `1698`a | ✅ |
| 111 | `mc-seeded-100` | `mc-seed-006-1v8-mcu` | `en` | `0..1.8` | `160` | `hum` | No | `5.42s` | `2160` / `1208`r / `1187`a | ✅ |
| 112 | `mc-seeded-100` | `mc-seed-006-1v8-mcu` | `id` | `0..1.8` | `160` | `hum` | No | `8.01s` | `2467` / `1449`r / `1306`a | ✅ |
| 113 | `mc-seeded-100` | `mc-seed-007-5v0-ttl` | `en` | `0..5` | `200` | `clipping` | No | `6.13s` | `2833` / `1862`r / `1710`a | ✅ |
| 114 | `mc-seeded-100` | `mc-seed-007-5v0-ttl` | `id` | `0..5` | `200` | `clipping` | No | `10.48s` | `3440` / `2505`r / `2024`a | ✅ |
| 115 | `mc-seeded-100` | `mc-seed-008-bipolar-2v5` | `en` | `-2.5..2.5` | `250` | `timing`, `spectrum-unavailable` | Yes (`null`) | `5.56s` | `2571` / `1556`r / `1494`a | ✅ |
| 116 | `mc-seeded-100` | `mc-seed-008-bipolar-2v5` | `id` | `-2.5..2.5` | `250` | `timing`, `spectrum-unavailable` | Yes (`null`) | `8.39s` | `2193` / `1178`r / `1134`a | ✅ |
| 117 | `mc-seeded-100` | `mc-seed-009-2v5-vref` | `en` | `0..2.5` | `300` | `clipping` | No | `5.76s` | `2460` / `1571`r / `1402`a | ✅ |
| 118 | `mc-seeded-100` | `mc-seed-009-2v5-vref` | `id` | `0..2.5` | `300` | `clipping` | No | `8.25s` | `2744` / `1720`r / `1509`a | ✅ |
| 119 | `mc-seeded-100` | `mc-seed-010-3v3-cmos` | `en` | `0..3.3` | `400` | `no-flags` | No | `5.80s` | `2669` / `1760`r / `1578`a | ✅ |
| 120 | `mc-seeded-100` | `mc-seed-010-3v3-cmos` | `id` | `0..3.3` | `400` | `no-flags` | No | `6.99s` | `2760` / `1711`r / `1555`a | ✅ |
| 121 | `mc-seeded-100` | `mc-seed-011-1v8-mcu` | `en` | `0..1.8` | `500` | `hum` | No | `8.00s` | `2811` / `1905`r / `1630`a | ✅ |
| 122 | `mc-seeded-100` | `mc-seed-011-1v8-mcu` | `id` | `0..1.8` | `500` | `hum` | No | `8.51s` | `3351` / `2320`r / `1997`a | ✅ |
| 123 | `mc-seeded-100` | `mc-seed-012-5v0-ttl` | `en` | `0..5` | `160` | `clipping` | No | `10.99s` | `3496` / `2618`r / `2203`a | ✅ |
| 124 | `mc-seeded-100` | `mc-seed-012-5v0-ttl` | `id` | `0..5` | `160` | `clipping` | No | `8.62s` | `3045` / `2032`r / `1760`a | ✅ |
| 125 | `mc-seeded-100` | `mc-seed-013-bipolar-2v5` | `en` | `-2.5..2.5` | `200` | `timing`, `spectrum-unavailable` | Yes (`null`) | `5.96s` | `2718` / `1775`r / `1581`a | ✅ |
| 126 | `mc-seeded-100` | `mc-seed-013-bipolar-2v5` | `id` | `-2.5..2.5` | `200` | `timing`, `spectrum-unavailable` | Yes (`null`) | `6.24s` | `2578` / `1561`r / `1431`a | ✅ |
| 127 | `mc-seeded-100` | `mc-seed-014-2v5-vref` | `en` | `0..2.5` | `250` | `flat` | Yes (`null`) | `6.35s` | `2798` / `1907`r / `1717`a | ✅ |
| 128 | `mc-seeded-100` | `mc-seed-014-2v5-vref` | `id` | `0..2.5` | `250` | `flat` | Yes (`null`) | `7.81s` | `3186` / `2241`r / `1951`a | ✅ |
| 129 | `mc-seeded-100` | `mc-seed-015-3v3-cmos` | `en` | `0..3.3` | `300` | `no-flags` | No | `5.91s` | `2266` / `1362`r / `1284`a | ✅ |
| 130 | `mc-seeded-100` | `mc-seed-015-3v3-cmos` | `id` | `0..3.3` | `300` | `no-flags` | No | `6.47s` | `2229` / `1294`r / `1176`a | ✅ |
| 131 | `mc-seeded-100` | `mc-seed-016-1v8-mcu` | `en` | `0..1.8` | `400` | `hum` | No | `5.69s` | `2154` / `1225`r / `1188`a | ✅ |
| 132 | `mc-seeded-100` | `mc-seed-016-1v8-mcu` | `id` | `0..1.8` | `400` | `hum` | No | `7.56s` | `2847` / `1794`r / `1580`a | ✅ |
| 133 | `mc-seeded-100` | `mc-seed-017-5v0-ttl` | `en` | `0..5` | `500` | `clipping` | No | `3.56s` | `1862` / `997`r / `963`a | ✅ |
| 134 | `mc-seeded-100` | `mc-seed-017-5v0-ttl` | `id` | `0..5` | `500` | `clipping` | No | `7.17s` | `2818` / `1871`r / `1618`a | ✅ |
| 135 | `mc-seeded-100` | `mc-seed-018-bipolar-2v5` | `en` | `-2.5..2.5` | `160` | `timing`, `spectrum-unavailable` | Yes (`null`) | `5.13s` | `2288` / `1259`r / `1267`a | ✅ |
| 136 | `mc-seeded-100` | `mc-seed-018-bipolar-2v5` | `id` | `-2.5..2.5` | `160` | `timing`, `spectrum-unavailable` | Yes (`null`) | `4.32s` | `1823` / `785`r / `838`a | ✅ |
| 137 | `mc-seeded-100` | `mc-seed-019-2v5-vref` | `en` | `0..2.5` | `200` | `clipping` | No | `6.89s` | `2975` / `2053`r / `1800`a | ✅ |
| 138 | `mc-seeded-100` | `mc-seed-019-2v5-vref` | `id` | `0..2.5` | `200` | `clipping` | No | `9.85s` | `3556` / `2580`r / `2095`a | ✅ |
| 139 | `mc-seeded-100` | `mc-seed-020-3v3-cmos` | `en` | `0..3.3` | `250` | `no-flags` | No | `3.91s` | `2032` / `1142`r / `1085`a | ✅ |
| 140 | `mc-seeded-100` | `mc-seed-020-3v3-cmos` | `id` | `0..3.3` | `250` | `no-flags` | No | `7.76s` | `2900` / `1881`r / `1664`a | ✅ |
| 141 | `mc-seeded-100` | `mc-seed-021-1v8-mcu` | `en` | `0..1.8` | `300` | `hum` | No | `5.46s` | `2498` / `1581`r / `1426`a | ✅ |
| 142 | `mc-seeded-100` | `mc-seed-021-1v8-mcu` | `id` | `0..1.8` | `300` | `hum` | No | `7.53s` | `2785` / `1738`r / `1531`a | ✅ |
| 143 | `mc-seeded-100` | `mc-seed-022-5v0-ttl` | `en` | `0..5` | `400` | `clipping` | No | `5.82s` | `2401` / `1496`r / `1350`a | ✅ |
| 144 | `mc-seeded-100` | `mc-seed-022-5v0-ttl` | `id` | `0..5` | `400` | `clipping` | No | `8.79s` | `3648` / `2685`r / `2277`a | ✅ |
| 145 | `mc-seeded-100` | `mc-seed-023-bipolar-2v5` | `en` | `-2.5..2.5` | `500` | `timing`, `spectrum-unavailable` | Yes (`null`) | `5.84s` | `2852` / `1889`r / `1718`a | ✅ |
| 146 | `mc-seeded-100` | `mc-seed-023-bipolar-2v5` | `id` | `-2.5..2.5` | `500` | `timing`, `spectrum-unavailable` | Yes (`null`) | `5.59s` | `2220` / `1193`r / `1133`a | ✅ |
| 147 | `mc-seeded-100` | `mc-seed-024-2v5-vref` | `en` | `0..2.5` | `160` | `flat` | Yes (`null`) | `7.38s` | `3316` / `2397`r / `2093`a | ✅ |
| 148 | `mc-seeded-100` | `mc-seed-024-2v5-vref` | `id` | `0..2.5` | `160` | `flat` | Yes (`null`) | `10.04s` | `3421` / `2408`r / `2033`a | ✅ |
| 149 | `mc-seeded-100` | `mc-seed-025-3v3-cmos` | `en` | `0..3.3` | `200` | `no-flags` | No | `4.99s` | `2305` / `1407`r / `1306`a | ✅ |
| 150 | `mc-seeded-100` | `mc-seed-025-3v3-cmos` | `id` | `0..3.3` | `200` | `no-flags` | No | `5.95s` | `2084` / `1102`r / `1050`a | ✅ |
| 151 | `mc-seeded-100` | `mc-seed-026-1v8-mcu` | `en` | `0..1.8` | `250` | `hum` | No | `7.97s` | `2924` / `1985`r / `1722`a | ✅ |
| 152 | `mc-seeded-100` | `mc-seed-026-1v8-mcu` | `id` | `0..1.8` | `250` | `hum` | No | `8.77s` | `3403` / `2377`r / `2060`a | ✅ |
| 153 | `mc-seeded-100` | `mc-seed-027-5v0-ttl` | `en` | `0..5` | `300` | `clipping` | No | `7.63s` | `3326` / `2341`r / `2077`a | ✅ |
| 154 | `mc-seeded-100` | `mc-seed-027-5v0-ttl` | `id` | `0..5` | `300` | `clipping` | No | `9.71s` | `3587` / `2636`r / `2218`a | ✅ |
| 155 | `mc-seeded-100` | `mc-seed-028-bipolar-2v5` | `en` | `-2.5..2.5` | `400` | `timing`, `spectrum-unavailable` | Yes (`null`) | `4.69s` | `2347` / `1326`r / `1323`a | ✅ |
| 156 | `mc-seeded-100` | `mc-seed-028-bipolar-2v5` | `id` | `-2.5..2.5` | `400` | `timing`, `spectrum-unavailable` | Yes (`null`) | `6.43s` | `2491` / `1438`r / `1355`a | ✅ |
| 157 | `mc-seeded-100` | `mc-seed-029-2v5-vref` | `en` | `0..2.5` | `500` | `clipping` | No | `4.38s` | `1738` / `830`r / `849`a | ✅ |
| 158 | `mc-seeded-100` | `mc-seed-029-2v5-vref` | `id` | `0..2.5` | `500` | `clipping` | No | `7.86s` | `2524` / `1607`r / `1375`a | ✅ |
| 159 | `mc-seeded-100` | `mc-seed-030-3v3-cmos` | `en` | `0..3.3` | `160` | `no-flags` | No | `5.26s` | `2193` / `1273`r / `1231`a | ✅ |
| 160 | `mc-seeded-100` | `mc-seed-030-3v3-cmos` | `id` | `0..3.3` | `160` | `no-flags` | No | `8.47s` | `2840` / `1911`r / `1631`a | ✅ |
| 161 | `mc-seeded-100` | `mc-seed-031-1v8-mcu` | `en` | `0..1.8` | `200` | `hum` | No | `8.49s` | `2679` / `1768`r / `1565`a | ✅ |
| 162 | `mc-seeded-100` | `mc-seed-031-1v8-mcu` | `id` | `0..1.8` | `200` | `hum` | No | `12.04s` | `3941` / `2962`r / `2455`a | ✅ |
| 163 | `mc-seeded-100` | `mc-seed-032-5v0-ttl` | `en` | `0..5` | `250` | `clipping` | No | `8.18s` | `2667` / `1750`r / `1558`a | ✅ |
| 164 | `mc-seeded-100` | `mc-seed-032-5v0-ttl` | `id` | `0..5` | `250` | `clipping` | No | `8.39s` | `3258` / `2316`r / `1925`a | ✅ |
| 165 | `mc-seeded-100` | `mc-seed-033-bipolar-2v5` | `en` | `-2.5..2.5` | `300` | `timing`, `spectrum-unavailable` | Yes (`null`) | `6.67s` | `2504` / `1544`r / `1454`a | ✅ |
| 166 | `mc-seeded-100` | `mc-seed-033-bipolar-2v5` | `id` | `-2.5..2.5` | `300` | `timing`, `spectrum-unavailable` | Yes (`null`) | `8.62s` | `2764` / `1656`r / `1549`a | ✅ |
| 167 | `mc-seeded-100` | `mc-seed-034-2v5-vref` | `en` | `0..2.5` | `400` | `flat` | Yes (`null`) | `5.17s` | `2230` / `1345`r / `1234`a | ✅ |
| 168 | `mc-seeded-100` | `mc-seed-034-2v5-vref` | `id` | `0..2.5` | `400` | `flat` | Yes (`null`) | `9.09s` | `3437` / `2500`r / `2111`a | ✅ |
| 169 | `mc-seeded-100` | `mc-seed-035-3v3-cmos` | `en` | `0..3.3` | `500` | `no-flags` | No | `4.55s` | `2244` / `1319`r / `1247`a | ✅ |
| 170 | `mc-seeded-100` | `mc-seed-035-3v3-cmos` | `id` | `0..3.3` | `500` | `no-flags` | No | `8.16s` | `2994` / `2043`r / `1758`a | ✅ |
| 171 | `mc-seeded-100` | `mc-seed-036-1v8-mcu` | `en` | `0..1.8` | `160` | `hum` | No | `7.23s` | `3215` / `2300`r / `1988`a | ✅ |
| 172 | `mc-seeded-100` | `mc-seed-036-1v8-mcu` | `id` | `0..1.8` | `160` | `hum` | No | `7.40s` | `2922` / `1946`r / `1668`a | ✅ |
| 173 | `mc-seeded-100` | `mc-seed-037-5v0-ttl` | `en` | `0..5` | `200` | `clipping` | No | `5.16s` | `2280` / `1371`r / `1280`a | ✅ |
| 174 | `mc-seeded-100` | `mc-seed-037-5v0-ttl` | `id` | `0..5` | `200` | `clipping` | No | `10.93s` | `3755` / `2766`r / `2325`a | ✅ |
| 175 | `mc-seeded-100` | `mc-seed-038-bipolar-2v5` | `en` | `-2.5..2.5` | `250` | `timing`, `spectrum-unavailable` | Yes (`null`) | `4.92s` | `2380` / `1410`r / `1335`a | ✅ |
| 176 | `mc-seeded-100` | `mc-seed-038-bipolar-2v5` | `id` | `-2.5..2.5` | `250` | `timing`, `spectrum-unavailable` | Yes (`null`) | `7.03s` | `2442` / `1384`r / `1338`a | ✅ |
| 177 | `mc-seeded-100` | `mc-seed-039-2v5-vref` | `en` | `0..2.5` | `300` | `clipping` | No | `5.19s` | `2399` / `1476`r / `1353`a | ✅ |
| 178 | `mc-seeded-100` | `mc-seed-039-2v5-vref` | `id` | `0..2.5` | `300` | `clipping` | No | `9.30s` | `3601` / `2471`r / `2179`a | ✅ |
| 179 | `mc-seeded-100` | `mc-seed-040-3v3-cmos` | `en` | `0..3.3` | `400` | `no-flags` | No | `3.55s` | `1875` / `998`r / `966`a | ✅ |
| 180 | `mc-seeded-100` | `mc-seed-040-3v3-cmos` | `id` | `0..3.3` | `400` | `no-flags` | No | `5.68s` | `2440` / `1472`r / `1341`a | ✅ |
| 181 | `mc-seeded-100` | `mc-seed-041-1v8-mcu` | `en` | `0..1.8` | `500` | `hum` | No | `7.46s` | `2727` / `1813`r / `1552`a | ✅ |
| 182 | `mc-seeded-100` | `mc-seed-041-1v8-mcu` | `id` | `0..1.8` | `500` | `hum` | No | `9.88s` | `2917` / `1940`r / `1649`a | ✅ |
| 183 | `mc-seeded-100` | `mc-seed-042-5v0-ttl` | `en` | `0..5` | `160` | `clipping` | No | `6.63s` | `2611` / `1706`r / `1545`a | ✅ |
| 184 | `mc-seeded-100` | `mc-seed-042-5v0-ttl` | `id` | `0..5` | `160` | `clipping` | No | `10.72s` | `3463` / `2532`r / `2069`a | ✅ |
| 185 | `mc-seeded-100` | `mc-seed-043-bipolar-2v5` | `en` | `-2.5..2.5` | `200` | `timing`, `spectrum-unavailable` | Yes (`null`) | `5.48s` | `2497` / `1482`r / `1440`a | ✅ |
| 186 | `mc-seeded-100` | `mc-seed-043-bipolar-2v5` | `id` | `-2.5..2.5` | `200` | `timing`, `spectrum-unavailable` | Yes (`null`) | `6.69s` | `2600` / `1501`r / `1426`a | ✅ |
| 187 | `mc-seeded-100` | `mc-seed-044-2v5-vref` | `en` | `0..2.5` | `250` | `flat` | Yes (`null`) | `6.84s` | `2432` / `1576`r / `1409`a | ✅ |
| 188 | `mc-seeded-100` | `mc-seed-044-2v5-vref` | `id` | `0..2.5` | `250` | `flat` | Yes (`null`) | `6.69s` | `2475` / `1459`r / `1353`a | ✅ |
| 189 | `mc-seeded-100` | `mc-seed-045-3v3-cmos` | `en` | `0..3.3` | `300` | `no-flags` | No | `5.53s` | `2706` / `1777`r / `1618`a | ✅ |
| 190 | `mc-seeded-100` | `mc-seed-045-3v3-cmos` | `id` | `0..3.3` | `300` | `no-flags` | No | `6.36s` | `2773` / `1828`r / `1605`a | ✅ |
| 191 | `mc-seeded-100` | `mc-seed-046-1v8-mcu` | `en` | `0..1.8` | `400` | `hum` | No | `5.93s` | `2657` / `1710`r / `1548`a | ✅ |
| 192 | `mc-seeded-100` | `mc-seed-046-1v8-mcu` | `id` | `0..1.8` | `400` | `hum` | No | `7.75s` | `2974` / `1957`r / `1686`a | ✅ |
| 193 | `mc-seeded-100` | `mc-seed-047-5v0-ttl` | `en` | `0..5` | `500` | `clipping` | No | `7.20s` | `3100` / `2177`r / `1885`a | ✅ |
| 194 | `mc-seeded-100` | `mc-seed-047-5v0-ttl` | `id` | `0..5` | `500` | `clipping` | No | `8.73s` | `3241` / `2252`r / `1864`a | ✅ |
| 195 | `mc-seeded-100` | `mc-seed-048-bipolar-2v5` | `en` | `-2.5..2.5` | `160` | `timing`, `spectrum-unavailable` | Yes (`null`) | `4.41s` | `2215` / `1319`r / `1219`a | ✅ |
| 196 | `mc-seeded-100` | `mc-seed-048-bipolar-2v5` | `id` | `-2.5..2.5` | `160` | `timing`, `spectrum-unavailable` | Yes (`null`) | `7.17s` | `2849` / `1766`r / `1618`a | ✅ |
| 197 | `mc-seeded-100` | `mc-seed-049-2v5-vref` | `en` | `0..2.5` | `200` | `clipping` | No | `8.82s` | `3348` / `2394`r / `2107`a | ✅ |
| 198 | `mc-seeded-100` | `mc-seed-049-2v5-vref` | `id` | `0..2.5` | `200` | `clipping` | No | `7.76s` | `2733` / `1791`r / `1550`a | ✅ |
| 199 | `mc-seeded-100` | `mc-seed-050-3v3-cmos` | `en` | `0..3.3` | `250` | `no-flags` | No | `5.10s` | `2538` / `1606`r / `1488`a | ✅ |
| 200 | `mc-seeded-100` | `mc-seed-050-3v3-cmos` | `id` | `0..3.3` | `250` | `no-flags` | No | `9.14s` | `2866` / `1886`r / `1658`a | ✅ |
| 201 | `mc-seeded-100` | `mc-seed-051-1v8-mcu` | `en` | `0..1.8` | `300` | `hum` | No | `7.16s` | `3213` / `2256`r / `1983`a | ✅ |
| 202 | `mc-seeded-100` | `mc-seed-051-1v8-mcu` | `id` | `0..1.8` | `300` | `hum` | No | `10.90s` | `4217` / `3255`r / `2649`a | ✅ |
| 203 | `mc-seeded-100` | `mc-seed-052-5v0-ttl` | `en` | `0..5` | `400` | `clipping` | No | `4.70s` | `2314` / `1416`r / `1315`a | ✅ |
| 204 | `mc-seeded-100` | `mc-seed-052-5v0-ttl` | `id` | `0..5` | `400` | `clipping` | No | `8.06s` | `3157` / `2210`r / `1845`a | ✅ |
| 205 | `mc-seeded-100` | `mc-seed-053-bipolar-2v5` | `en` | `-2.5..2.5` | `500` | `timing`, `spectrum-unavailable` | Yes (`null`) | `6.00s` | `2710` / `1673`r / `1564`a | ✅ |
| 206 | `mc-seeded-100` | `mc-seed-053-bipolar-2v5` | `id` | `-2.5..2.5` | `500` | `timing`, `spectrum-unavailable` | Yes (`null`) | `8.70s` | `2222` / `1107`r / `1122`a | ✅ |
| 207 | `mc-seeded-100` | `mc-seed-054-2v5-vref` | `en` | `0..2.5` | `160` | `flat` | Yes (`null`) | `4.42s` | `2156` / `1283`r / `1196`a | ✅ |
| 208 | `mc-seeded-100` | `mc-seed-054-2v5-vref` | `id` | `0..2.5` | `160` | `flat` | Yes (`null`) | `5.87s` | `2498` / `1510`r / `1418`a | ✅ |
| 209 | `mc-seeded-100` | `mc-seed-055-3v3-cmos` | `en` | `0..3.3` | `200` | `no-flags` | No | `4.61s` | `2291` / `1396`r / `1292`a | ✅ |
| 210 | `mc-seeded-100` | `mc-seed-055-3v3-cmos` | `id` | `0..3.3` | `200` | `no-flags` | No | `6.82s` | `2875` / `1932`r / `1708`a | ✅ |
| 211 | `mc-seeded-100` | `mc-seed-056-1v8-mcu` | `en` | `0..1.8` | `250` | `hum` | No | `6.87s` | `3168` / `2241`r / `1970`a | ✅ |
| 212 | `mc-seeded-100` | `mc-seed-056-1v8-mcu` | `id` | `0..1.8` | `250` | `hum` | No | `9.52s` | `3362` / `2338`r / `2001`a | ✅ |
| 213 | `mc-seeded-100` | `mc-seed-057-5v0-ttl` | `en` | `0..5` | `300` | `clipping` | No | `6.18s` | `2831` / `1921`r / `1688`a | ✅ |
| 214 | `mc-seeded-100` | `mc-seed-057-5v0-ttl` | `id` | `0..5` | `300` | `clipping` | No | `5.88s` | `2009` / `1054`r / `994`a | ✅ |
| 215 | `mc-seeded-100` | `mc-seed-058-bipolar-2v5` | `en` | `-2.5..2.5` | `400` | `timing`, `spectrum-unavailable` | Yes (`null`) | `3.55s` | `1802` / `889`r / `881`a | ✅ |
| 216 | `mc-seeded-100` | `mc-seed-058-bipolar-2v5` | `id` | `-2.5..2.5` | `400` | `timing`, `spectrum-unavailable` | Yes (`null`) | `6.19s` | `2539` / `1556`r / `1381`a | ✅ |
| 217 | `mc-seeded-100` | `mc-seed-059-2v5-vref` | `en` | `0..2.5` | `500` | `clipping` | No | `5.84s` | `2478` / `1584`r / `1409`a | ✅ |
| 218 | `mc-seeded-100` | `mc-seed-059-2v5-vref` | `id` | `0..2.5` | `500` | `clipping` | No | `10.13s` | `3008` / `2066`r / `1702`a | ✅ |
| 219 | `mc-seeded-100` | `mc-seed-060-3v3-cmos` | `en` | `0..3.3` | `160` | `no-flags` | No | `6.35s` | `3152` / `2257`r / `1987`a | ✅ |
| 220 | `mc-seeded-100` | `mc-seed-060-3v3-cmos` | `id` | `0..3.3` | `160` | `no-flags` | No | `6.99s` | `2444` / `1436`r / `1361`a | ✅ |
| 221 | `mc-seeded-100` | `mc-seed-061-1v8-mcu` | `en` | `0..1.8` | `200` | `hum` | No | `9.09s` | `3404` / `2428`r / `2082`a | ✅ |
| 222 | `mc-seeded-100` | `mc-seed-061-1v8-mcu` | `id` | `0..1.8` | `200` | `hum` | No | `10.19s` | `3480` / `2463`r / `2111`a | ✅ |
| 223 | `mc-seeded-100` | `mc-seed-062-5v0-ttl` | `en` | `0..5` | `250` | `clipping` | No | `7.17s` | `2722` / `1759`r / `1612`a | ✅ |
| 224 | `mc-seeded-100` | `mc-seed-062-5v0-ttl` | `id` | `0..5` | `250` | `clipping` | No | `8.47s` | `3288` / `2278`r / `1948`a | ✅ |
| 225 | `mc-seeded-100` | `mc-seed-063-bipolar-2v5` | `en` | `-2.5..2.5` | `300` | `timing`, `spectrum-unavailable` | Yes (`null`) | `7.17s` | `2628` / `1657`r / `1518`a | ✅ |
| 226 | `mc-seeded-100` | `mc-seed-063-bipolar-2v5` | `id` | `-2.5..2.5` | `300` | `timing`, `spectrum-unavailable` | Yes (`null`) | `5.26s` | `2348` / `1372`r / `1270`a | ✅ |
| 227 | `mc-seeded-100` | `mc-seed-064-2v5-vref` | `en` | `0..2.5` | `400` | `flat` | Yes (`null`) | `4.44s` | `2326` / `1443`r / `1364`a | ✅ |
| 228 | `mc-seeded-100` | `mc-seed-064-2v5-vref` | `id` | `0..2.5` | `400` | `flat` | Yes (`null`) | `7.05s` | `2899` / `1943`r / `1696`a | ✅ |
| 229 | `mc-seeded-100` | `mc-seed-065-3v3-cmos` | `en` | `0..3.3` | `500` | `no-flags` | No | `4.99s` | `2418` / `1502`r / `1377`a | ✅ |
| 230 | `mc-seeded-100` | `mc-seed-065-3v3-cmos` | `id` | `0..3.3` | `500` | `no-flags` | No | `6.60s` | `3011` / `2029`r / `1819`a | ✅ |
| 231 | `mc-seeded-100` | `mc-seed-066-1v8-mcu` | `en` | `0..1.8` | `160` | `hum` | No | `5.01s` | `2330` / `1429`r / `1291`a | ✅ |
| 232 | `mc-seeded-100` | `mc-seed-066-1v8-mcu` | `id` | `0..1.8` | `160` | `hum` | No | `7.62s` | `2985` / `1963`r / `1711`a | ✅ |
| 233 | `mc-seeded-100` | `mc-seed-067-5v0-ttl` | `en` | `0..5` | `200` | `clipping` | No | `8.16s` | `3447` / `2567`r / `2140`a | ✅ |
| 234 | `mc-seeded-100` | `mc-seed-067-5v0-ttl` | `id` | `0..5` | `200` | `clipping` | No | `5.91s` | `2467` / `1496`r / `1354`a | ✅ |
| 235 | `mc-seeded-100` | `mc-seed-068-bipolar-2v5` | `en` | `-2.5..2.5` | `250` | `timing`, `spectrum-unavailable` | Yes (`null`) | `5.58s` | `2396` / `1419`r / `1376`a | ✅ |
| 236 | `mc-seeded-100` | `mc-seed-068-bipolar-2v5` | `id` | `-2.5..2.5` | `250` | `timing`, `spectrum-unavailable` | Yes (`null`) | `4.34s` | `1840` / `860`r / `847`a | ✅ |
| 237 | `mc-seeded-100` | `mc-seed-069-2v5-vref` | `en` | `0..2.5` | `300` | `clipping` | No | `4.34s` | `2166` / `1233`r / `1195`a | ✅ |
| 238 | `mc-seeded-100` | `mc-seed-069-2v5-vref` | `id` | `0..2.5` | `300` | `clipping` | No | `6.64s` | `2614` / `1690`r / `1431`a | ✅ |
| 239 | `mc-seeded-100` | `mc-seed-070-3v3-cmos` | `en` | `0..3.3` | `400` | `no-flags` | No | `4.83s` | `2267` / `1379`r / `1285`a | ✅ |
| 240 | `mc-seeded-100` | `mc-seed-070-3v3-cmos` | `id` | `0..3.3` | `400` | `no-flags` | No | `7.56s` | `3029` / `2052`r / `1771`a | ✅ |
| 241 | `mc-seeded-100` | `mc-seed-071-1v8-mcu` | `en` | `0..1.8` | `500` | `hum` | No | `5.23s` | `2381` / `1494`r / `1325`a | ✅ |
| 242 | `mc-seeded-100` | `mc-seed-071-1v8-mcu` | `id` | `0..1.8` | `500` | `hum` | No | `11.08s` | `3334` / `2355`r / `1966`a | ✅ |
| 243 | `mc-seeded-100` | `mc-seed-072-5v0-ttl` | `en` | `0..5` | `160` | `clipping` | No | `4.92s` | `2127` / `1244`r / `1172`a | ✅ |
| 244 | `mc-seeded-100` | `mc-seed-072-5v0-ttl` | `id` | `0..5` | `160` | `clipping` | No | `7.26s` | `2861` / `1901`r / `1622`a | ✅ |
| 245 | `mc-seeded-100` | `mc-seed-073-bipolar-2v5` | `en` | `-2.5..2.5` | `200` | `timing`, `spectrum-unavailable` | Yes (`null`) | `4.65s` | `2312` / `1372`r / `1294`a | ✅ |
| 246 | `mc-seeded-100` | `mc-seed-073-bipolar-2v5` | `id` | `-2.5..2.5` | `200` | `timing`, `spectrum-unavailable` | Yes (`null`) | `5.38s` | `2284` / `1235`r / `1196`a | ✅ |
| 247 | `mc-seeded-100` | `mc-seed-074-2v5-vref` | `en` | `0..2.5` | `250` | `flat` | Yes (`null`) | `5.42s` | `2493` / `1597`r / `1444`a | ✅ |
| 248 | `mc-seeded-100` | `mc-seed-074-2v5-vref` | `id` | `0..2.5` | `250` | `flat` | Yes (`null`) | `6.43s` | `2584` / `1576`r / `1454`a | ✅ |
| 249 | `mc-seeded-100` | `mc-seed-075-3v3-cmos` | `en` | `0..3.3` | `300` | `no-flags` | No | `4.18s` | `2053` / `1182`r / `1109`a | ✅ |
| 250 | `mc-seeded-100` | `mc-seed-075-3v3-cmos` | `id` | `0..3.3` | `300` | `no-flags` | No | `5.20s` | `2227` / `1295`r / `1207`a | ✅ |
| 251 | `mc-seeded-100` | `mc-seed-076-1v8-mcu` | `en` | `0..1.8` | `400` | `hum` | No | `6.43s` | `2899` / `1989`r / `1734`a | ✅ |
| 252 | `mc-seeded-100` | `mc-seed-076-1v8-mcu` | `id` | `0..1.8` | `400` | `hum` | No | `9.04s` | `2950` / `1923`r / `1644`a | ✅ |
| 253 | `mc-seeded-100` | `mc-seed-077-5v0-ttl` | `en` | `0..5` | `500` | `clipping` | No | `7.18s` | `2845` / `1926`r / `1662`a | ✅ |
| 254 | `mc-seeded-100` | `mc-seed-077-5v0-ttl` | `id` | `0..5` | `500` | `clipping` | No | `5.94s` | `2437` / `1474`r / `1321`a | ✅ |
| 255 | `mc-seeded-100` | `mc-seed-078-bipolar-2v5` | `en` | `-2.5..2.5` | `160` | `timing`, `spectrum-unavailable` | Yes (`null`) | `4.85s` | `2308` / `1386`r / `1265`a | ✅ |
| 256 | `mc-seeded-100` | `mc-seed-078-bipolar-2v5` | `id` | `-2.5..2.5` | `160` | `timing`, `spectrum-unavailable` | Yes (`null`) | `6.50s` | `2670` / `1656`r / `1480`a | ✅ |
| 257 | `mc-seeded-100` | `mc-seed-079-2v5-vref` | `en` | `0..2.5` | `200` | `clipping` | No | `5.94s` | `2527` / `1648`r / `1461`a | ✅ |
| 258 | `mc-seeded-100` | `mc-seed-079-2v5-vref` | `id` | `0..2.5` | `200` | `clipping` | No | `9.91s` | `3838` / `2913`r / `2364`a | ✅ |
| 259 | `mc-seeded-100` | `mc-seed-080-3v3-cmos` | `en` | `0..3.3` | `250` | `no-flags` | No | `7.85s` | `2526` / `1573`r / `1456`a | ✅ |
| 260 | `mc-seeded-100` | `mc-seed-080-3v3-cmos` | `id` | `0..3.3` | `250` | `no-flags` | No | `7.40s` | `2664` / `1594`r / `1507`a | ✅ |
| 261 | `mc-seeded-100` | `mc-seed-081-1v8-mcu` | `en` | `0..1.8` | `300` | `hum` | No | `5.87s` | `2529` / `1601`r / `1471`a | ✅ |
| 262 | `mc-seeded-100` | `mc-seed-081-1v8-mcu` | `id` | `0..1.8` | `300` | `hum` | No | `9.21s` | `2820` / `1842`r / `1576`a | ✅ |
| 263 | `mc-seeded-100` | `mc-seed-082-5v0-ttl` | `en` | `0..5` | `400` | `clipping` | No | `5.05s` | `2343` / `1428`r / `1306`a | ✅ |
| 264 | `mc-seeded-100` | `mc-seed-082-5v0-ttl` | `id` | `0..5` | `400` | `clipping` | No | `7.46s` | `2805` / `1854`r / `1576`a | ✅ |
| 265 | `mc-seeded-100` | `mc-seed-083-bipolar-2v5` | `en` | `-2.5..2.5` | `500` | `timing`, `spectrum-unavailable` | Yes (`null`) | `3.63s` | `1806` / `856`r / `880`a | ✅ |
| 266 | `mc-seeded-100` | `mc-seed-083-bipolar-2v5` | `id` | `-2.5..2.5` | `500` | `timing`, `spectrum-unavailable` | Yes (`null`) | `6.13s` | `2573` / `1580`r / `1422`a | ✅ |
| 267 | `mc-seeded-100` | `mc-seed-084-2v5-vref` | `en` | `0..2.5` | `160` | `flat` | Yes (`null`) | `5.75s` | `2379` / `1525`r / `1369`a | ✅ |
| 268 | `mc-seeded-100` | `mc-seed-084-2v5-vref` | `id` | `0..2.5` | `160` | `flat` | Yes (`null`) | `6.46s` | `2320` / `1435`r / `1264`a | ✅ |
| 269 | `mc-seeded-100` | `mc-seed-085-3v3-cmos` | `en` | `0..3.3` | `200` | `no-flags` | No | `5.42s` | `2326` / `1385`r / `1281`a | ✅ |
| 270 | `mc-seeded-100` | `mc-seed-085-3v3-cmos` | `id` | `0..3.3` | `200` | `no-flags` | No | `6.96s` | `2648` / `1643`r / `1490`a | ✅ |
| 271 | `mc-seeded-100` | `mc-seed-086-1v8-mcu` | `en` | `0..1.8` | `250` | `hum` | No | `5.29s` | `2575` / `1650`r / `1515`a | ✅ |
| 272 | `mc-seeded-100` | `mc-seed-086-1v8-mcu` | `id` | `0..1.8` | `250` | `hum` | No | `5.83s` | `2444` / `1429`r / `1337`a | ✅ |
| 273 | `mc-seeded-100` | `mc-seed-087-5v0-ttl` | `en` | `0..5` | `300` | `clipping` | No | `7.49s` | `3269` / `2400`r / `2031`a | ✅ |
| 274 | `mc-seeded-100` | `mc-seed-087-5v0-ttl` | `id` | `0..5` | `300` | `clipping` | No | `10.82s` | `3770` / `2780`r / `2258`a | ✅ |
| 275 | `mc-seeded-100` | `mc-seed-088-bipolar-2v5` | `en` | `-2.5..2.5` | `400` | `timing`, `spectrum-unavailable` | Yes (`null`) | `4.25s` | `2324` / `1305`r / `1343`a | ✅ |
| 276 | `mc-seeded-100` | `mc-seed-088-bipolar-2v5` | `id` | `-2.5..2.5` | `400` | `timing`, `spectrum-unavailable` | Yes (`null`) | `7.72s` | `2553` / `1506`r / `1355`a | ✅ |
| 277 | `mc-seeded-100` | `mc-seed-089-2v5-vref` | `en` | `0..2.5` | `500` | `clipping` | No | `4.81s` | `2165` / `1272`r / `1177`a | ✅ |
| 278 | `mc-seeded-100` | `mc-seed-089-2v5-vref` | `id` | `0..2.5` | `500` | `clipping` | No | `7.62s` | `2901` / `1953`r / `1628`a | ✅ |
| 279 | `mc-seeded-100` | `mc-seed-090-3v3-cmos` | `en` | `0..3.3` | `160` | `no-flags` | No | `3.93s` | `1991` / `1111`r / `1053`a | ✅ |
| 280 | `mc-seeded-100` | `mc-seed-090-3v3-cmos` | `id` | `0..3.3` | `160` | `no-flags` | No | `5.25s` | `2375` / `1418`r / `1309`a | ✅ |
| 281 | `mc-seeded-100` | `mc-seed-091-1v8-mcu` | `en` | `0..1.8` | `200` | `hum` | No | `6.31s` | `2779` / `1846`r / `1629`a | ✅ |
| 282 | `mc-seeded-100` | `mc-seed-091-1v8-mcu` | `id` | `0..1.8` | `200` | `hum` | No | `9.04s` | `3276` / `2280`r / `1958`a | ✅ |
| 283 | `mc-seeded-100` | `mc-seed-092-5v0-ttl` | `en` | `0..5` | `250` | `clipping` | No | `4.58s` | `2104` / `1207`r / `1115`a | ✅ |
| 284 | `mc-seeded-100` | `mc-seed-092-5v0-ttl` | `id` | `0..5` | `250` | `clipping` | No | `7.73s` | `2858` / `1922`r / `1607`a | ✅ |
| 285 | `mc-seeded-100` | `mc-seed-093-bipolar-2v5` | `en` | `-2.5..2.5` | `300` | `timing`, `spectrum-unavailable` | Yes (`null`) | `5.64s` | `2674` / `1631`r / `1562`a | ✅ |
| 286 | `mc-seeded-100` | `mc-seed-093-bipolar-2v5` | `id` | `-2.5..2.5` | `300` | `timing`, `spectrum-unavailable` | Yes (`null`) | `7.43s` | `2675` / `1661`r / `1527`a | ✅ |
| 287 | `mc-seeded-100` | `mc-seed-094-2v5-vref` | `en` | `0..2.5` | `400` | `flat` | Yes (`null`) | `4.85s` | `2287` / `1405`r / `1284`a | ✅ |
| 288 | `mc-seeded-100` | `mc-seed-094-2v5-vref` | `id` | `0..2.5` | `400` | `flat` | Yes (`null`) | `5.16s` | `2234` / `1351`r / `1207`a | ✅ |
| 289 | `mc-seeded-100` | `mc-seed-095-3v3-cmos` | `en` | `0..3.3` | `500` | `no-flags` | No | `5.19s` | `2500` / `1577`r / `1439`a | ✅ |
| 290 | `mc-seeded-100` | `mc-seed-095-3v3-cmos` | `id` | `0..3.3` | `500` | `no-flags` | No | `7.66s` | `2830` / `1847`r / `1648`a | ✅ |
| 291 | `mc-seeded-100` | `mc-seed-096-1v8-mcu` | `en` | `0..1.8` | `160` | `hum` | No | `6.48s` | `2721` / `1817`r / `1592`a | ✅ |
| 292 | `mc-seeded-100` | `mc-seed-096-1v8-mcu` | `id` | `0..1.8` | `160` | `hum` | No | `6.57s` | `2570` / `1629`r / `1429`a | ✅ |
| 293 | `mc-seeded-100` | `mc-seed-097-5v0-ttl` | `en` | `0..5` | `200` | `clipping` | No | `6.08s` | `2534` / `1668`r / `1469`a | ✅ |
| 294 | `mc-seeded-100` | `mc-seed-097-5v0-ttl` | `id` | `0..5` | `200` | `clipping` | No | `5.99s` | `2410` / `1485`r / `1316`a | ✅ |
| 295 | `mc-seeded-100` | `mc-seed-098-bipolar-2v5` | `en` | `-2.5..2.5` | `250` | `timing`, `spectrum-unavailable` | Yes (`null`) | `5.34s` | `2650` / `1674`r / `1565`a | ✅ |
| 296 | `mc-seeded-100` | `mc-seed-098-bipolar-2v5` | `id` | `-2.5..2.5` | `250` | `timing`, `spectrum-unavailable` | Yes (`null`) | `6.83s` | `3082` / `2021`r / `1860`a | ✅ |
| 297 | `mc-seeded-100` | `mc-seed-099-2v5-vref` | `en` | `0..2.5` | `300` | `clipping` | No | `7.23s` | `2825` / `1925`r / `1641`a | ✅ |
| 298 | `mc-seeded-100` | `mc-seed-099-2v5-vref` | `id` | `0..2.5` | `300` | `clipping` | No | `7.90s` | `3300` / `2330`r / `2010`a | ✅ |
| 299 | `mc-seeded-100` | `mc-seed-100-3v3-cmos` | `en` | `0..3.3` | `400` | `no-flags` | No | `4.23s` | `2059` / `1141`r / `1093`a | ✅ |
| 300 | `mc-seeded-100` | `mc-seed-100-3v3-cmos` | `id` | `0..3.3` | `400` | `no-flags` | No | `6.43s` | `2767` / `1829`r / `1657`a | ✅ |
