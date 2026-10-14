# Mandatory Test Matrix

Do not optimize for count; every test below must map to a real assertion and executable suite. Report PASS/FAIL/SKIPPED/TOOLING-LIMITED with exact commit and evidence.

## Execution status — 2026-10-14

**Overall: NOT COMPLETE.** Current row counts remain 27 PASS, 15 PARTIAL, 2 FAIL, 2 BLOCKED, and 6 NOT EXECUTED; the table labels each row. On 2026-10-14, full npm run preflight passed: Studionet-only network guard, typecheck, lint, 9 JavaScript tests, 8 Python tests, 90 Direct Mode tests, and production build prerendering all 10 app routes. The current two-contract pair is deployed on Studionet 61999, its source bytes match local files, and on-chain configuration confirms reciprocal addresses with custody disabled. The pair has received no GEN. A prior one-wei EOA withdrawal increased the recipient balance by 1 wei, while its contract record remained UNKNOWN_DELIVERY. On a disposable clone, a payable execution error, an unexpected direct transfer, and value attached to a nonpayable method each left unaccounted value in contract balance. This is a reproduced custody failure, not a certification. Direct Mode fixtures are simulations, not live GitHub/validator consensus or browser-wallet evidence.

| ID | Status | Evidence and remaining boundary |
|---|---|---|
| T01 | PASS | `tests/direct/test_escrow.py::test_T01_*`: caller wallet, zero publisher, repo/ref/path/SHA validation. |
| T02 | PASS | `tests/direct/test_contract_provenance.py::test_T02_*`: mocked signed commit, nominated manifest, slash branch, exact Git blob bytes. No live provider proof. |
| T03 | PASS | `test_T03_*`: mocked unsigned signature, branch membership and repository identity failures stay inconclusive. |
| T04 | PASS | `test_T04_*`: malformed, duplicate-ID and oversized rulebooks stay inconclusive. |
| T05 | PASS | `test_T05_*`: publisher-only offer creation and revision requests; unauthorized revision leaves program unchanged. |
| T06 | PASS | `test_T06_*`: pending cap, replay rejection and permissionless expiry. Cooldown timing is not exhaustively boundary-tested. |
| T07 | PASS | `test_T07_T08_material_revision_advances_once_and_keeps_ack_historical`: mocked Direct Mode MATERIAL outcome updates the SHA, adds exactly one epoch/event, and a repeated assessment cannot increment again. Hosted validator classification remains untested. |
| T08 | PASS | Same test: material revision preserves the participant's epoch-1 acknowledgment history while the accepted offer remains bound to epoch 1 and current program advances to epoch 2. No frontend stale-ack state was tested. |
| T09 | PASS | `test_T09_nonmaterial_revision_changes_sha_without_staling_ack_or_epoch`: mocked Direct Mode NONMATERIAL outcome updates SHA while leaving epoch and acknowledgment currency unchanged. Hosted validator classification remains untested. |
| T10 | PARTIAL | `test_T10_inconclusive_assessment_does_not_advance_rules_or_epoch` confirms a semantic INCONCLUSIVE clears pending review without changing SHA/epoch/exit rights. Direct Mode cannot produce a real protocol UNDETERMINED receipt. |
| T11 | PASS | `test_T11_pending_revision_does_not_block_matured_claim_or_expiry`: pending claim and permissionless expiry. Failed semantic transaction persistence is not live-tested. |
| T12 | PASS | `test_T12_*`: zero/self participant, invalid deadline ordering, bps and exit-window bounds; valid offer creation exercised elsewhere. |
| T13 | FAIL | `test_T13_nonpayable_offer_creation_does_not_take_attached_value` attaches a value in Direct Mode, but that simulator does not model the chain transfer. A live call to the nonpayable `create_offer` method with 1 wei finalized with execution `ERROR` and `value_credited=true`; the disposable contract balance increased by 1 wei while all ledger fields remained zero. See [Studionet evidence](STUDIONET_EVIDENCE.md). |
| T14 | FAIL | `test_T14_*` covers wrong amount/sender, duplicate, zero, pending review and stale epoch in Direct Mode; live 1-wei unknown-offer funding became refundable credit. A disposable clone then received 1 wei in `probe_failure_after_credit`, deliberately failed after ledger mutation, and finalized `MAJORITY_AGREE` with leader execution `ERROR`/`rollback` and `value_credited=true`; contract balance rose while all ledger totals and wallet credit rolled back to 0. A separate direct 1-wei send finalized `NO_MAJORITY` with `value_credited=true`, raised the same clone's balance to 2 wei, and did not invoke GenVM or add ledger credit. Payable errors and unexpected direct funding are unsafe on Studionet; exact transactions and the test-only source hash are in [Studionet evidence](STUDIONET_EVIDENCE.md). |
| T15 | PASS | `test_T15_*`: wrong participant, stale material epoch and expired acceptance rejected. |
| T16 | PASS | `test_T16_publisher_cannot_cancel_after_participant_accepts` and `test_T16_publisher_cannot_cancel_accepted_offer_in_any_lifecycle_state`: cancellation is rejected after acceptance, during pending review, at maturity, and after a material event. |
| T17 | PASS | `test_T17_*`: participant decline allocates exact publisher refund; unrelated wallet cannot force it. |
| T18 | PASS | `test_T18_unaccepted_funded_offer_can_be_expired_permissionlessly`: exact refundable credit after expiry. |
| T19 | PASS | `test_T19_*` and T11: full participant amount is allocated at maturity, including while a review is pending. Live provider failure is not involved in this code path. |
| T20 | PASS | `test_T20_maturity_allocation_cannot_run_twice`; exit and mutual-closure allocation paths have separate once-only tests. |
| T21 | PASS | T07/T09/T10 tests pair mocked MATERIAL, NONMATERIAL and INCONCLUSIVE outcomes: only MATERIAL records an event and enables the participant's frozen early exit; the other outcomes do not. Hosted classification remains untested. |
| T22 | PASS | `test_T22_*`: floor rounding, one-wei remainder, and 0/10000 bps endpoints conserve the amount. |
| T23 | PASS | Existing unauthorized/late-window tests plus `test_T23_material_exit_requires_event_and_pre_maturity_time` reject exit with no material event and after maturity. |
| T24 | PASS | `test_T24_T25_reaffirmation_does_not_extend_first_material_exit_window`: original terms and first exit deadline persist. |
| T25 | PASS | Same T24/T25 assertion: a later material event cannot extend the first exit deadline. |
| T26 | PASS | `test_T26_*`: exact mutual approval and overflow-safe allocation. |
| T27 | PASS | `test_T27_*`: cancel/expiry restores claim state; open closure cannot block maturity. |
| T28 | PARTIAL | `test_T28_*`: wrong-wallet/duplicate withdrawal rejected in Direct Mode. One live 1-wei withdrawal finalized, but no failed-delivery retry was attempted; the transfer remains `UNKNOWN_DELIVERY`. |
| T29 | PASS | `test_T29_randomized_offer_sequences_conserve_deposits`: seeded 100-offer action sequence conserves ledger totals. |
| T30 | PARTIAL | Current-source live child transaction finalized from the contract to the signer for 1 wei; the signer’s independent balance increased exactly 1 wei. The contract still says `UNKNOWN_DELIVERY`; failure/recovery and other recipient types remain unresolved. |
| T31 | NOT EXECUTED | No browser wallet account/network-switch race test. |
| T32 | PARTIAL | `test_T32_signed_14_to_60_day_revision_is_material_in_direct_mode` exercises the paired source change with mocked GitHub and LLM output. It does not prove signed hosted-validator judgment. |
| T33 | PARTIAL | T09 exercises a typography-only Markdown formatting change with mocked Direct Mode NONMATERIAL output; hosted validator consensus is untested. |
| T34 | PARTIAL | T10 exercises an ambiguous eligibility change with a mocked INCONCLUSIVE outcome; hosted validator behavior is untested. |
| T35 | PARTIAL | Authenticated-blob mismatch, HTTP 404/429, bad JSON, missing rulebook blob, oversized/truncated trees and provider exceptions are covered in Direct Mode. A real network timeout and hosted provider behavior are not. |
| T36 | NOT EXECUTED | Prompt-injection resistance has not been exercised through validator consensus. |
| T37 | PARTIAL | `test_T37_validator_callback_rejects_a_different_materiality_result` verifies the Direct Mode validator callback rejects a conflicting result. It does not simulate actual hosted consensus. |
| T38 | PARTIAL | `test_T38_validator_callback_rejects_source_identity_mismatch` verifies the Direct Mode validator callback rejects a different source identity. Hosted consensus is untested. |
| T39 | PARTIAL | Oversized source and truncated provider tree are rejected as inconclusive in Direct Mode; hosted validator assessment is untested. |
| T40 | PASS | `test_T40_revision_sibling_of_current_commit_fails_ancestry_check` plus T03 wrong-repository fixture. Mocked provider only. |
| T41 | PARTIAL | `test_T41_unscoped_rulebook_text_is_included_in_materiality_diff`: preamble changes are included in the diff. Semantic validator outcome remains untested. |
| T42 | PARTIAL | All nine routes on the latest production deployment rendered at desktop width 1280 and phone viewport 390x844 with expected titles/headings and no page-level horizontal overflow. Publish-page action controls are effectively disabled. Empty/no-wallet state only; wallet, loading/error and transaction interaction states remain untested. Mobile navigation is horizontally scrollable. |
| T43 | NOT EXECUTED | Wallet connect/rejection/provider absence and fee-versus-value browser tests were not run. |
| T44 | NOT EXECUTED | Finality-state UI has implementation checks but no executable browser state suite. |
| T45 | NOT EXECUTED | No browser test for pre-hash rejection or persisted-hash timeout resume. |
| T46 | PARTIAL | Finalized test-only contract config, initial state, ledger, credit, transfer and independent wallet balances were read back. No full lifecycle/browser assertion exists. |
| T47 | NOT EXECUTED | Contract/chain-scoped transaction persistence has no refresh/reload browser test. |
| T48 | PASS | `test_T48_pages_are_bounded_latest_first_and_stable_across_new_offers`: empty, 103+ records, pages, insert between pages, wallet index and invalid size. |
| T49 | BLOCKED | Current source was deployed and attested, but no genuine signed-source program verification or two-wallet revision/escrow lifecycle ran. |
| T50 | BLOCKED | No live B payout, A refund, material exit, or independently verified two-wallet recipient balances. |
| T51 | PARTIAL | The fresh Registry and Vault deployed bytes each match the local source SHA256 recorded in TWO_CONTRACT_MIGRATION.md; on-chain config reads show reciprocal addresses and custody disabled. The final Vercel site remains unbound and its deployment is not tied to a signed release commit. No live child message or lifecycle is proven. |
| T52 | PARTIAL | Production audit reports zero production vulnerabilities. Two moderate UUID findings remain in the pinned development CLI chain. The source secret scan and production-write lock regression are recorded in implementation evidence. Signed publication, branch protection, final-commit CI, full contract mutation testing, and independent audit remain open. |

The 7 Node + 8 accounting + 55 Direct Mode passing test count is **not** a count of matrix rows passed. Statuses above are specific to each row; mocked-provider success does not prove live provenance or validator agreement.

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
