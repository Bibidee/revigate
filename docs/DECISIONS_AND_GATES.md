> **ARCHIVED:** This document describes the removed escrow candidate and is retained only as historical security evidence. See [current status](IMPLEMENTATION_STATUS.md).

# Decision Register and Unverified Feasibility Gates

## Product decisions locked for V1
D1 — Rulebook change adjudication is the only GenLayer semantic judgment whose success can affect participant revision epochs.
D2 — Escrow is publisher-funded, participant-specific, in native test GEN only; named beneficiary must explicitly accept.
D3 — An accepted offer gives B **100% of the locked amount when maturity is reached**. No new publisher rule can reduce or delay that claim. Upstream rulebook changes affect future program acknowledgments, not frozen accepted cash terms.
D4 — Optional early material-change exit has an exact fixed basis-points participant payout and remainder refund to publisher. Both shares sum precisely to the remaining escrow; no arbitrary percentages at settlement time.
D5 — Unaccepted offers can expire, be declined or be withdrawn by A. **Accepted offers cannot be cancelled unilaterally**, regardless of changes.
D6 — An authenticated material revision increments the program epoch and marks earlier rule acknowledgments stale for **new participation** while leaving their history readable. `NONMATERIAL` keeps epoch. `INCONCLUSIVE` does not advance accepted source or epoch.
D7 — No code path lets an AI judge pick an address, amount or economic allocation; those are deterministic frozen terms.
D8 — One contract preferred; keep the interface and testing independent of implementation modules. Split Vault/Registry only on demonstrated safety grounds and document additional asynchronous child-failure handling.
D9 — No application backend. Browser connects directly to Studionet.
D10 — Program publisher submits revision candidates on-chain, but **participants cannot force publisher to publish arbitrary GitHub changes in V1**. UI acknowledges this limitation. Reviews are not automatic.
D11 — Only **future** offer creation, funding and acceptance pause during a pending revision (existing accepted claims and deterministic escrow recovery remain available). Pending reviewer timeout is deterministic and permissionless. Prevent indefinitely blocking users due to unanswered review.
D12 — Program rule acknowledgment is distinct from acceptance of a funded offer; accepting an offer also records acknowledgment of its bound verified epoch.
D13 — Contract outcomes distinguish semantic `INCONCLUSIVE` from protocol `UNDETERMINED` or execution error. No economic change on unsuccessful consensus.

## Explicit feasibility gates (not pre-verified)
G1 — Pinned local CLI 0.39.1 + selected compatible SDK must deploy and accurately encode contract calls on Studionet 61999. Never silently upgrade.
G2 — GenVM validators can fetch GitHub repository/commit/tree/raw/compare information and parse the nominated Markdown + wallet manifest within bounded cost and response sizes; signed-commit `verification` fields are populated for real published sources. Test real fixtures. If source unavailable, do not claim verified.
G3 — Economic invariants after payable function validation failure must be verified *live*. A failed payable transaction might leave inbound value at the contract despite transaction error. No successful money custody claim until funded, invalid-value and other failure scenarios pass accounting/recovery tests.
G4 — Outgoing transfer semantics on Studionet must be verified: amount, recipient, finalization, child/external-message evidence and double-send protection. If failed-delivery detection/recovery cannot be reliably demonstrated, publish the limitation and mark the escrow release **NOT COMPLETE**; do not relabel user confirmation as cryptographic proof.
G5 — Persistent timeout record must be finalized **before** nondeterministic review. Failing outer consensus does not reliably persist modifications made inside the failed transaction. Show persisted request remains permissionlessly expirable.
G6 — Check actual network fee/policy support and necessary budget for validator web calls and transfer messages; do not confuse paid fees with escrow `value`.
G7 — Confirm current RPC allows finalized deployed-source retrieval (`gen_getContractCode`) and compare actual decoded bytes/hash; if unavailable, disclose rather than fabricate source attestation.
G8 — Source publication wallet nomination and GitHub verified commit checks are only the defined provider trust boundary. They do not cryptographically prove a human organization's legal identity. Preserve this caveat.
G9 — Browser SDK must expose accurate receipt execution status and finalized-only canonical reads; feature probe and test rather than assuming an API introduced after pinned release is present.

## Authority of documents
Product semantics and hard financial protections are binding. Code snippets, example names and dependency versions besides the explicitly pinned CLI are guidance only and must be verified against actual pinned package APIs. If a hard guarantee is technically impossible, stop with specific evidence instead of silently redefining the product.
