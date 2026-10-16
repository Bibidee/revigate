# Revigate release checklist

## Current verdict

**NOT RELEASED.** This branch contains the single-contract Registry plus gated financial mechanics. The production deployment remains locked.

## Completed engineering

- [x] Historical `5fb3a6d` offer mechanics recovered into the current Registry source.
- [x] Archived Vault accounting and transfer-observer semantics reviewed.
- [x] ClauseBid accounting, claims and settlement used as a reference without treating its successful lifecycle as proof of exceptional transfer safety.
- [x] Custody flags, typed payable outcomes, held/credit/dispatched ledger and no-retry transfer records implemented.
- [x] Direct Mode regression and adversarial tests pass (46).
- [x] Studionet DNS/HTTPS diagnosis completed: sandbox DNS isolation; approved host path reaches HTTP 405 on the RPC endpoint and read-only calls succeed.
- [x] Fresh source-attested custody-enabled disposable deployment completed.
- [x] Signed baseline verification, funded acceptance, MATERIAL exit, unaccepted refund, maturity payout and duplicate rejection completed.
- [x] Parent child IDs were read from the correct withdrawal parent; recipient balance deltas were independently observed.

## Required before public custody or release

- [ ] Resolve child `NO_MAJORITY`/missing execution-result classification with a supported runtime proof or keep custody disabled.
- [ ] Classify unsolicited no-calldata and wrong-method value behavior for this exact source without repeating a destructive probe without a new hypothesis.
- [ ] Complete the 52-scenario browser and wallet-extension matrix.
- [ ] Independent security review.
- [ ] Second approved PR review.
- [x] Fresh green CI for the current head `2c648e44e44db77632f0d604fd2132ce71c1497f` (run 108).
- [ ] Explicit owner approval before production promotion or merge.

The public application must remain locked until the custody-critical gates pass. Exact hosted evidence is in `evidence/single-contract/2026-10-16-funded-studionet-lifecycle.json`.
