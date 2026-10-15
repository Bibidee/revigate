# Implementation inventory

## Active product

`contracts/revigate.py` is the only deployable Intelligent Contract. It contains authenticated GitHub source verification, acknowledgments, revision materiality and native GEN offer accounting. The former Registry source is archived at `contracts/archive/revigate_registry_v2.py` and is not deployed.

The frontend uses injected EIP-1193 wallets and one configured address. It submits the exact attached value, persists the hash with chain/address/wallet scope, distinguishes pending, unknown, failed and finalized states, and only clears a pending item after canonical readback. It never treats an emitted transfer or parent finality as proof of recipient credit.

## Local evidence

- JavaScript tests: 23 passing.
- Direct Mode tests: 52 passing against the single active source.
- TypeScript: passing.
- ESLint: passing.

These checks do not certify hosted validator behavior, protocol rollback or recipient delivery.

## Release boundary

No production contract address is approved by this document. A disposable Studionet deployment may be used for source attestation and controlled tests, but production custody remains locked until live failure recovery, outbound delivery and the two-wallet matrix are complete. The work is an adversarial self-audit; it is not an independent security review.
