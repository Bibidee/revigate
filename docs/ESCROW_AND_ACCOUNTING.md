# Escrow Financial Specification — Non-Negotiable

## Economic identity and locked terms
Every offer is between publisher wallet A and designated participant wallet B. A is the only valid funder. An offer's immutable terms include:
`offer_id, program_id, A, B, amountWei, accepted_rule_commit_sha, document_digest, accepted_epoch, maturity_timestamp, funding_deadline, acceptance_deadline, material_exit_bps, material_exit_window_seconds, network_id=61999, terms_version`.
Compute a canonical digest using fully specified stable encoding (field names/order/types, lowercased canonical addresses, UTF-8/NFC string treatment and exact integer units). Frontend must independently reproduce and verify this digest after finalized creation and before B acceptance. A candidate rulebook revision NEVER changes this digest.

## Payment formula
On maturity: B_credit += `amountWei`; A_credit += 0.
On decline/cancel/expiry of funded *unaccepted*: A_credit += `amountWei`; B_credit += 0.
On material early exit: `B_share = floor(amountWei * exit_bps / 10000)`; `A_share = amountWei - B_share` (remainder to A). No rounding dust. Example: amount=10 GEN, exit_bps=2000 => B gets 2 GEN, A gets 8 GEN.
On mutually signed closure: `A_share + B_share == amount_remaining_held` exactly and both signatures/approvals bind matching ID, digest, nonce and expiration.
Unknown or incomplete validator judgment: **no effect on held funds**; deterministic maturity still works.

## Funding two-phase safety
1. A creates nonpayable offer with all parameters validated; it starts `OFFERED_UNFUNDED`.
2. A calls exact-amount `fund_offer` to lock funds. Payable call must be specifically audited for the GenLayer failure mode documented in Vowmark: value may reach contract even when execution later errors. Preferred bounded approach is credit incoming value to sender's refundable credit **before risky user-input validation**, return a rejection marker rather than throw on ordinary bad funding conditions, then atomically move exact amount from refundable credit to offer held amount if valid. This is a hypothesis to validate live, not automatic guarantee of every kind of protocol failure.
3. If funding tx is `UNDETERMINED` / errored, show **UNKNOWN FUNDING** until actual balance + ledger reconciliation proves where GEN went. Never auto-retry and never say 'refund complete' without evidence.
4. Only when `FUNDED_UNACCEPTED` is canonically finalized may B accept.
5. Unexpected extra GEN, repeated fund calls and wrong-funder value must never disappear into an unexplained surplus; add refundable source credit where feasible. Test unsolicited direct transfers and their behavior; do not promise recovery without proof.

## Accounting invariants (must hold per write)
- A single offer's originally funded escrow can be assigned to beneficiaries at most once.
- `original amount == held_remaining + A_allocated + B_allocated` before external claims, with monotonic paid/claimed breakdown and no double counting.
- At global level, all recorded deposits are partitioned into held value, unclaimed beneficiary credits, pending outgoing value and amounts externally delivered or objectively observed; include retained surplus/refundable incoming credits. Never assert `contract balance = liabilities` without accounting for emitted in-flight external messages that may already debit the contract balance.
- Allocation only moves liabilities, never creates GEN.
- A can never recover accepted held value unilaterally, except its deterministic share after B explicitly chooses original early exit or both approve mutual closure.
- Every withdrawal authority equals `msg.sender`'s own credit. Explicitly test sender/origin and third-wallet EVM-forwarding behavior in the actual runtime. A relayer must not withdraw B's credit.
- Before issuing transfer, debit/commit source credit exactly once. Preserve request ID, receiver and amount for recovery. An unknown-delivery transfer must not be issued a second time on guesswork.
- Credits are never shared between wallets due to address normalization or lookup error.
- Partial withdrawals (if supported) respect exact denominations and never exceed available credits.

## One difficult issue: transfer delivery
GenLayer external EOA transfers use finalized external messages. A contract can record an emission and an intended recipient, but that alone is not **objective evidence the receiver was credited**. Self-confirmation is only attestation. In V1, expose:
- `credit allocated` (ledger finalized),
- `withdrawal requested` (tx hash recorded),
- `parent finalized successfully` (receipt success checked),
- `outgoing transfer emitted / pending delivery` (if observable),
- `recipient credit verified` **only with verifiable evidence**, or `delivery unknown` where not provable.
No autonomous resend from unknown-delivery state. If network lacks safe failed-transfer recovery, disclose as platform limit and do not claim release-ready full escrow. Real test must prove an unambiguous transfer at least to ordinary EOAs and test rejected/unsupported recipient paths.

## Settlement recipient types
V1 supports ordinary direct EIP-1193 EOA wallets. Smart-contract wallets or reverting recipient contracts are unsupported unless separately proved. Do not falsely claim an onchain `sender == origin` check cryptographically proves EOA status.

## Unaccepted offer refunds
A may cancel only if offer has no B acceptance. B may decline. After acceptance deadline anyone may expire and allocate refund. Both paths must be idempotent and must not remain blocked by unrelated rule review. If offer never funded, expiry has no money to refund.

## Security note
Never design escrow release around onchain AI subjective task-completion judgments in this V1. The **only economic catalyst from GenLayer materiality** is enabling the *previously frozen optional exit*. The unconditional full maturity claim is deterministic and always available after accepted funding, even if all external providers stop working.
