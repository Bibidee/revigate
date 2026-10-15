# Test matrix status

## Current scope

The active product is a noncustodial Registry. Funded offer creation, acceptance, exits, maturity payouts, refunds, withdrawals, balance reconciliation and transfer delivery are removed from the supported product and are not safe to run against the former escrow deployment.

## Local checks

The post-redesign JavaScript, Direct Mode, typecheck, lint and production build are pending rerun. The replacement Direct Mode suite covers the version 4 noncustodial identity, absence of payable and escrow methods, authenticated registration, verification guards and acknowledgment records.

## Hosted checks

A new disposable zero-value Studionet deployment must be created from the exact committed source. Against that address, refresh baseline verification, NONMATERIAL, MATERIAL, ambiguous and acknowledgment lifecycle evidence. Preserve actual outcomes, transaction hashes, finalized receipts and canonical readbacks.

The prior single-contract escrow evidence remains historical: failed payable execution retained value while storage rolled back, wrong-method/no-calldata value remained unassigned, and an outgoing child transfer was `UNKNOWN_DELIVERY`. No replay is authorized and no recipient credit is inferred from finality alone.

## Browser and release gates

Wallet connection, disconnection, network/account switching, rejection, pending/unknown finality, refresh recovery and mobile checks still need fresh evidence on the corrected noncustodial build. Independent security review, second PR approval, green CI for the final commit, production promotion and merge into `main` remain open. Production writes stay locked and no funds are accepted.
