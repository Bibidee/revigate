# Test matrix status

Recorded 2026-10-16 for the merged single-contract implementation on `main`.

## Automated coverage

| Area | Result |
|---|---|
| JavaScript wallet/source/pending tests | 23 PASS |
| Direct Mode Registry and ledger tests | 46 PASS |
| Typecheck | PASS |
| Lint | PASS |
| Production build | PASS |
| GitHub Actions CI | PASS, run 120 for the final implementation tree; follow-up docs PR run 123 also passed |
| Hosted source attestation | PASS, exact SHA match |
| Hosted baseline verification | PASS, VERIFIED epoch 1 |
| Hosted MATERIAL review | PASS, actual MATERIAL epoch 2 |
| Hosted funded offer and acceptance | PASS, current demo offer 1,000,000,000,000 wei |
| Hosted MATERIAL exit | PASS, 800,000,000,000 publisher / 200,000,000,000 participant |
| Hosted withdrawals | PASS, one withdrawal per controlled wallet; credits reduced to zero |
| Historical refund/maturity paths | Preserved in older evidence; not repeated on the current disposable deployment |
| Parent transfer records | PASS, canonical records 1 and 2 created |
| Child execution classification | OPEN, no separately verifiable child identity/finality record from current endpoint |
| Recipient balance deltas | OBSERVED publisher +800,000,000,000 and participant +200,000,000,000 |
| Exact contract balance reconciliation | PASS, 1,000,000,000,000 deposited; 0 held; 1,000,000,000,000 dispatched; final balance 0 |

## Focused hosted/browser scenarios

The release pass uses focused coverage rather than reopening the historical 52-scenario programme. Remaining checks are mobile layout, wallet rejection, application disconnect/reconnect, account and network changes, pending/unknown finality recovery and canonical `/agreements` route reads. Historical browser evidence is not substituted for a check that was not run on this branch.

## Safety classification

- PASS: source authentication, deterministic offer accounting, material exit, one-time credit consumption, ledger reconciliation and observed balance deltas.
- OPEN: independent child execution/finality proof, unsolicited/no-calldata and wrong-method paths on this exact candidate, mobile/browser wallet-extension coverage and independent security review.
- BOUNDARY: public-enabled Studionet test demo only; production custody is not approved and no user funds are accepted.
