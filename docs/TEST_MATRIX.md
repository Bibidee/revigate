# Test matrix status

## Current scope

The active product is a noncustodial Registry. Funded offer creation, acceptance, exits, maturity payouts, refunds, withdrawals, balance reconciliation and transfer delivery are removed from the supported product and are not safe to run against the former escrow deployment.

## Local checks

The post-redesign JavaScript, Direct Mode, typecheck, lint and production build pass locally. The replacement Direct Mode suite covers the version 4 noncustodial identity, absence of payable and escrow methods, authenticated registration, verification guards and acknowledgment records.

## Hosted checks

The exact committed V4 source is deployed at `0x2E2065063b63F305512Ee66F0FEb305557c9143b`. The zero-value hosted lifecycle is complete: source verification `VERIFIED`, NONMATERIAL `NONMATERIAL`, MATERIAL `MATERIAL`, ambiguous actual result `MATERIAL`, acknowledgment finalized and reaffirmation finalized. Exact hashes and canonical readbacks are in `evidence/noncustodial/2026-10-15-registry-v4-lifecycle.json`.

The prior single-contract escrow evidence remains historical: failed payable execution retained value while storage rolled back, wrong-method/no-calldata value remained unassigned, and an outgoing child transfer was `UNKNOWN_DELIVERY`. No replay is authorized and no recipient credit is inferred from finality alone.

## Browser and release gates

The public production page was visually checked after contract loading and displayed `Noncustodial Registry identity verified`; the identity warning was absent. Wallet rejection, network/account switching, pending/unknown finality, refresh recovery and mobile checks still need fresh evidence on the promoted build. Green CI for the latest evidence commit is complete (run 95, head `2279d771f3bd4cacd1589a4a585f634080036c8d`). Independent security review, second PR approval and merge into `main` remain open. Only zero-value Registry writes are available and no funds are accepted.
