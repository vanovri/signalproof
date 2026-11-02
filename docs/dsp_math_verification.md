# SignalProof DSP Math Verification

> **Scope:** Complete analytical derivation of every deterministic signal measurement in `engine.mjs`, the Hann-windowed radix-2 FFT in `spectrum()`, and the evidence ledger in `analyze()`. This document links each equation to its implementation line and to the test that proves it. All signals are synthetic bench captures; no hardware performance is implied. Contains complete analytical DSP math, Hann windowing equations, bin index bounds, and test proofs.

---

## 0. Notation & Sample Model

Capture rows: `rows = [[t_0, v_0], …, [t_{L-1}, v_{L-1}]]` with `L ∈ [64, 32768]` (`LIMIT = 32768`).

```
dt_i   = t_{i+1} – t_i          (i = 0 … L-2)
step   = median(dt_i)           s  (robust clock estimate)
fs     = 1 / step               Hz (inferred sample rate)
dc_μ   = (1/L) Σ v_i            V  (E1)
span   = railMax – railMin      V
duration = t_{L-1} – t_0         s  (E6)
```

All methods are zero-dependency JavaScript in `engine.mjs:3-77` and `api/analyze.mjs:8-16`.

---

## 1. Timebase Estimation: Median, Gaps & Jitter

### 1.1 Median interval

```js
median = a => { b=[...a].sort((x,y)=>x-y); m=b.length>>1; return b.length%2?b[m]:(b[m-1]+b[m])/2; }
step   = median(dt)
fs     = 1/step
```

Median is used (not mean) so a single gap does not bias the clock estimate. Proven by `engine.test.mjs: timestamp gaps withhold …` – `demo('gaps')` has one interval ~31x step; median remains `0.004 s` (250 Hz) while mean would shift.

### 1.2 Gap detection

```
gap  iff  dt_i > 1.5 × step
gaps = |{ i : dt_i > 1.5·step }|          (−)  (E5 integer)
```

`1.5x` is the guard band: regular jitter (<2%) never exceeds it; loss of 1+ samples does. Example – `demo('gaps')` drops indices 400-429 (30 samples). With `step=0.004 s`, discontinuity is `dt_gap = 0.004*31 = 0.124 s ≈ 31*step` → 1 gap. See `engine.test.mjs:20-26` (`E5 == 1`).

### 1.3 Jitter (relative RMS, gaps excluded)

```
dt'  = { dt_i : dt_i ≤ 1.5·step }     (gap-free intervals)
jitter = sqrt( mean( (dt' – step)^2 ) ) / step     (dimensionless)
E5 jitter % = jitter × 100
```

Implementation `engine.mjs:53`:

```js
jitter = Math.sqrt(mean(dt.filter(d=>d<=1.5*step).map(d=>(d-step)**2))) / step
```

RMS is dimensionally consistent with the hum-detector guard (`jitter > 0.02` = 2%). Test `jitter above 2% without gaps` (`engine.test.mjs:111-164`) constructs intervals `0.875*step, 1.0*step, 1.125*step`:

```
mean((dt-step)^2) = ( (-0.125)^2 + 0^2 + 0.125^2 )/3 * step^2 ≈ 0.010416*step^2
jitter = sqrt(0.010416) ≈ 0.10206 = 10.2% > 2%
```

Report correctly withholds spectrum (`E4==null`, `spectrum.length==0`) and flags `timing`.

### 1.4 Withheld-spectrum guardrail

```js
fftSamples = 2**floor(log2(L))
fftValid = gaps===0 && jitter<=0.02 && duration>=1.0 && fs>=120 && fs/fftSamples<=1+1e-9
fft      = fftValid ? spectrum(values, fs) : null
E4       = fft && total>1e-18 ? 100*line/total : null
spectrum = fft?.bins ?? []
```

Proven by four test families:

Update 2026-11-02: the retained FFT block must have bin spacing at most 1 Hz. A 1,501-sample capture at 1,500 Hz spans one second, but the retained 1,024-sample FFT block has 1.465 Hz bin spacing. The engine now withholds that spectrum. The 1e-9 Hz tolerance handles timestamp rounding at the boundary. See `tests/improvements.test.mjs`.

The FFT uses only the first largest power-of-two block. `spectralWindow` exposes sample count, coverage, and bin spacing. Later capture changes may be missed. Bin spacing is not the same as physical frequency resolving power. Prior line-number references in this historical derivation refer to the original implementation.

