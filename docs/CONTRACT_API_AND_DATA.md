# Revigate contract API and data

## Configuration

`get_config()` returns protocol `revigate-registry-v1`, chain ID `61999`, contract version `4`, custody `NONE`, escrow `NONE`, and transfer evidence `NONE`. The frontend rejects any other identity.

## Rulebook writes

- `register_program(repo, rulebook_path, manifest_path, branch, baseline_sha)` creates a proposed program for the caller.
- `verify_program(program_id)` authenticates the nominated GitHub-verified baseline and activates epoch 1.
- `acknowledge_rules`, `reaffirm_rules`, `request_revision`, `assess_revision`, and `expire_revision_request` maintain source-authenticated participation history and materiality epochs.

## Safety boundary

The active contract has no payable method and no native-value ledger. It cannot accept a funded offer, assign a refund, allocate a payout or withdraw credit. Every frontend write explicitly uses zero native GEN. Do not claim that a nonpayable contract prevents unsolicited network transfers; such transfers remain outside application accounting and are not recoverable through Revigate.

The former escrow API is historical only. Its failed-payable and unsupported-transfer probes are retained as evidence for the decision to remove custody.
