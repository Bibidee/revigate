# Test matrix status

## Current scope

The active product is a noncustodial Registry. Funded offer creation, acceptance, exits, maturity payouts, refunds, withdrawals, balance reconciliation and transfer delivery are removed from the supported product and are not safe to run against the former escrow deployment.

## Local checks

The post-redesign JavaScript, Direct Mode, typecheck, lint and production build pass locally. The replacement Direct Mode suite covers the version 4 noncustodial identity, absence of payable and escrow methods, authenticated registration, verification guards and acknowledgment records.

## Hosted checks

The exact committed V4 source is deployed at `0x2E2065063b63F305512Ee66F0FEb305557c9143b`. Its zero-value hosted lifecycle is complete: source verification `VERIFIED`, NONMATERIAL `NONMATERIAL`, MATERIAL `MATERIAL`, ambiguous actual result `MATERIAL`, acknowledgment finalized and reaffirmation finalized. This active V4 record uses the archived `revigate-rulebook-fixture-v2` fixture. The separate Wallet A signed fixture lifecycle was run on the prior Registry V2 deployment and is not substituted for V4 evidence. Exact V4 hashes and canonical readbacks are in `evidence/noncustodial/2026-10-15-registry-v4-lifecycle.json`.

The prior single-contract escrow evidence remains historical: failed payable execution retained value while storage rolled back, wrong-method/no-calldata value remained unassigned, and an outgoing child transfer was `UNKNOWN_DELIVERY`. No replay is authorized and no recipient credit is inferred from finality alone.

## Browser and release gates

The public production page was visually checked after contract loading and displayed `Noncustodial Registry identity verified`; the identity warning was absent. Disconnect/reconnect, refresh recovery and the 390x844 mobile layout passed on the promoted build with no horizontal overflow. A Rabby rejection attempt was not reproduced: the prompt returned submitted hashes for zero-value `register_program` (`0xc048048a7dd5928befe8277d147973d1ed9ce3e026a9ec61157427d1adf04714`) and `verify_program` (`0x307f21ce2658d8a556c84982b00944d554cbee1b62e13b09e2779882ad2b5043`); both finalized, and Program 2 read back as `VERIFIED`. Network switching, account switching and pending/unknown finality remain untested. Full details are in `evidence/browser/2026-10-16-production-wallet-checks.json`. Post-merge CI run 98 passed on `main` at `c38a61620a1a0625454e7b710272bea441ae4ecb`. No independent external security audit has been obtained, and the historical observer probe still lacks confirmed terminal finality. Only zero-value Registry writes are available and no funds are accepted.

The release is **SUBMISSION READY WITH DISCLOSED LIMITATIONS**. PR #1 is merged into `main`; this status does not claim an independent security certification or completed competition submission.
