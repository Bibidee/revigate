# Implementation inventory

## Active product

`contracts/revigate.py` is the single active Intelligent Contract. It authenticates GitHub rulebook sources, runs GenLayer materiality consensus, records acknowledgments and stores the gated offer/credit/settlement ledger. The old two-contract Vault is archived reference material; it is not an active deployment target.

The frontend uses injected EIP-1193 wallets and source-attestation checks. It scopes pending hashes by chain, contract and wallet and distinguishes pending, unknown, failed and finalized states. It never treats transaction finality alone as proof of an EOA balance change.

## Current candidate

Branch: `feat/revigate-clausebid-standard-release`

Fresh disposable Studionet candidate: `0xb875126Ab537327d9E7E87488C89668C071d2997`, source SHA-256 `A7859429ACAEAEA10C5E376E5A3B851920C0BC5DB9C2C0FAF72D7EE793C5C0C2`, config version 5, custody and public-custody flags enabled for this controlled test only. Its hosted evidence is in `evidence/single-contract/2026-10-16-public-enabled-funded-demo.json`.

## Release boundary

The final frontend is configured for the candidate address and will be promoted
to `https://the-revigate.vercel.app` after the final evidence commit. The public
flag is limited to this Studionet demo; no user funds are accepted. The
historical V4 address and all earlier Vault addresses must not receive funds.
