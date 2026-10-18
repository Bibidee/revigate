# Implementation inventory

## Active product

`contracts/revigate.py` is the single active Intelligent Contract. It
authenticates GitHub rulebook sources, runs GenLayer materiality consensus,
records acknowledgments and stores the gated native GEN agreement ledger. The
old two-contract Vault is archived reference material and is not an active
deployment target.

The frontend uses injected EIP-1193 wallets and source-attestation checks. It
scopes pending hashes by chain, contract and wallet, distinguishes pending,
unknown, failed and finalized states, and never treats transaction finality
alone as proof of an EOA balance change.

## Current V5 candidate

Merged source: PR #10, merge commit
`44121ab5f07f4a9048f73268cdfda1daf14f6562`.

Studionet deployment: `0xb77DF392fFE9bFc93Ab9Fd79D7a26400dB3c3684`.
Source SHA-256: `ED52C6BC82B9A4990DB2A0FC9C6D2C531C0CAEF76BD013124D18CBD0705C6A88`.
Constructor configuration: `custody_enabled=true`, `public_custody=false`.
Deployment transaction: `0x710d4a88bdf535754daff67fbba4a394e4ddc9ef18d11e0acec666ec0072ed68`.

The first signed MATERIAL revision and epoch-2 offer were verified on this
deployment. The controlled funded regression is now complete: Offer 1 was
funded with 555 wei and accepted, a second signed MATERIAL revision advanced
the program to epoch 3 after the first event window expired, and the
participant exit allocated 444 wei to the publisher and 111 wei to the
participant using the later event timestamp. The final ledger and 555 wei
contract balance reconcile exactly. No withdrawal was submitted.

## Release boundary

The current V5 deployment is a disposable Studionet test target. The frontend
public custody controls remain locked and no user funds are accepted. The
contract's `custody_enabled` setting permits controlled test methods, but does
not make the product production-safe or block unsolicited network transfers.
Unsupported value-recovery paths, missing child execution proof and incomplete
browser/wallet-extension coverage remain open.

The earlier public-enabled V5 demo, V4 Registry and historical Vault addresses
are retained in evidence files as historical records only. They must not
receive new funds or be substituted for the current deployment.
