# Implementation status

Recorded 2026-10-16 on branch `feat/revigate-funded-registry`, based on merged `main` `febfafa057488f6d67648d3869b9f0b3c726fde0`.

## Active architecture

`contracts/revigate.py` is the single contract. It retains authenticated GitHub source verification and GenLayer materiality consensus while restoring the historical offer mechanics as a gated ledger. `custody_enabled` and `public_custody` are constructor flags. The public frontend now points at the source-attested candidate, while production writes and public custody remain locked.

## Local verification

- JavaScript tests: 23 passing.
- Direct Mode: 46 passing.
- TypeScript: passing.
- ESLint: passing.
- Production build: passing.

## Hosted source and funded evidence

Fresh disposable deployment:

- Contract: `0x377509f00e0731df34673501C9cfE57e2FAEA843`
- Deployment transaction: `0xa0cab84c1348c7a04be60e2a7b5dae6e7d4d402ecf81da4bb155da94e1758047`
- Source SHA-256: `A7859429ACAEAEA10C5E376E5A3B851920C0BC5DB9C2C0FAF72D7EE793C5C0C2`
- Source attestation: exact local match; reviewed source commit `4357b6125d63f24927d03bcc97f09b4798aa5ec4`
- Config: chain 61999, version 5, custody enabled for test, public custody false

The signed baseline `313dfb0ac2b20f32954dd0ffb08fa60214ae34da` verified at epoch 1 from `rules/revigate-v2.md`; the MATERIAL candidate `376e447065b8a7efd1d26a60c6c9ac476bd1e567` advanced epoch 2. Disposable unlocked accounts A `0x527dA5f7022f14f7105E5f06cEc1a8EFf53556b5` and B `0x7C65cE913F5665c11f1219048112C84CD6cb2a4B` completed the corrected-source funded paths:

- Offer 1: 1,000 wei funded and accepted; MATERIAL exit allocated 200 to A and 800 to B.
- Offer 2: 777 wei funded and refunded while unaccepted.
- Offer 4: 444 wei funded, accepted, matured and allocated to B.
- An additional 555 wei offer remains accepted and held until its longer maturity; it is not counted as settled.
- A withdrawals: 1,200 wei plus 1,332 wei; observed combined balance delta +2,532.
- B withdrawal: 1,244 wei; observed balance delta +1,244 from the pre-candidate baseline.
- Duplicate B withdrawal: execution ERROR; no second credit was dispatched.
- An unknown-offer 1,000 wei funding attempt returned `REFUNDABLE_CREDIT_UNKNOWN_OFFER` and was later included in the publisher's withdrawals.
- Ledger: deposited 4,331, held 555, credits 0, dispatched 3,776, accounted 4,331; the native contract balance is 555 wei, matching the still-held offer.

The withdrawal parent hashes were submitted and canonical transfer records exist, but the RPC returned not-found/unavailable for those parent hashes during the child lookup. No child execution result is claimed and no replay is authorized. The observed wallet deltas are evidence of balance movement only; external settlement remains `PENDING_UNTIL_INDEPENDENTLY_VERIFIED`.

Exact transaction hashes, parent/child IDs, balance readbacks and canonical state are in [funded lifecycle evidence](../evidence/single-contract/2026-10-16-funded-studionet-lifecycle.json).

## Production frontend

Vercel production deployment `dpl_D3raXV8ajYNZxk3TgfYWxvAForQ3` is READY and
aliased at [the-revigate.vercel.app](https://the-revigate.vercel.app). The
production bundle contains the candidate address and the page returns HTTP 200.
The contract remains `public_custody=false`, so this promotion does not accept
user funds. Visual wallet-extension testing was not certified because Computer
Use could not safely identify the current Windows browser URL.

## Custody decision

The supported payable route accounts value before validation and returns typed outcomes for invalid offer, sender, deadline, amount and duplicate cases. This does not solve unsolicited no-calldata value, nonpayable value retention or a child transfer with no execution result. The historical GenLayer probes remain protocol-level evidence. Public custody is not enabled, and no user funds are accepted.

## Release gates still open

1. Independent security review.
2. Second approved PR review.
3. Fresh green CI for the pushed implementation and documentation head; the exact run and commit are recorded in PR #4 and the final release report.
4. Complete hosted/browser matrix, including mobile wallet-extension, network/account switching, pending/unknown finality and refresh recovery.
5. Owner authorization before public custody or merge.

The corrected frontend promotion is complete; no merge or public-custody
promotion is claimed from this branch.

