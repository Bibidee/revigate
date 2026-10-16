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
| Hosted funded offer and acceptance | PASS, offer 1, 1,000 wei |
| Hosted MATERIAL exit | PASS, 200 publisher / 800 participant |
| Hosted unaccepted refund | PASS, offer 2, 777 wei |
| Hosted maturity payout | PASS, offer 4, 444 wei to participant |
| Hosted duplicate withdrawal | PASS, finalized execution ERROR; no replay |
| Parent child identity | PASS, one child ID returned for each parent |
| Child execution classification | OPEN, child FINALIZED/NO_MAJORITY with no execution result |
| Recipient balance deltas | OBSERVED publisher +2,532 and participant +1,244; independent observations recorded |
| Exact contract balance reconciliation | PASS, 4,331 deposited; 555 held; 3,776 dispatched; final balance 555 |

## Required hosted/browser scenarios

The 52-scenario matrix remains incomplete. Open scenarios include mobile wallet-extension behavior, network switching, account switching, pending/unknown finality recovery, refresh recovery on the financial workbench, and full route checks. Historical browser evidence is not substituted for this branch.

## Safety classification

- PASS: source authentication, deterministic offer accounting, material exit, refund, maturity allocation, one-time credit consumption, parent-to-child identity binding and observed balance deltas.
- OPEN: child execution success and external settlement classification, unsolicited/no-calldata and wrong-method paths on this exact candidate, independent security review and second PR review.
- BLOCKED: public custody and production promotion.
