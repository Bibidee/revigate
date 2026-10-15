# Revigate contract API and data

## Configuration

`get_config()` returns protocol `revigate-registry-v1`, chain ID `61999`, contract version `3`, custody `SINGLE_CONTRACT_ESCROW`, native escrow `NATIVE_GEN`, and transfer evidence `EXTERNAL_MESSAGE`. The frontend rejects any other identity.

## Rulebook writes

- `register_program(repo, rulebook_path, manifest_path, branch, baseline_sha)` creates a proposed program for the caller.
- `verify_program(program_id)` authenticates the nominated GitHub-verified baseline and activates epoch 1.
- `acknowledge_rules`, `reaffirm_rules`, `request_revision`, `assess_revision`, and `expire_revision_request` maintain immutable participation history and materiality epochs.

## Offer writes

- `create_offer(...)` freezes publisher, participant, amount, epoch, deadlines and the exit formula without accepting value.
- Payable `fund_offer(offer_id)` accepts exactly the frozen amount. Nonzero invalid payments are recorded as sender credit with a typed result; a successful payment moves the amount to `held`.
- `accept_offer`, `decline_offer`, `cancel_unaccepted_offer`, and `expire_unaccepted_offer` enforce role and deadline state transitions.
- `exercise_material_exit` and `allocate_matured_claim` allocate held value once. `propose_closure` and `approve_closure` require the same immutable digest and both wallets.
- `withdraw_credit(amount)` consumes credit before emitting an external message and creates a single-use transfer record. The record is `UNKNOWN_DELIVERY` until an independent recipient balance delta is observed.

## Accounting

`get_ledger_totals()` exposes deposited, held, wallet credits, dispatched outbound obligations and their accounted sum. An accounted surplus is not silently assigned to a wallet. No method authorizes automatic replay of an unknown transfer.

## Safety boundary

The contract does not claim that a nonpayable method prevents unsolicited native value at the network level. GenLayer protocol rollback, no-calldata transfers and failed external messages require live Studionet evidence. Until those paths are resolved, the production write gate remains locked.
