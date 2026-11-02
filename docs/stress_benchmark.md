# Live Stress & Sweep Benchmark — Meta Muse Spark Open (220/220 Verified Calls)

- **Timestamp (UTC)**: `2026-11-02T00:05:23.879278+00:00`
- **Total Verified Live Calls**: **`220 / 220` (`100%` pass rate)**
- **Total Tokens Burned (Measured)**: **`517,391` tokens** (`308,597` internal reasoning tokens)
- **Providers Benchmarked Head-to-Head**:
  1. **Fireworks (`accounts/fireworks/models/muse-spark-open`)**: **`110 / 110` passed** (`224,255` total tokens, `121,035` reasoning tokens, latency `4.32s–24.55s`, mean `13.83s`)
  2. **Baseten (`meta-models/muse-spark-open-1026`)**: **`110 / 110` passed** (`293,136` total tokens, `187,562` reasoning tokens, latency `3.71s–11.65s`, mean `6.86s`)
- **Validation Criteria (`validateExplanation()` in `api/analyze.mjs`)**:
  - Valid JSON response with non-empty `summary` and explicit `uncertainty` statement.
  - `evidenceIds[]` is a non-empty subset of `[E1, E2, E3, E4, E5, E6]`.
  - `findingIds[]` is a non-empty subset of the deterministic `report.findings` computed by `engine.mjs`.
  - Whenever `E4` is withheld (`null` due to timestamp gaps, `jitter > 2%`, `< 1.0 s` duration, `< 120 Hz` sample rate, or flat zero-AC capture), the model never fabricates a 50 Hz spectral percentage.
- **Honesty & Scope Boundary**: All 220 live model calls evaluate synthetic bench signals generated deterministically by `engine.mjs` (`hardwareEvaluated: false`).

---

## 1. Benchmark Suite Breakdown (220 Live Calls)

| Suite | Scenarios × Langs | Fireworks (`accounts/fireworks/models/muse-spark-open`) | Baseten (`meta-models/muse-spark-open-1026`) | Total Calls | Key Guardrail Verified |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Baseline Preset Audit** (`docs/local_live_matrix.json`) | `5 × 2` | `10 / 10` (`24,723` tok) | `10 / 10` (`25,346` tok) | **20 / 20** | 5 core presets (`healthy`, `hum`, `clipping`, `gaps`, `flat`) in `en` & `id` |
| **Multi-Rate Evaluation Matrix** (`multi-rate-matrix`) | `15 × 2` | `30 / 30` | `30 / 30` | **60 / 60** | `200 Hz`, `250 Hz`, `500 Hz` rate invariance across all 5 fault classes |
| **Boundary & Multi-Fault Stress** (`boundary-stress`) | `15 × 2` | `30 / 30` | `30 / 30` | **60 / 60** | Exact threshold boundaries (`14.2%` vs `15.8%` hum, `0.9%` vs `1.2%` clip, `jitter > 2%` with 0 gaps, `5V`/`±2.5V` rails, multi-faults) |
| **50 Hz SNR & Amplitude Sweep** (`snr-50hz-sweep`) | `6 × 2` | `12 / 12` | `12 / 12` | **24 / 24** | Monotonic `E4` band-share transition across `0.02V–0.85V` 50 Hz interference on `0.30V` carrier |
| **ADC Bit-Depth Quantization Sweep** (`adc-quantization-sweep`) | `8 × 2` | `16 / 16` | `16 / 16` | **32 / 32** | `6-bit`, `8-bit`, `10-bit`, `12-bit` step quantization noise on clean and 50 Hz hum signals |
| **Acquisition & Low-Power Rail Stress** (`acquisition-stress`) | `6 × 2` | `12 / 12` | `12 / 12` | **24 / 24** | 3-gap dropout bursts, `0.0 V` ground clipping/short, `1.8 V` MCU rails, `125 Hz` Nyquist limit |
| **Total** | **110 / provider** | **`110 / 110` (`224,255` tok)** | **`110 / 110` (`293,136` tok)** | **`220 / 220` (`517,391` tok)** | **100% schema, ID-subset, and withheld-spectrum compliance** |

---

## 2. Head-to-Head Stress Results (50 Scenarios × EN/ID × 2 Providers = 200 Stress Calls)

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
