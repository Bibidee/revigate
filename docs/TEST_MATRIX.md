# Test matrix status

## Current scope

The active product is a noncustodial Registry. Funded offer creation, acceptance, exits, maturity payouts, refunds, withdrawals, balance reconciliation and transfer delivery are removed from the supported product and are not safe to run against the former escrow deployment.

## Local checks

The post-redesign JavaScript, Direct Mode, typecheck, lint and production build pass locally. The replacement Direct Mode suite covers the version 4 noncustodial identity, absence of payable and escrow methods, authenticated registration, verification guards and acknowledgment records.

## Hosted checks

The exact committed V4 source is deployed at `0x2E2065063b63F305512Ee66F0FEb305557c9143b`. The zero-value hosted lifecycle is complete: source verification `VERIFIED`, NONMATERIAL `NONMATERIAL`, MATERIAL `MATERIAL`, ambiguous actual result `MATERIAL`, acknowledgment finalized and reaffirmation finalized. Exact hashes and canonical readbacks are in `evidence/noncustodial/2026-10-15-registry-v4-lifecycle.json`.

The prior single-contract escrow evidence remains historical: failed payable execution retained value while storage rolled back, wrong-method/no-calldata value remained unassigned, and an outgoing child transfer was `UNKNOWN_DELIVERY`. No replay is authorized and no recipient credit is inferred from finality alone.

## Browser and release gates

Wallet connection, disconnection, network/account switching, rejection, pending/unknown finality, refresh recovery and mobile checks still need fresh evidence on the promoted build. The current browser safety check could not inspect the active Brave URL. Independent security review, second PR approval, green CI for the final evidence commit and merge into `main` remain open. Production writes stay locked and no funds are accepted.
