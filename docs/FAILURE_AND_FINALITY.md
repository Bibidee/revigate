# Transaction Finality, Recovery, Unknown Funds and Failure Semantics

## Submission is not execution success
UI stages: wallet connect -> signature requested -> signed -> tx hash submitted -> pending/consensus -> `ACCEPTED` **provisional** -> `FINALIZED` with successful execution result (e.g. `FINISHED_WITH_RETURN`) -> **LATEST_FINAL** canonical contract state matched -> if payment, external recipient delivery separately confirmed via objective evidence.
`FINALIZED` with `FINISHED_WITH_ERROR` or rollback is failure, not success. A leader receipt alone is not sufficient. `UNDETERMINED` with tentative result is **not** a finalized app judgment. No reload/double-click may resend a tx while hash/status unresolved.

## Request-before-review pattern
`request_revision` is deterministic and must finalize onchain first. `assess_revision` is nondeterministic and may fail outer consensus with all its storage modifications rolled back. The pre-existing request remains. `expire_revision_request` is permissionless and deterministic after 24h, even if no single `assess_revision` worked. Do not increment an onchain retry counter inside the failed assessment and assume it survives consensus failure.

## Existing financial rights are live while reviews are stuck
- Accepted B maturity claim remains callable if GitHub is permanently offline or pending review is blocked.
- Unaccepted A refund becomes callable once deadline passes independent of GitHub.
- Already claimable credits remain withdrawable independent of program status.
- Publisher cannot abuse an unapproved mutual closure to block a matured B claim.
- A publisher cannot intentionally freeze all outstanding escrows by repeatedly proposing rule changes.

## Funding recovery
Prevalidated nonpayable offer creation plus isolated payable funding reduces the chance of invalid user terms capturing value. Any payable funding method must reserve incoming value into refundable sender credit before rejecting conditions when runtime supports this. Test whether a protocol `FINISHED_WITH_ERROR` still credited value on Studionet; read contract balance and liabilities, verify ability to recover value. If observed platform behavior makes recovery impossible for an input class, add a safe guard or mark NOT COMPLETE. Do not simply catch all errors and return a success state.

## External transfer recovery
External EOA transfers use `emit_transfer` and finalize separately from the parent. Emitted funds are no longer required to remain in the Vault's native balance, but they stay as unresolved delivery obligations until objective evidence is available. The GenLayerJS SDK exposes parent-listed child IDs and transaction reads; the frontend validates child hash, sender, recipient, value, status and explicit execution result as a separate external status. That status never mutates on-chain `UNKNOWN_DELIVERY`. A delayed child remains pending; an undetermined child remains undetermined; a child execution error does not, by itself, prove non-delivery; multiple successful matches are reported as a possible duplicate payout. The live Studionet read returned the exact child hash, sender, recipient, value, and FINALIZED status, but omitted execution result. The full receipt method returned `Method not found`, so the observer remained UNKNOWN. A separate historical recipient balance delta is not attributed to this child by the observer. No blind resend is permitted.

The contract has no native transaction-query method in the deployed implementation. A nondeterministic web request could fetch third-party explorer/RPC data, but consensus over that response would still rely on the external source and would not itself provide cryptographic receipt proof. Do not add a contract transition for delivered or failed until the evidence source and runtime behavior are independently validated.

## Recoverable vs unrecoverable
- Interrupted browser after submit: recover from exact persisted hash, poll receipt and LATEST_FINAL state; do not send new tx.
- Program verification provider outage: proposal expires and may be reproposed with genuine new evidence; no GEN locked.
- Revision evidence outage: original reviewed rules and rights stay active; permissionless timeout clears pending request.
- Signed but unfunded offer expires: no funds to reclaim.
- Funded unaccepted offer expires: A can allocate refund deterministically.
- B does not claim maturity: credit stays claimable indefinitely, without centralized cron or owner sweep.
- Mutually proposed but unapproved closure: bounded expiry restores normal path.
- Outgoing external transfer genuinely failed with no objective failure proof: disclose UNKNOWN_DELIVERY, do **not** automate replay or claim full fund recovery.

## Source mismatch and deployment
Read deployed source with `gen_getContractCode` at finalized state if available; decode base64 and compare SHA256 of precise bytes / explicitly normalized line endings to repository contract. If unavailable, label source attestation unverified; never substitute explorer address as proof of byte equality. Re-deploy after contract source mutation; retire old addresses and replace frontend config/evidence. Protect the default branch with required checks.

## Official sources used to inform this spec (accessed 2026-10-13)
- https://docs.genlayer.com/developers/intelligent-contracts/features/value-transfers
- https://docs.genlayer.com/developers/decentralized-applications/fee-outcomes-and-debugging
- https://docs.genlayer.com/developers/decentralized-applications/querying-a-transaction
- https://docs.genlayer.com/developers/decentralized-applications/reading-data
- https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle
