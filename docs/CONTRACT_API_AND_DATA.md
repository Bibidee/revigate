# Early Intelligent Contract API Proposal (Superseded)

> This is a design-stage proposal. Its single-contract recommendation and
> proposed signatures were superseded by the implemented Registry/Vault
> migration. For the current roles, deployed ABI, evidence boundary, and
> custody status, see [Two-Contract Migration](TWO_CONTRACT_MIGRATION.md) and
> [Implementation Status](IMPLEMENTATION_STATUS.md). This file is retained as
> product-history and invariant context; do not treat it as the current ABI.

Names below are target interface names; implement idiomatic GenLayer Python types (`Address`, `u256`, `u64`, `TreeMap`, bounded collections) after verifying current compiler/runtime. Do not introduce an EVM Solidity escrow contract. One GenLayer Intelligent Contract is the preferred default.

## Canonical records

`Program`:
- ID, owner_wallet (A), canonical GitHub `owner/repository`, exact rulebook `.md` relative path, publisher wallet-nomination manifest path, registered branch, baseline SHA, baseline document SHA256, active_reviewed_sha, active_document_digest, epoch (starts at 1), status, last_material_change timestamp, revision history count, pending review ID, register/verify timestamp, request cooldown counter, bounded publication metadata.
- `VERIFIED` only after source/manifest checks succeed. Program identity fields immutable. No transferable admin or hidden override in V1.

`RevisionRequest`:
- id, program_id, previous_reviewed_sha, proposed_sha (full 40 hex), requester (publisher wallet), request timestamp, deadline, status (`PENDING`, `MATERIAL`, `NONMATERIAL`, `INCONCLUSIVE`, `EXPIRED`), verified source digests, structured evidence/changed clause IDs, decision timestamp, resulting epoch, last semantic result. One pending review per program. Separate immutable review history; failed consensus does not conjure a record.

`Acknowledgment`:
- wallet, program_id, acknowledged_epoch, reviewed_sha, document_digest, acknowledged_at, history sequence; append-only versions. No claim that an acknowledgment is legally binding offline.

`Offer`:
- id, program_id, publisher A, designated participant B, escrow amount `u256`, offer creation time, funding deadline, acceptance deadline, claim/maturity timestamp, material-exit share bps (0..10000), material-exit window seconds, current binding rule epoch, rule SHA/digest, immutable proposed terms digest, accepted_at, initial_accepted_epoch, last_ack_epoch, immutable cash terms, `state`, original amount, allocated amounts, transferred/requested amounts, pending claim IDs, terminal resolution reason, closure proposal digest/nonce/expiry and both approvals when applicable.
- Do not overload a single status to imply both rule validity and value delivery. `Offer.lifecycle`, `Allocation`, `TransferStatus` are separate conceptual records and may be represented as compact fields.

`EscrowLedger`:
- per-offer held amount, allocated B amount, allocated A amount, credits by beneficiary (not requiring B acceptance for refund), pending transfer IDs/sums, observed delivery metadata, claimed/withdrawn amounts, global total deposits, sum outstanding held, sum claimable, sum in-flight, sum historical transfers. When onchain balance excludes emitted in-flight messages, don't assert misleading `balance >= all liabilities` without accounting for in-flight; prove a correct conservation relation for each transition.

`ExitEligibility`:
- computed from immutable offer's latest acknowledged epoch and program `material_epoch_record[epoch]`. First material change after that acknowledgment determines initial exit trigger and expiry. Reaffirmation never edits original cash terms. Explicitly decide whether reaffirmation waives an existing exit (V1 answer: **NO**; trigger remains exercisable until the originally frozen exit deadline). Prevent later material reviews from endlessly extending the same exit window. After exit resolution or maturity, exit is no longer exercisable.

Indexes must be page-addressable: program count/latest programs, version/review counts/pages, A outgoing offer IDs, B incoming/accepted offer IDs, program offers, wallet credits, beneficiary pending transfers. Never expose unbounded lifetime arrays in one view.

## Proposed public writes

