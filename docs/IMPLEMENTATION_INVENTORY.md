# Implementation inventory

Recorded 2026-10-15 after the clean Wallet A lifecycle and finalized Wallet B
participant acknowledgment.

## Active product

Revigate is a single noncustodial GenLayer Registry. The active contract is
`contracts/revigate_registry.py`. It authenticates signed GitHub rulebook commits,
records participant acknowledgments, assesses publisher revisions, and tracks
material epochs and bounded history. Escrow and Vault code are absent from the
active product.

The frontend reads canonical programs and reviews, fetches the exact rulebook
commit recorded by the Registry, verifies the normalized digest, persists every
zero-value transaction hash, refuses duplicate pending actions, and checks
canonical state after finality.

## Registry controls

- Network is fixed to GenLayer Studionet chain `61999`.
- Source authentication binds repository, branch, path, full commit SHA, ancestry, tree/blob identity, GitHub signature metadata, publisher nomination, normalized source bytes, and digest.
- Revision requests enforce one pending review, a five-minute cooldown, a three-attempt cap, and a bounded deadline.
- `MATERIAL`, `NONMATERIAL`, and `INCONCLUSIVE` remain distinct; only a successful `MATERIAL` decision advances the epoch.
- Reads use bounded pagination.
- Provider failures are classified with sanitized bounded diagnostics and capped retry timing.

## Exact hosted source

Corrected source commit `46b749669c532bf85b3491d2ea6dd4bcee987422` is deployed at
`0xFe59b3F7a867B4Aca632b0F40060aACfF8DC36B3`, deployment transaction
`0xe51db5761f1808bdb93b3a98a4d895e31339a48a85882b8c081a4e455dc6fbf2`, with
exact SHA-256 attestation `EA457FEAB7B270970586FFFCBB12D8B9E58FA5F057A3C49241AA4CBFB6992D56`.
The canonical configuration is chain 61999, protocol `revigate-registry-v1`,
version 2, custody `NONE`.

## Current wallet identities

- Wallet A (publisher): `0x4A7D76b8C4668a3426d6d54eC24b41Fa87b532f5`
- Wallet B (participant): `0xFf203Bb65942F50CB81A8AF98c5F5bd9d8a79b54`

The old `0x527d…` address belongs only to archived fixture evidence and is not
part of the current lifecycle.

## Hosted lifecycle evidence

Program 3 used the signed baseline `b1c5254617155214e210a39dafd742fd33b102d6`
on branch `revigate-rulebook-wallet-a-web` and Wallet A signed every write.

- Registration `0xf14863cefa5c8c80526b55f1500cdc111c859f4fa0bfd670f93968a49433aa0b`; Program 3.
- Verification `0x6ee5b6bbb3f67d3971bbe965b7386a542872cc9ba6c1e43bbd0c6b0cfa59f048`; `VERIFIED`, epoch 1.
- NONMATERIAL `ee033cbef9450f58990b01eac77b5949453f2130`: request `0xb0747438b5d83667b6aa551093aa9ff66240de0b75587a9d1aa6d0002934c82e`, assessment `0x19f9190ef84f8e6e459796dcd7d6b641c5151396cae7945a60efa9c6c083f37c`, actual `NONMATERIAL`.
- MATERIAL `ecac64c4f95a527c9f587ab992d6e503d713bb11`: request `0xd2dee5dbfce5b605aa7003554f25ba483565ecbf95d887120bc675a37614b4a3`, assessment `0x18f4f7327ad2f68e7ac33ec6aa62eccd9013ffcf504ac941e9df5b5fdee74340`, actual `MATERIAL`.
- Ambiguous `d35d438d0e45e58e3227f95135fa3a2abc523aed`: request `0x5f19d93b54db9740ffd8f9cc12144632cba4b7553205622a1b970870c9646cd9`, review 5, assessment `0xc60c1c640fe1fc9803056e596e61bdfcdee05e60609ded5c7f38b82e163f6956`, actual `MATERIAL`, both source statuses `VERIFIED`.

Final Program 3 state is active SHA `d35d438d0e45e58e3227f95135fa3a2abc523aed`,
digest `2cc96aef276627479deb9a9ba9c66b0015a9faaafa28bc9b7805503dd444fb2b`,
epoch 3, two material events, and no pending review. Every transaction had
zero attached value and `value_credited=false`.

Wallet B (`0xFf203Bb65942F50CB81A8AF98c5F5bd9d8a79b54`) acknowledged the
finalized epoch-3 version in transaction
`0xefb3e3cec4fa655acbc88072574ee6effe5d933ccc7b4f3a20f4aec1631c1209`.
The direct Studionet read is `FINALIZED` with `MAJORITY_AGREE` and
`value_credited=false`; `get_acknowledgment_page` returns the same SHA and digest
at history index 1.

## Automated evidence

The local suite currently passes 15 JavaScript tests and 34 Direct Mode tests.
Direct Mode uses mocked providers. Typecheck, lint, source guard, and production
build evidence are recorded on the remediation branch. Fresh GitHub Actions run
38667733432 (run 45) for commit
d2362855d8e4c89c13ea3badfd41075df3b88b01 passed npm ci, frozen Python dependencies,
preflight, production build, and the production dependency audit.

## Browser and review boundary

Public route checks and the publisher page were exercised in Brave. Wallet A
signed the current publisher request and assessment. The account was switched to
Wallet B, which submitted one zero-value acknowledgment and has a finalized
canonical epoch-3 history record. The browser card retained a stale accepted
snapshot, so direct RPC finality plus the canonical readback are authoritative.
Network switching, rejection, extension-level disconnect recovery, protected preview
access, and independent security review remain open. The local build now exposes a
Disconnect control, with Rabby behavior recorded in
evidence/local-browser/2026-10-15-wallet-disconnect.json. The observer fix has a
fresh READY deployment, but the protected preview still requires an authenticated
browser rerun. The work performed is an adversarial
self-audit, not an independent review.

## Release decision

**NOT RELEASED.** Production writes remain locked. No user funds were accepted,
PR #1 remains a draft, and no merge or production promotion occurred.
