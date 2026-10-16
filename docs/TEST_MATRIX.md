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
| GitHub Actions CI | PASS, run 114 for head `55ee535a04552f69f9bb2267da8d63c43157a0de` |
| Hosted source attestation | PASS, exact SHA match |
| Hosted baseline verification | PASS, VERIFIED epoch 1 |
| Hosted MATERIAL review | PASS, actual MATERIAL epoch 2 |
| Hosted funded offer and acceptance | PASS, offer 1, 1,000 wei |
| Hosted MATERIAL exit | PASS, 200 publisher / 800 participant |
| Hosted unaccepted refund | PASS, offer 2, 777 wei |
| Hosted maturity payout | PASS, offer 4, 444 wei to participant |
| Hosted Offer 3 maturity allocation | ACCEPTED, tx `0xfe41b774cfe041d9e910c61d125b0305bb1e5b8f8bab1760e5cec3bebd83d624`, five `AGREE`; post-state readback pending RPC recovery |
| Hosted duplicate withdrawal | PASS, finalized execution ERROR; no replay |
| Parent child identity | PASS, one child ID returned for each parent |
| Child execution classification | OPEN, child FINALIZED/NO_MAJORITY with no execution result |
| Recipient balance deltas | OBSERVED publisher +2,532 and participant +1,244; independent observations recorded |
| Exact contract balance reconciliation | PASS, 4,331 deposited; 555 held; 3,776 dispatched; final balance 555 |

## Focused hosted/browser scenarios

The release pass uses focused coverage rather than reopening the historical 52-scenario programme. Remaining checks are mobile layout, wallet rejection, application disconnect/reconnect, account and network changes, pending/unknown finality recovery and canonical `/agreements` route reads. Historical browser evidence is not substituted for a check that was not run on this branch.

## Safety classification

- PASS: source authentication, deterministic offer accounting, material exit, refund, maturity allocation, one-time credit consumption, parent-to-child identity binding and observed balance deltas.
- OPEN: child execution success and external settlement classification, unsolicited/no-calldata and wrong-method paths on this exact candidate, and any browser check not freshly run.
- BLOCKED: public custody; production financial writes remain disabled.
