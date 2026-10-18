# Test matrix status

Recorded 2026-10-18 for the source-attested V5 deployment on Studionet 61999.

## Automated coverage

| Area | Result |
|---|---|
| JavaScript wallet/source/pending tests | 23 PASS |
| Direct Mode Registry and ledger tests | 47 PASS |
| Typecheck | PASS |
| Lint | PASS |
| Production build | PASS |
| GitHub Actions CI | PASS, run 131 for PR #10 head `af449658e4e051200d2d11e62a1abb40d3ba8fef` |
| Hosted source attestation | PASS, exact SHA match |
| Hosted baseline verification | PASS, VERIFIED epoch 1 |
| Hosted NONMATERIAL assessment | PASS, actual NONMATERIAL; epoch stayed 1 |
| Hosted first MATERIAL assessment | PASS, actual MATERIAL; epoch 2 |
| Zero-value Offer 1 creation | PASS, later funded and accepted at acknowledged epoch 2 |
| Funded offer and participant acceptance | PASS, 555 wei, FINALIZED, `ACCEPTED_LOCKED` |
| Second MATERIAL revision and later-event exit | PASS, actual `MATERIAL`, epoch 3, later timestamp used |
| Exact funded ledger reconciliation | PASS, deposited/accounted 555; held 0; credits 555; dispatched 0; contract balance 555 |
| Child execution classification | OPEN, no independently verifiable child identity/finality |
| Recipient balance-delta certification | OPEN, deltas are observations only |

## Focused hosted/browser scenarios

The current V5 pass does not claim the complete 52-scenario hosted/browser
programme. Mobile layout, wallet rejection/disconnect, account and network
changes, pending/unknown finality recovery and refresh recovery remain separate
browser-extension checks.

## Safety classification

- **PASS:** source authentication, materiality consensus, zero-value Registry
  lifecycle, Direct Mode regression and source-attested deployment identity.
- **PASS (controlled test):** funded two-material-revision lifecycle and exact
  funded ledger reconciliation on the current address. No withdrawals were
  submitted.
- **OPEN:** independent child execution/finality proof, unsolicited/no-calldata
  and wrong-method value recovery, failed payable recovery, recipient delivery
  certification, browser/mobile wallet-extension coverage and independent
  security review.
- **BOUNDARY:** disposable Studionet test only; `public_custody=false`; no user
  funds accepted and no production custody approval.
