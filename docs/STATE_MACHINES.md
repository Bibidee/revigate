# Revigate State Machines and Transition Invariants

## Program
`PROPOSED` -> `VERIFIED` after successful authentication and stable baseline.
`PROPOSED` -> `EXPIRED_UNVERIFIED` after deterministic proposal deadline.
`VERIFIED` persists; revision requests have their own state; a program may later display retired status but retirement **cannot cancel outstanding accepted escrow** (defer retirement action from V1).

## Revision request
`PENDING` -> `MATERIAL` if authenticated semantic materiality consensus succeeds: increment program epoch exactly once; activate SHA/document digest and store epoch change time.
`PENDING` -> `NONMATERIAL` if authenticated semantic nonmaterial consensus succeeds: update active reviewed SHA/document digest; epoch unchanged.
`PENDING` -> `INCONCLUSIVE` if review itself successfully finalizes with evidence uncertainty: **do not advance active reviewed SHA or epoch**.
`PENDING` -> `EXPIRED` when elapsed persisted request deadline reached, even after failed outer consensus or network outages.
Protocol `UNDETERMINED`, execution error, cancellation or leader timeout -> **still `PENDING` in canonical contract state**, until separately successful write resolves/expires it.
One review per `(program, candidate SHA, previous reviewed SHA)`; forbid replay even if first review was inconclusive without documented changed proof strategy. Allow a new authorized request after cooldown and expiry only for a genuinely distinct candidate or stated proof recovery policy.

## Offer
`OFFERED_UNFUNDED` -> `FUNDED_UNACCEPTED` exact publisher deposit and finalized canonical readback.
`OFFERED_UNFUNDED` -> `EXPIRED_UNFUNDED` after funding/offer deadline, no GEN liability.
`FUNDED_UNACCEPTED` -> `ACCEPTED_LOCKED` B signs frozen terms against verified program epoch before acceptance deadline.
`FUNDED_UNACCEPTED` -> `REFUND_ALLOCATED` if B declines, A cancels before acceptance, or anyone expires after deadline.
`ACCEPTED_LOCKED` -> `MATURED_ALLOCATED` at maturity, full credit to B (100% amount).
`ACCEPTED_LOCKED` -> `MATERIAL_EXIT_ALLOCATED` if B exercises a valid pre-agreed early exit before maturity within the original first-material epoch window, with exact A/B split.
`ACCEPTED_LOCKED` -> `MUTUAL_CLOSURE_ALLOCATED` only if both parties agree on exact allocation digest before closure timeout.
All allocated states are terminal for **allocation** and never re-enter locked; payment delivery tracked separately.

## Financial rails
`UNFUNDED` -> `HELD` -> (`A_CREDIT` and/or `B_CREDIT`) -> `TRANSFER_REQUESTED` -> `EXTERNAL_MESSAGE_EMITTED` -> either `DELIVERY_VERIFIED` using objectively independently checked network evidence, or `UNKNOWN_DELIVERY` requiring explicit user disclosure and protocol-safe handling.
Credits are liabilities before emission; pending/external messages cannot be treated as spendable twice. `UNKNOWN_DELIVERY` has no automatic retry absent reliable non-delivery proof.
Actual on-chain ledger state must not misleadingly say `PAID` based solely on an EOA's self-acknowledgment.

## Precedence rules
1. Once acceptance and funding are finalized, subsequent program revisions cannot alter B's full maturity entitlement.
2. Once maturity reached, full B claim takes precedence over a new early-exit or unfinished closure proposal. An A-created closure cannot obstruct B.
3. An already finalized early-exit allocation beats later maturity (no second allocation).
4. A pending revision review cannot block an existing B maturity claim, A refund for expired unaccepted offer, or already allocated withdrawal.
5. Neither a semantic INCONCLUSIVE nor a protocol UNDETERMINED changes economic balances.
6. An acknowledgment marked stale by a new material epoch is only a *rules-currentness* statement, not a retroactive annulment of an offer acceptance.
7. A nonmaterial revision should not force unnecessary B re-signature; material revision affects subsequent acknowledgment-currentness.
8. When a review failed to finalize, current epoch and version remain unchanged, and stale UI speculation is invalid.

## Deadline policy (V1 targets; change only with tests and user-readable documentation)
- Program proposal verification: 24 hours.
- Offer funding deadline: must follow creation and precede offer acceptance deadline; no later than 30 days after creation.
- Offer acceptance deadline: must precede maturity; no later than 30 days after creation.
- Maturity: strictly greater than acceptance deadline; within 1 to 365 days after creation.
- Publisher revision review window: 24 hours, deterministic expiry available once elapsed.
- Revision request minimum spacing: 5 minutes per program; max one pending.
- Material exit window: **seven days from first accepted material review after B's last acknowledgment**, capped at maturity; source terms record window seconds (default 604800), range 3600..2592000; no window extension through multiple unacknowledged material changes. B may still claim full amount at maturity.
- Mutual closure proposal window: 1 hour, no claimant-blocking after maturity.
- Timestamp comparisons include equal-boundary tests; use consistent UTC onchain seconds and explicit `<=`/`<` in code.

## Sequence diagram
```
Wallet A              Contract               GenLayer validators            Wallet B
   | propose program      |                          |                       |
   |--------------------->|                          |                       |
   |                      | verify independent source |                       |
   |                      |------------------------->|                       |
   |                      | verified epoch 1 <--------|                       |
   | create offer         |                          |                       |
   |--------------------->|                          |                       |
   | fund exact GEN       |                          |                       |
   |--------------------->| HELD                     |                       |
   |                      |<---------------------------------------- accept/ack|
   | request revision     |                          |                       |
   |--------------------->| PENDING                  |                       |
   |                      | assess (separate write)  |                       |
   |                      |------------------------->| materiality verdict   |
   |                      | epoch 2 if material <-----|                       |
   |                      |<---------------------------------------- reaffirm  |
   |                      |<---------------------------------------- claim at maturity
   |                      | credit B, then B withdrawal / finality           |
```