| Condition | Example | Expected |
|-----------|---------|----------|
| `gaps>0` | `demo('gaps')` | E4 null + `spectrum-unavailable` |
| `jitter>0.02` | 10.2% jitter | E4 null + `timing` |
| `fs<120` | `demo('healthy',{fs:100})` | E4 null |
| `duration<1` | `demo('healthy',{n:64})` → 0.252s | E4 null |

See `engine.test.mjs:44-46` and jitter test.

---

## 2. DC Mean, AC RMS, Clipping & Flat Detection

### 2.1 DC mean (E1)

```
μ = (1/L) Σ v_i
```

`engine.mjs:3` `mean = a => a.reduce((s,x)=>s+x,0)/a.length` and `50: dc=mean(values)`. Verified against analytic carrier: `healthy` carrier `0.32*sin(12Hz)+0.08*sin(23Hz)` on `1.65V` → mean of sines over integer periods 0 → μ≈1.65V.

### 2.2 AC RMS (E2)

```
rms = sqrt( (1/L) Σ (v_i – μ)^2 )          V
```

`engine.mjs:55` `rms=Math.sqrt(mean(values.map(v=>(v-dc)**2)))`.

Analytic healthy carrier (uncorrelated sines A1=0.32, A2=0.08):

```
RMS_healthy = sqrt( (A1^2 + A2^2)/2 )
            = sqrt( (0.1024 + 0.0064)/2 )
            = sqrt(0.0544) = 0.2332380757938118 V
```

Test `healthy reference: analytic RMS …` (`engine.test.mjs:5-10`) asserts `abs(r.evidence[1].value - sqrt((.32^2+.08^2)/2)) < 1e-10`. `demo('flat')` v=1.65 constant → rms≈2.46e-14 V → `flat` flag.

### 2.3 Near-rail samples (E3)

```
nearRail iff  v ≤ railMin + 0.005*span  OR  v ≥ railMax – 0.005*span   (0.5% guard)
clippingPct = 100 * |nearRail| / L          %
Flag 'clipping' iff clippingPct ≥ 1%
```

Example `demo('clipping')` `v=clamp(1.65+2.3*sin(12t),0,3.3)` drives 49.6% into rails → flagged. Asymmetric rail tests (±2.5V, 0-1.8V) verify same formula at `engine.test.mjs:186-210`.

### 2.4 Flat (no AC variation)

```
flat iff  rms < span * 0.0001      (0.01% of ADC span)
```

Default span 3.3V threshold `0.00033V`. Healthy `0.233V` ≫ threshold (pass); flat `2.4e-14V` ≪ threshold (flag). Proven by `flat captures report …` test.

---

## 3. Hann Window & FFT Core (`engine.mjs:32-42`)

### 3.1 Power-of-two truncation

```
N = 2^floor(log2(L))          largest POT ≤ L
raw = values[0 … N-1]    (tail beyond N is discarded)
```

Guarantees radix-2 DIT. Mapping proven in `spectrum exact power-of-two …` and `spectrum non-power-of-two truncation …`:

| L | N | Resolution Δf=fs/N (fs=250) |
|---|---|---|
| 100 | 64 | 3.906 Hz |
| 1000 | 512 | 0.488 Hz |
| 3000 | 2048 | 0.122 Hz |
| 511 | 256 | 0.977 Hz |
| 512 | 512 | 0.488 Hz |
| 1025 | 1024 | 0.244 Hz |

`humTail` test proves discarding tail: hum injected only at i≥600 beyond N=512 → pctTail<0.1% (not captured).

### 3.2 DC removal + Hann window

```
w[n] = 0.5 – 0.5*cos( 2π*n / (N-1) )    ,  n=0…N-1      (Hann)
re[n] = (x[n] – μ)*w[n]                ,  μ = mean(raw)
im[n] = 0
```

Code `engine.mjs:35`:

```js
const raw=values.slice(0,n), dc=mean(raw);
const re=raw.map((v,i)=>(v-dc)*(.5-.5*Math.cos(2*Math.PI*i/(n-1)))), im=new Array(n).fill(0);
```

Hann properties:

- Peak 0 at n=0,N-1, 1 at centre, coherent gain G=0.5 (not corrected – only power ratios matter).
- Main-lobe width 4*Δf vs rectangular 2*Δf; side-lobe –31dB vs –13dB, trading leakage for resolution – critical for 50Hz detection with Δf≈0.5Hz.
- Applied per-sample after DC removal so P[0] does not leak.

Check: `spectrum(constant,fs).bins[0].power < 1e-12` (`engine.test.mjs:176`). 50Hz tone at fs=1024,N=1024 peaks at hz=50, Δf=1Hz (`Hann FFT identifies a coherent 50Hz tone`).

