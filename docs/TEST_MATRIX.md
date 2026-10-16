# Test matrix status

Recorded 2026-10-16 for the single-contract implementation branch.

## Automated coverage

| Area | Result |
|---|---|
| JavaScript wallet/source/pending tests | 23 PASS |
| Direct Mode Registry and ledger tests | 46 PASS |
| Typecheck | PASS |
| Lint | PASS |
| Production build | PASS |
| Hosted source attestation | PASS, exact SHA match |
| Hosted baseline verification | PASS, VERIFIED epoch 1 |
| Hosted MATERIAL review | PASS, actual MATERIAL epoch 2 |
| Hosted funded offer and acceptance | PASS, offer 2, 1,000 wei |
| Hosted MATERIAL exit | PASS, 800 publisher / 200 participant |
| Hosted unaccepted refund | PASS, offer 3, 777 wei |
| Hosted maturity payout | PASS, offer 4, 555 wei to participant |
| Hosted duplicate withdrawal | PASS, finalized execution ERROR; no replay |
| Parent child identity | PASS, one child ID returned for each parent |
| Child execution classification | OPEN, child FINALIZED/NO_MAJORITY with no execution result |
| Recipient balance deltas | OBSERVED +755 and +2,577; independent proof recorded |
| Exact contract balance reconciliation | PASS, 3,332 deposited and 3,332 dispatched; final balance 0 |

## Required hosted/browser scenarios

The 52-scenario matrix remains incomplete. Open scenarios include mobile wallet-extension behavior, network switching, account switching, pending/unknown finality recovery, refresh recovery on the financial workbench, and full route checks. Historical browser evidence is not substituted for this branch.

## Safety classification

- PASS: source authentication, deterministic offer accounting, material exit, refund, maturity allocation, one-time credit consumption, parent-to-child identity binding and observed balance deltas.
- OPEN: child execution success and external settlement classification, unsolicited/no-calldata and wrong-method paths on this exact candidate, independent security review and second PR review.
- BLOCKED: public custody and production promotion.
