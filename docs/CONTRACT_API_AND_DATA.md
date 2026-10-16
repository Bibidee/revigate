# Revigate contract API and data

## Configuration

`get_config()` returns protocol `revigate-registry-v1`, chain ID `61999`, contract version `5`, custody `DISABLED` or `SINGLE_CONTRACT_ESCROW`, `custody_enabled`, `public_custody`, and transfer evidence `PENDING_EXTERNAL_SETTLEMENT`.

## Registry writes

- `register_program(repo, rulebook_path, manifest_path, branch, baseline_sha)`
- `verify_program(program_id)`
- `acknowledge_rules`, `reaffirm_rules`, `request_revision`, `assess_revision`, and `expire_revision_request`

## Agreement writes

- `create_offer(program_id, participant, amount, funding_deadline, acceptance_deadline, maturity, exit_bps, exit_window_seconds)`
- `fund_offer(offer_id)` (payable)
- `accept_offer`, `decline_offer`, `cancel_unaccepted_offer`, `expire_unaccepted_offer`
- `reaffirm_offer_rules`, `exercise_material_exit`, `allocate_matured_claim`
- `propose_closure`, `approve_closure`, `cancel_closure`, `expire_closure`
- `withdraw_credit(amount)`
- `record_transfer_delivery_claim(transfer_id, evidence)`

## Readbacks

`get_program`, `get_program_page`, `get_offer`, `get_offer_page`, `get_wallet_credit`, `get_transfer` and `get_ledger_totals` expose the canonical state machine. Ledger totals report deposited, held, credits and dispatched liabilities. A pending external transfer is not counted as a completed recipient credit.

## Value-transfer boundary

The supported `fund_offer` route credits every nonzero value before ordinary validation and returns typed outcomes for invalid paths. This is an application-level mitigation for the supported payable entry point. It cannot recover unsolicited value sent with no calldata or value sent to a nonpayable method, and it cannot prove delivery of an external EOA transfer. GenLayer's documented failed child-transfer behavior remains a protocol-level gate. Never infer recipient credit from parent or child finality alone.
