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
- [x] Corrected frontend promoted to `https://the-revigate.vercel.app` with the candidate address; production financial writes remain locked.
- [x] `/agreements` now reads canonical offers, frozen terms, deadlines, ledger totals and wallet credit; the workbench adopts canonical offer terms after a read.
- [x] Offer 3 maturity allocation was accepted by five validators; post-state readback remains pending while the RPC is unavailable.

## Required before public custody or release

- [ ] Resolve child `NO_MAJORITY`/missing execution-result classification with a supported runtime proof or keep custody disabled.
- [ ] Classify unsolicited no-calldata and wrong-method value behavior for this exact source without repeating a destructive probe without a new hypothesis.
- [ ] Complete focused browser and wallet-extension checks for `/agreements`, wallet rejection/disconnect, account/network changes and pending/unknown recovery.
- [ ] Independent security review remains outside this focused repository release pass.
- [ ] Second approved PR review, if repository protection requires it.
- [ ] Fresh green CI for the final pushed head.
- [x] Owner authorized this release pass to mark PR #4 ready and merge repository code; public custody remains separately locked.

The public application must remain locked until the custody-critical gates pass. Exact hosted evidence is in `evidence/single-contract/2026-10-16-funded-studionet-lifecycle.json`.
