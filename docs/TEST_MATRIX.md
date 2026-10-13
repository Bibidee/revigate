# Mandatory Test Matrix

Do not optimize for count; every test below must map to a real assertion and executable suite. Report PASS/FAIL/SKIPPED/TOOLING-LIMITED with exact commit and evidence.

## Deterministic contract and wallet authorization
T01 proposal only uses caller wallet; invalid zero wallet, malformed repo/path/sha rejected.
T02 program baseline cannot be verified without genuine nominated publisher-wallet manifest.
T03 wrong GitHub repo/fork/owner/commit/source or unsigned commit fails program verification.
T04 malformed empty/oversize/invalid UTF-8 rulebook, duplicate clause IDs rejected or inconclusive without epoch change.
T05 only publisher may request revision; random wallet cannot mutate source, epoch or financial offers.
T06 no repeated identical revision request; cooldown and one-pending cap.
T07 program epoch increments exactly once on successful `MATERIAL`, never on `NONMATERIAL` or `INCONCLUSIVE`.
T08 old acknowledgment becomes historically valid but stale for current rules only after `MATERIAL`.
T09 nonmaterial revision leaves existing acknowledgment current; document source SHA changes only after finalized review.
T10 semantic verdict and protocol UNDETERMINED remain different; failed assessment cannot save fake verdict.
T11 pre-persisted pending request expires permissionlessly after 24h, even after failed semantic tx; outstanding matured claims remain callable.

## Offer and escrow
T12 only publisher creates offer for distinct nonzero B, positive bounded amount, future dates.
T13 create offer nonpayable, must not lock value; funding exact as separate transaction.
T14 zero-value, wrong sender, wrong amount, repeated-value and malformed payable calls: no unaccounted funds, or documented live blocker.
T15 B cannot accept an unfunded/stale/expired offer or accept on A's behalf.
T16 A cannot cancel after B accepts, including during pending/matured/material review.
T17 B may decline funded unaccepted offer; A receives exact refund credit; unrelated wallet cannot force a premature refund.
T18 expired funded unaccepted offer allocates exact A refund, permissionless after deadline.
T19 accepted B can claim exact **100% amount** at maturity even if rulebook is changed, missing, rate-limited or protocol review fails.
T20 no double maturity allocation, early exit, mutual closure or refund across conflicting transitions.
T21 first post-acceptance material epoch triggers frozen exit rights; nonmaterial/inconclusive does not.
T22 early material exit before deadline: B=floor(P*bps/10000), A=P-B; test 1 wei remainder and 0/10000 endpoints.
T23 exit outside fixed window, after maturity, before material review, by A/third wallet: rejected.
T24 reaffirming new rules preserves original cash terms and does not silently waive existing exit option.
T25 second materially changed rulebook cannot extend existing exit window indefinitely.
T26 mutual closure requires both wallets approve exact digest/same shares/nonce; no partial unilateral allocation.
T27 closure expiration/cancellation restores prior state; A cannot block matured B claim through an open closure.
T28 wrong-wallet withdrawal, overdraft, duplicate withdrawal or resend on unknown transfer rejected.
T29 ledger conservation across at least 100 randomly sequenced actions, multiple offers and wallets.
T30 explicit audit of transfer confirmation semantics; self acknowledgment never declared objective receipt.
T31 stale-app connected wallet/network switch cannot leak A or B capabilities or sign wrong-chain transaction.

## Provider and GenLayer validator adversarial cases
T32 pair of signed GitHub SHAs where deadline changes 14->60 days: MATERIAL.
T33 typography-only typo correction: NONMATERIAL.
T34 ambiguous discretion/benefit language: INCONCLUSIVE or explicitly evidence-grounded MATERIAL, never blindly NONMATERIAL.
T35 GitHub 404/429/timeout, bad JSON, missing proof, content mismatch: INCONCLUSIVE / no epoch advance.
T36 malicious rulebook prompt injection: validator doesn't obey injected instructions.
T37 malicious leader proposes NONMATERIAL, validator finds MATERIAL -> actual disagreement, not accepted as equivalent.
T38 leader/validator objective source identity mismatch -> consensus rejection or inconclusive, never version advance.
T39 unsafely truncated large content cannot be evaluated as a safe version.
T40 revision SHA sibling/non-descendant or arbitrary owner path rejected.
T41 case where source metadata is good but normative material change is buried in unchanged-looking context: materiality test.

## Frontend, finality, deployment
T42 all routes render with proper empty/loading/error/correct-wallet states on desktop and mobile.
T43 wallet connect, soft-disconnect, account change, network change, rejection, provider absence, fee vs value distinction.
T44 `ACCEPTED` provisional, `FINALIZED` with `FINISHED_WITH_ERROR` failure, `UNDETERMINED` failure and successful execution distinguished.
T45 pre-hash rejection does not fabricate hash; post-hash timeout resumes exact hash and does not resubmit.
T46 canonical readback checks exact expected program version, offer data and terms digest, no false success.
T47 restored local hash from former contract/address/chain cannot corrupt current canonical display.
T48 latest-first bounded indexes tested at 0,1,page boundary,2 pages, concurrent inserts and 100+ records.
T49 actual live two-wallet Studionet baseline+material+nonmaterial+uncertain escrow lifecycle with signed evidence.
T50 live B payout, A refund, early exit exact allocation and real EOA received balance verification.
T51 deployed source attestation when supported; actual Vercel production binds final approved address and only chain 61999.
T52 dependency audit, source secret search, branch protection, final green CI and security mutation tests.

## Property-based state invariant pseudocode
For every action sequence:
```
credits[A] >= 0; credits[B] >= 0; held[offer] >= 0;
allocation_count[offer] <= 1;
A_allocated[offer] + B_allocated[offer] + held[offer] == escrow_received_for_offer;
if accepted and not allocated: B_maturity_entitlement == original_amount;
if active_epoch changes: frozen_offer_digest and amount must not change;
if payout_delivery_unknown: do not auto-issue another transfer;
protocol_undetermined: no canonical product verdict or balance mutation assumed.
```
Use valid GenVM types/conditions; this is a behavioral property specification, not executable Python.
