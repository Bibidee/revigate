# Implementation inventory

## Active product

`contracts/revigate.py` is the only active deployable Intelligent Contract. It authenticates GitHub rulebook sources, verifies revisions and records wallet acknowledgments. It is explicitly noncustodial: no payable method, native GEN accounting, offers, credits, refunds, payouts or withdrawals exist. The former escrow source and its evidence are archived under `contracts/archive/` and must not receive funds.

The frontend uses injected EIP-1193 wallets for zero-value Registry writes. It persists transaction hashes with chain/address/wallet scope and distinguishes pending, unknown, failed and finalized states. It never treats transaction finality as proof of a balance change.

## Verification state

The V4 source redesign is complete and merged into `main`. The exact active source is attested on Studionet 61999 at Registry `0x2E2065063b63F305512Ee66F0FEb305557c9143b` with SHA-256 `99DB611FC5552F26F22DC3DECC9F7A7676C0A676AD587D593D62792EDEE73064`. Local JavaScript, Direct Mode, typecheck, lint and build checks pass, and post-merge CI run 98 is green.

## Release boundary

The approved noncustodial test address is `0x2E2065063b63F305512Ee66F0FEb305557c9143b` on Studionet 61999, and the corrected frontend is promoted publicly at `https://the-revigate.vercel.app` from merged `main`. Only zero-value Registry actions are available; native custody writes do not exist. The previous escrow deployment is historical and cannot be used as the address for the noncustodial source. The custody decision is a defensive product change, not an independent security review.