### 3.3 Radix-2 DIT FFT (in-place)

Algorithm `engine.mjs:36-41`:

```
1. Bit-reversal permutation: for i<j swap re[i]↔re[j]
2. For len=2,4,8,…,N:
     for base=0,len,2*len,…:
       for j=0…len/2-1:
         angle = –2π*j/len                           (twiddle W_N^j)
         r =  re[l]*cos(angle) – im[l]*sin(angle)
         q =  re[l]*sin(angle) + im[l]*cos(angle)
         re[l] = re[k] – r;  im[l] = im[k] – q
         re[k] = re[k] + r;  im[k] = im[k] + q
         where k=base+j , l=k+len/2
```

Textbook decimation-in-time Cooley-Tukey butterfly with twiddle `W_len^j = exp(–2πi*j/len)`. No per-stage scaling; normalization deferred to power.

### 3.4 Power spectrum & normalization

```js
resolutionHz = fs / N
bins = [ { hz: i*fs/N , power: (re[i]^2 + im[i]^2) / N^2 }  for i=0…N/2 ]
```

- `power = (re^2+im^2)/N^2` – unitary scaling (Parseval up to Hann gain). Only Nyquist inclusive `N/2+1` bins (conjugate symmetric beyond).
- `resolutionHz = fs/N` – bin spacing. Verified `engine.test.mjs:14` (N=1024,fs=1024→1Hz) and POT tests.
- Example resolutions: 250Hz/512→0.48828Hz; 500Hz/1024→0.48828Hz; 1024Hz/1024→1Hz.

---

## 4. Spectral Band Powers & Bin Index Bounds

### 4.1 Frequency limits

```
Nyquist      = fs/2
total band   = 5 Hz  to  min(200 Hz, Nyquist)       (denominator)
line band    = 48 Hz to  52 Hz                      (numerator)
```

Code `engine.mjs:59-61`:

```js
total = fft ? fft.bins.filter(b=>b.hz>=5  && b.hz<=Math.min(200,fs/2)).reduce((s,b)=>s+b.power,0) : 0
line  = fft ? fft.bins.filter(b=>b.hz>=48 && b.hz<=52).reduce((s,b)=>s+b.power,0) : 0
linePowerPct = fft && total>1e-18 ? 100*line/total : null
```

5Hz low bound removes DC residue/drift; 200Hz upper covers hum harmonics; capped at Nyquist (fs=125→62.5Hz).

### 4.2 Bin index bounds (inclusive)

```
bin i qualifies for total  iff  5 ≤ i*Δf ≤ min(200, fs/2)
bin i qualifies for line   iff 48 ≤ i*Δf ≤ 52
```

Integer bounds:

```
k_low_total  = ceil (  5 / Δf )        k_high_total = floor( min(200, fs/2) / Δf )
k_low_line   = ceil ( 48 / Δf )        k_high_line  = floor( 52 / Δf )
total = Σ_{k=k_low_total}^{k_high_total} P[k]
line  = Σ_{k=k_low_line }^{k_high_line } P[k]
```

Worked default 250Hz (N=512, Δf=0.48828125Hz, Nyquist=125Hz):

```
k_low_total  = ceil(5/0.48828)   = 11  → 5.371 Hz
k_high_total = floor(125/0.48828)= 256 → 125 Hz (200 clipped)
k_low_line   = ceil(48/0.48828)  = 99  → 48.340 Hz
k_high_line  = floor(52/0.48828) = 106 → 51.758 Hz
  8 bins (99-106) covering 50Hz plus Hann leakage.
```

1024Hz/1024-point (Δf=1Hz): k_low_line=48, k_high_line=52 → bins 48-52 inclusive (5 bins).

Slow 100Hz (Nyquist 50Hz): total 5-50Hz, line 48-50Hz; engine withholds (fs<120) so documented not flagged.

Proofs: off-bin 49.5Hz and 50.5Hz tones captured in 48-52Hz band (main-lobe 4*Δf≈1.95Hz <4Hz band); humTail test proves tail beyond N excluded.

### 4.3 Band-share ratio and flag

```
linePowerPct = 100 * line / total    if fftValid && total>1e-18 else null
flag 'hum' iff linePowerPct ≥ 15 (%)
method: `Hann-windowed ${N}-point FFT. Band power / 5 Hz to min(200 Hz, Nyquist) power. Resolution ${Δf.toFixed(3)} Hz. Flag threshold: 15%.`
```