1. `propose_program(repo, rulebook_path, manifest_path, publication_branch, baseline_sha) -> id` — A only by caller identity, deterministic, no money.
2. `verify_program(id)` — authenticates baseline through validator-side GitHub retrieval; if consensus errors, proposal remains safely expirable/retryable. A successful verified baseline initializes epoch 1, stores source identity, cannot double-register it.
3. `expire_unverified_program(id)` — permissionless after fixed 24h verification window, no value involved.
4. `acknowledge_rules(program_id, expected_epoch, expected_sha, expected_digest)` — caller acknowledges exact verified program version, not pending source. Make repeated identical acknowledgment idempotent and preserve append-only actual change history.
5. `create_offer(program_id, B_address, amount_wei, acceptance_deadline, funding_deadline, maturity_at, exit_bps, exit_window_seconds) -> offer_id` — A only, deterministic, no value. Ensure future deadlines, valid B != A, nonzero addresses, bound values and epoch/version lock; no pending revision.
6. `fund_offer(offer_id) payable -> status` — A-only intended funding, exact amount; **before any validation that could reject, register incoming `gl.message.value` in a refundable source-address credit** when supported by demonstrated runtime behavior; failed semantic conditions return clear failure marker without throwing after value arrival. On valid funding, move exactly that credit into offer held liability. Reject zero and duplicates safely. Show a real transaction receipt and canonical financial readback. This is not a substitute for G3 tests.
7. `accept_offer(offer_id, expected_terms_digest, expected_epoch, expected_sha) -> void` — B only, fully funded, before acceptance deadline and maturity, no pending review, immutable binding. Record acknowledgment. Funding and acceptance are separate transactions.
8. `decline_offer(offer_id)` — B only, not accepted; allocate refund to A.
9. `cancel_unaccepted_offer(offer_id)` — A only while unaccepted; allocate refund to A. Never available after B acceptance.
10. `expire_unaccepted_offer(offer_id)` — anyone after acceptance deadline, safe refund to A; also support funding deadline expiry for never-funded offers.
11. `request_revision(program_id, candidate_full_sha)` — A only, deterministic, one pending per program, snapshot prior accepted reviewed SHA and bound decision deadline, candidate != reviewed, replay/cooldown caps. No web/LLM in this call. All existing escrow claims/refunds must remain available during pending review.
12. `assess_revision(program_id, review_id)` — nondet work in separate transaction; independently verify authorized published GitHub commit and its ancestry, fetch both exact documents, enforce source/policy bounds and independently judge MATERIAL/NONMATERIAL/INCONCLUSIVE. No money moves. Save outcome **only if whole transaction successfully finalizes**. Material: advance epoch, new accepted SHA and epoch material timestamp. Nonmaterial: update accepted SHA/digest but preserve epoch and ack-currentness. Inconclusive: preserve previous accepted SHA/epoch; store reason with no false certainty.
13. `expire_revision_request(program_id, review_id)` — anyone after deadline if still pending; clear block on new offers; previous accepted source authoritative. Outer review failure does not increment an on-chain failure counter unless a separate valid write records it.
14. `reaffirm_rules(program_id, expected_epoch, expected_sha, expected_digest)` — B or any participant wallet acknowledges current reviewed rules, append history. For escrow holders, optional `reaffirm_offer_rules(offer_id,...)` updates ack history but does not cancel already triggered exit rights.
15. `exercise_material_exit(offer_id)` — B only, accepted and held, first qualified material epoch since prior acknowledgment, within immutable exit window, before maturity and before prior allocation; exact B share `floor(amount*exit_bps/10000)`, A = amount-B. A cannot execute or override it.
16. `allocate_matured_claim(offer_id)` — permissionless when accepted and matured and not already allocated: entire amount to B regardless of changes, pending reviews or unavailable GitHub.
17. `propose_mutual_closure(offer_id, A_share, B_share, nonce)` — either party while accepted/held; exact sum to held; store digest over ID/terms/nonce/allocation/expiry, no transfer. Crucially cannot block B's matured claim.
18. `approve_mutual_closure(offer_id, digest)` — counterpart approval before bounded closure timeout, check unchanged held amount and both signatures; allocate both shares only on exact agreement.
19. `cancel_mutual_closure(offer_id)` or `expire_mutual_closure(offer_id)` — participants can cancel, anyone can expire; restore original held state. An open proposal auto-becomes nonblocking at maturity, so A cannot grief a maturity payout.
20. `withdraw_credit(amount)` — wallet claims its own allocated credit only, debit/lock exactly once before emitting finalized EOA transfer as supported; store outgoing transfer attempt ID/state and never blindly re-send uncertain transfer. Build escrow on real transfer feasibility tests.
21. `acknowledge_transfer_receipt(transfer_id)` — OPTIONAL UI receipt acknowledgment, clearly marked **self-attestation, not cryptographic EOA credit proof**. Must never be the sole basis for automatic monetary recovery or fake `DELIVERED` claim. Prefer objective confirmed child/explorer evidence if supported.
22. `reconcile_transfer(transfer_id, verifiable_evidence)` — only if a cryptographically/network-verifiable source exists in the supported runtime; otherwise omit this method and disclose failed-transfer recovery limit, leaving `UNKNOWN_DELIVERY` safe from duplicate spends.

## Required views
`get_config`, `get_program`, `list_programs(start, limit)`, `get_current_rulebook`, `get_revision_request`, `get_program_revisions(start,limit)`, `get_acknowledgment`, `get_ack_history(start,limit)`, `get_offer`, `get_program_offers(start,limit)`, `get_wallet_offers(role,wallet,start,limit)`, `get_exit_eligibility`, `get_wallet_credit`, `get_pending_transfers(start,limit)`, `get_transfer`, `get_escrow_accounting`, `get_contract_version`.

## Authorization matrix
- Publisher: register, submit revision, create/fund offer, cancel **unaccepted** offer, propose/approve mutual closure, receive only allocated refunds.
- Participant: accept/decline own offer, reaffirm, exercise its own exit, propose/approve mutual closure, claim own allocated credit.
- Anyone: view, verify pending program, assess already-authorized revision, expire deterministic requests, allocate mature entitlements, expire unaccepted offers and expired closures.
- Third wallet: must be unable to masquerade as A/B, steal funds, mutate terms or acknowledge for a third party.
- Admin: **NONE**. No setter may replace settlement wallet or outcome after freeze.

## Implementer flexibility
Exact Python function signatures may be amended only for proven GenVM ABI compatibility, with 1:1 behavior and updated docs/tests. Never replace exact economics with generic AI inference. Avoid a contract too large to compile/verify; proof of correctness matters more than artificial method count.
