# Implementation inventory

## Active product

`contracts/revigate.py` is the single active Intelligent Contract. It authenticates GitHub rulebook sources, runs GenLayer materiality consensus, records acknowledgments and stores the gated offer/credit/settlement ledger. The old two-contract Vault is archived reference material; it is not an active deployment target.

The frontend uses injected EIP-1193 wallets and source-attestation checks. It scopes pending hashes by chain, contract and wallet and distinguishes pending, unknown, failed and finalized states. It never treats transaction finality alone as proof of an EOA balance change.

## Current candidate

Branch: `feat/revigate-funded-registry`

Fresh disposable Studionet candidate: `0x377509f00e0731df34673501C9cfE57e2FAEA843`, source SHA-256 `A7859429ACAEAEA10C5E376E5A3B851920C0BC5DB9C2C0FAF72D7EE793C5C0C2`, config version 5, custody enabled for test only, public custody false. Its hosted evidence is in `evidence/single-contract/2026-10-16-funded-studionet-lifecycle.json`.

## Release boundary

Production remains bound to the prior locked/noncustodial deployment until this candidate passes maturity, transfer delivery and review gates. No user funds are accepted. The historical V4 address and all earlier Vault addresses must not receive funds.