1e-18 avoids flat-line divide-by-zero. Healthy E4≈1e-10% (<<15%); hum≈73.545% (≫15%). Withheld → E4.value===null and `Unavailable`.

---

## 5. Finding Logic Summary

| ID | Condition | Severity | Evidence | Test |
|----|-----------|----------|----------|------|
| `clipping` | `clippingPct ≥ 1` | issue | E3 | hum/clipping flags |
| `timing` | `gaps>0 ∨ jitter>0.02` | issue | E5 | gaps + jitter tests |
| `hum` | `linePowerPct ≥ 15` | issue | E4 | hum preset 73% |
| `flat` | `rms < span*0.0001` | issue | E2 | flat capture |
| `spectrum-unavailable` | `!fftValid` | unknown | E5,E6 | withheld cases |
| `no-flags` | no other findings | pass | E2,E3,E4,E5 | healthy |

Compound fault invariant – `compound multi-fault: clipping + 50Hz hum + timing gap` with ±2.5V rails and gap: even though hum power would be high, `fftValid` false → E4 null, spectrum.length 0, findings `['clipping','timing','spectrum-unavailable']` – hum strictly suppressed when withheld.

---

## 6. Security Invariants & Validator Proofs

`api/analyze.mjs:8-15` `validateExplanation(value, report)` enforces:

```
summary:  non-empty string, ≤1800 chars, trimmed
evidenceIds: each ∈ report.evidence[].id, no duplicates (Set size)
findingIds:  each ∈ report.findings[].id, no duplicates
uncertainty: non-empty string, ≤1200 chars, trimmed
```

Consequences:

- Duplicate IDs → `Duplicate evidence/finding reference.` – proven by security_redteam duplicate tests.
- Fabricated E4/hum → When E4 null, findings lack `hum`; citing `findingIds:['hum']` throws `Unknown finding` – proven by sub-120Hz, sub-1.0s, jitter, and security_redteam fabricated tests.
- Model errors never overwrite measurements – `handle` returns `unavailable` preserving report – proven by provider-error tests.
- Host header spoofing – `server.mjs:13` blocks origin/host mismatch; `api/analyze.mjs:37-39` via `timingSafeEqual` on `SIGNALPROOF_ACCESS_TOKEN`. Forging `Host: localhost:8787` still 403.
- Oversized payloads – parseCSV >2MB, handle/server 413 for JSON >2MB, analyze >32768 throws – proven by oversized tests.
- CSV injection – formulas (`=2+5`, `+2+3`, `-2+3`, `@SUM`, `=HYPERLINK`, `=cmd|`, pipe, tab) not finite numeric → rejected – proven by CSV injection tests.

---

## 7. CLI Output Proofs (`cli.mjs`)

`cli.mjs --demo <kind>` → `demo(kind,{fs, n=fs*4})` clamp 64-32768, `analyze()`, `renderReport()`. Report contains Evidence Ledger, Findings, and `Spectrum (Hann-windowed N-point FFT, Δf Hz)` or `Spectrum: WITHHELD` with `E4 is null`.

Verified by `tests/security_redteam.test.mjs`:

- `cli.mjs --demo hum` – asserts hum finding, Strong energy near 50Hz, E4 ≥15%, Hann-windowed, Peak:, 73.545 share, --json asserts hum and E4 non-null.
- `cli.mjs --demo gaps` – asserts timing, spectrum-unavailable, Observed timing gaps:1, Spectrum: WITHHELD, E4 is null, WITHHELD warning, --json asserts E4 null and spectrum 0.

---

## 8. Numerical Cross-Checks (Reproducible)

```js
import {demo, analyze, spectrum} from './engine.mjs';
console.log(analyze(demo('healthy')).evidence[1].value, Math.sqrt((.32**2+.08**2)/2));
console.log(analyze(demo('hum')).evidence.find(e=>e.id==='E4').value);
console.log(analyze(demo('gaps')).evidence.find(e=>e.id==='E4').value);
console.log(spectrum(Array.from({length:1024},(_,i)=>Math.sin(2*Math.PI*50*i/1024)),1024));
```

Deterministic with seedless `demo()`.

---

## 9. Limitations (Honesty)

- All E1-E6 from `time_s,value` only; raw data never sent to model.
- Hann gain 0.5 not corrected; ratios unaffected but absolute power halved.
- Tail beyond N discarded (L=1000 → 488 samples not in E4).
- Jitter excludes gaps; burst-loss and jitter separate.
- `total>1e-18` means flat always withholds even if fs/duration qualify.

---

*References to engine.mjs at c0a01df and tests at 25/25 pass (npm test).*








