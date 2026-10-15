# Implementation inventory

## Active product

`contracts/revigate.py` is the only active deployable Intelligent Contract. It authenticates GitHub rulebook sources, verifies revisions and records wallet acknowledgments. It is explicitly noncustodial: no payable method, native GEN accounting, offers, credits, refunds, payouts or withdrawals exist. The former escrow source and its evidence are archived under `contracts/archive/` and must not receive funds.

The frontend uses injected EIP-1193 wallets for zero-value Registry writes. It persists transaction hashes with chain/address/wallet scope and distinguishes pending, unknown, failed and finalized states. It never treats transaction finality as proof of a balance change.

## Verification state

The source redesign is complete locally but requires the post-change JavaScript, Direct Mode, typecheck, lint and build rerun. A disposable Studionet deployment and source attestation must use the exact reviewed commit.

## Release boundary

The approved noncustodial test address is `0x2E2065063b63F305512Ee66F0FEb305557c9143b` on Studionet 61999, and the corrected frontend has been promoted publicly. Production writes remain locked. The previous escrow deployment is historical and cannot be used as the address for the noncustodial source. The custody decision is a defensive product change, not an independent security review.
