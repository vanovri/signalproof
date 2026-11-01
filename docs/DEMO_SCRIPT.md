# Three-minute demo plan

This script describes the working deterministic prototype and the verified live Meta Muse Spark Open integration across Baseten (`meta-models/muse-spark-open-1026`) and Fireworks (`accounts/fireworks/models/muse-spark-open`).

0:00–0:30. Introduce SignalProof. Engineering students often inspect attractive waveforms before checking whether the capture itself is trustworthy. SignalProof places deterministic measurements before AI explanations.

0:30–1:00. Open the reference capture. Show AC RMS, near-rail percentage, the spectrum, and the evidence ledger. Open E2 to show the calculation. State that the data are synthetic bench signals.

1:00–1:30. Select 50 Hz interference. Show the elevated band share (`73.545%`), the spectral peak, and finding `E4`. Explain that a frequency component does not prove its physical cause.

1:30–2:00. Select ADC clipping. Show the flattened peaks and the near-rail percentage (`49.6%`). You can change the declared voltage range and recalculate. The finding recommends another low-voltage bench capture rather than asserting a confirmed hardware fault.

2:00–2:30. Select Missing samples. Show the observed timing gap (`E5`) and the withheld spectrum. The software does not interpolate missing samples or fabricate frequency claims from irregular timestamps.

2:30–3:00. Show the verified live Meta Muse Spark Open explanation on the 50 Hz interference capture. The adapter sends only derived measurements and fixed findings (`E1`–`E6`), never raw samples, and validates returned JSON, evidence IDs, finding IDs, and explicit uncertainty. Close with verification scope: 15/15 code tests, 15/15 synthetic scenarios, and 18/18 validated live Muse Spark Open calls across Baseten and Fireworks on synthetic captures (no real hardware or medical claims).
