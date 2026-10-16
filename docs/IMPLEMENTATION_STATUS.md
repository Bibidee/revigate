# Implementation status

Recorded 2026-10-16 on branch `feat/revigate-funded-registry`, based on merged `main` `febfafa057488f6d67648d3869b9f0b3c726fde0`.

## Active architecture

`contracts/revigate.py` is the single contract. It retains authenticated GitHub source verification and GenLayer materiality consensus while restoring the historical offer mechanics as a gated ledger. `custody_enabled` and `public_custody` are constructor flags. Production remains locked; the hosted custody instance is disposable evidence only.

## Local verification

- JavaScript tests: 23 passing.
- Direct Mode: 46 passing.
- TypeScript: passing.
- ESLint: passing.
- Production build: passing.

## Hosted source and funded evidence

Fresh disposable deployment:

- Contract: `0xedfE5a6354a518Fbb46111cBa9D3216DA5869b99`
- Deployment transaction: `0xe80bbd5229fa6c7f0c17cb39497e1a932e556f316d6f4c50fe16b4d4e9a4e54a`
- Source SHA-256: `5F49DDBA7C88DA98B584F02F28075B1B1DA54305F0C68105344108522F4C833A`
- Source attestation: exact local match; reviewed source commit `dba18424f939a95acd36293ce7842d26e27311a1`
- Config: chain 61999, version 5, custody enabled for test, public custody false

The signed baseline `313dfb0ac2b20f32954dd0ffb08fa60214ae34da` verified at epoch 1 from `rules/revigate-v2.md`; the MATERIAL candidate `376e447065b8a7efd1d26a60c6c9ac476bd1e567` advanced epoch 2. Disposable unlocked accounts A `0x527dA5f7022f14f7105E5f06cEc1a8EFf53556b5` and B `0x7C65cE913F5665c11f1219048112C84CD6cb2a4B` completed:

- Offer 2: 1,000 wei funded and accepted; MATERIAL exit allocated 800 to A and 200 to B.
- Offer 3: 777 wei funded and refunded while unaccepted.
- Offer 4: 555 wei funded, accepted, matured and allocated to B.
- B withdrawal: 755 wei; observed balance delta +755.
- A withdrawal: 2,577 wei; observed balance delta +2,577.
- Duplicate B withdrawal: finalized execution ERROR; no second credit was dispatched.
- Ledger: deposited 3,332, held 0, credits 0, dispatched 3,332; contract balance moved from 3,332 to 0 wei.

Parent withdrawal transactions each finalized with successful execution and exposed one child ID. Both child records were `FINALIZED` with `NO_MAJORITY` and no execution-result field. The observed recipient balance deltas are preserved, but child execution cannot be independently classified as successful. The contract correctly leaves external settlement as `PENDING_UNTIL_INDEPENDENTLY_VERIFIED` and does not authorize replay.

Exact transaction hashes, parent/child IDs, balance readbacks and canonical state are in [funded lifecycle evidence](../evidence/single-contract/2026-10-16-funded-studionet-lifecycle.json).

## Custody decision

The supported payable route accounts value before validation and returns typed outcomes for invalid offer, sender, deadline, amount and duplicate cases. This does not solve unsolicited no-calldata value, nonpayable value retention or a child transfer with no execution result. The historical GenLayer probes remain protocol-level evidence. Public custody is not enabled, and no user funds are accepted.

## Release gates still open

1. Independent security review.
2. Second approved PR review.
3. Fresh green CI for the final evidence commit.
4. Complete hosted/browser matrix, including mobile wallet-extension, network/account switching, pending/unknown finality and refresh recovery.
5. Owner authorization before any production promotion or merge.

No merge or production promotion is claimed from this branch.

