# Three-minute demo plan

This script describes the working deterministic prototype. Demonstrate the live Meta Llama segment only after credentials and a supported model have passed a real test. If unavailable, show the explicit unavailable state and say so.

0:00–0:25. Introduce SignalProof. Engineering students often inspect attractive waveforms before checking whether the capture itself is trustworthy. SignalProof places measurements before explanations.

0:25–0:55. Open the reference capture. Show AC RMS, near-rail percentage, the spectrum, and the evidence ledger. Open E2 to show the calculation. State that the data are synthetic.

0:55–1:25. Select 50 Hz interference. Show the elevated band share, the spectral peak, and finding E4. Explain that a frequency component does not prove its physical cause.

1:25–1:50. Select ADC clipping. Show the flattened peaks and the near-rail percentage. Then select Missing samples. Show the observed timing gap and the withheld spectrum. The software does not invent missing samples.

1:50–2:25. Request a Meta Llama explanation, if available. Show the response, evidence references, and uncertainty. Explain that measurements remain deterministic and the model receives only derived evidence. If unavailable, show that status honestly.

2:25–2:45. Export the JSON report and show the reproducible test report. State that 15 synthetic scenarios test configured flags. They do not establish real hardware accuracy or model quality.

2:45–3:00. Close with the next milestone: real low-voltage bench recordings and a blinded evaluation of whether model explanations help users choose better follow-up tests. No medical or hardware-control claims.
