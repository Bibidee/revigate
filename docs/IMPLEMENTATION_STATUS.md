# Implementation status

Recorded 2026-10-15 after the clean Wallet A lifecycle and finalized Wallet B
participant acknowledgment on GenLayer Studionet.

## Current architecture

Revigate is a noncustodial Registry. It authenticates signed GitHub rulebook
commits, records acknowledgments, assesses revisions, and tracks material epochs.
Escrow, offers, deposits, credits, refunds, payouts, withdrawals, and Vault
messaging are absent from the active product. Every frontend write uses native
value zero.

## Authoritative wallet identities

- Wallet A (publisher and Rabby signer): `0x4A7D76b8C4668a3426d6d54eC24b41Fa87b532f5`
- Wallet B (participant): `0xFf203Bb65942F50CB81A8AF98c5F5bd9d8a79b54`
- Network: GenLayer Studionet, chain `61999`

The previously documented `0x527dA5f7022f14f7105E5f06cEc1a8EFf53556b5` was an old
fixture signer. It is not a current wallet and was not used in the current
lifecycle.

## Corrected Registry deployment

Registry source commit `46b749669c532bf85b3491d2ea6dd4bcee987422` is deployed at
`0xFe59b3F7a867B4Aca632b0F40060aACfF8DC36B3`. Deployment transaction
`0xe51db5761f1808bdb93b3a98a4d895e31339a48a85882b8c081a4e455dc6fbf2` finalized
with successful execution and zero value. Deployed source exactly matches SHA-256
`EA457FEAB7B270970586FFFCBB12D8B9E58FA5F057A3C49241AA4CBFB6992D56` and Git blob
`3e094b1b359cc7d451a209db79a2456cbc17bd`. Config reads chain 61999, protocol
`revigate-registry-v1`, version 2, custody `NONE`.

## Clean hosted lifecycle — Program 3

The signed Wallet A manifest baseline is commit
`b1c5254617155214e210a39dafd742fd33b102d6` on branch
`revigate-rulebook-wallet-a-web`.

- Registration: `0xf14863cefa5c8c80526b55f1500cdc111c859f4fa0bfd670f93968a49433aa0b`, Program 3.
- Baseline verification: `0x6ee5b6bbb3f67d3971bbe965b7386a542872cc9ba6c1e43bbd0c6b0cfa59f048`, `VERIFIED`, epoch 1.
- NONMATERIAL commit `ee033cbef9450f58990b01eac77b5949453f2130`: request `0xb0747438b5d83667b6aa551093aa9ff66240de0b75587a9d1aa6d0002934c82e`, assessment `0x19f9190ef84f8e6e459796dcd7d6b641c5151396cae7945a60efa9c6c083f37c`, actual `NONMATERIAL`, epoch stayed 1.
- MATERIAL commit `ecac64c4f95a527c9f587ab992d6e503d713bb11`: request `0xd2dee5dbfce5b605aa7003554f25ba483565ecbf95d887120bc675a37614b4a3`, assessment `0x18f4f7327ad2f68e7ac33ec6aa62eccd9013ffcf504ac941e9df5b5fdee74340`, actual `MATERIAL`, epoch 2.
- Ambiguous commit `d35d438d0e45e58e3227f95135fa3a2abc523aed`: request `0x5f19d93b54db9740ffd8f9cc12144632cba4b7553205622a1b970870c9646cd9`, review 5, assessment `0xc60c1c640fe1fc9803056e596e61bdfcdee05e60609ded5c7f38b82e163f6956`, actual **`MATERIAL`**, both sources `VERIFIED`, three validators agreed and two were idle after quorum.

Final canonical Program 3 state is `VERIFIED`, active SHA `d35d438d0e45e58e3227f95135fa3a2abc523aed`, document digest
`2cc96aef276627479deb9a9ba9c66b0015a9faaafa28bc9b7805503dd444fb2b`, epoch 3,
material-event count 2, and no pending review. All lifecycle transactions had
`value_credited=false`.

Wallet B acknowledged the finalized epoch-3 version with zero value in
transaction `0xefb3e3cec4fa655acbc88072574ee6effe5d933ccc7b4f3a20f4aec1631c1209`.
Studionet readback reports `FINALIZED`, `MAJORITY_AGREE`, sender Wallet B,
recipient Registry, and `value_credited=false`. The canonical acknowledgment is
epoch 3, SHA `d35d438d0e45e58e3227f95135fa3a2abc523aed`, digest
`2cc96aef276627479deb9a9ba9c66b0015a9faaafa28bc9b7805503dd444fb2b`, history
index 1.

## Browser and automated verification

Brave exercised `/`, `/publish/`, `/my-rules/`, `/activity/`, `/about/`,
`/program/1/`, and `/program/3/` over HTTPS. Program 3 rendered the exact
Wallet A publisher, signed ambiguous revision, epoch 3 and final digest from
the corrected Registry. Rabby connected as Wallet A and signed the current
publisher request and assessment; a refresh preserved the active account and
Registry verification. The account was then switched to Wallet B and the
participant workbench submitted one zero-value acknowledgment. Studionet direct
readback finalized transaction
`0xefb3e3cec4fa655acbc88072574ee6effe5d933ccc7b4f3a20f4aec1631c1209` with
`MAJORITY_AGREE`; canonical history contains the epoch-3 record at index 1.
The browser transaction card retained an earlier pending/accepted snapshot, so
the direct finalized receipt and canonical acknowledgment read are the
authoritative evidence. Commit `13bc812f352a6f484d8ba4d34ffb244fc65dc223`
now treats finalized receipts as canonical-readback candidates and clears a
pending hash only after the method-specific Registry readback matches. Unknown,
failed, delayed, and duplicate states remain distinct; no automatic replay is
allowed. A fresh public deployment and browser rerun are still required. Wrong-
network switching, rejection, disconnect recovery, and the protected Vercel
preview (which redirects to Vercel login) remain unverified; no credentials or
bypass link were used. The observer does not infer recipient credit from
finality and records `value_credited=false` from the canonical transaction read.

The corrected local build was also opened in Brave at `127.0.0.1:3100`. Rabby
connected as Wallet B from a non-Studionet state, the app requested and reached
Studionet chain 61999, Program 3 read back as `VERIFIED` at epoch 3, and Wallet
B history returned the canonical epoch-3 record. A zero-value acknowledgment
probe produced transaction
`0x7fd119eb65480dd7ef401dc862a751515f0613fcd4058d383b7a76d4b69d823`; the
observed Studionet state was `ACCEPTED` with five `AGREE` votes and
`value_credited=false` at capture. The browser kept the hash pending and did
not resubmit it. A later read-only `eth_getTransactionByHash` call returned
`-32001 Transaction not found`, while the known finalized Wallet B
acknowledgment remained readable. This is recorded as an RPC availability gap;
it does not prove finality, failure, cancellation, or rollback. The exact poll
is preserved in `evidence/local-observer-probe/2026-10-15-rpc-poll.json`. This
is observer evidence only; it is not a replacement for a finalized receipt.

Local verification currently passes 15 JavaScript tests and 34 Direct Mode tests
(49 total). Direct Mode uses mocked providers and does not replace hosted
validator evidence. Fresh CI run `38657450326` (run 43) for commit
`051ddbe45f304bce41c6672c83160448d837ec24` passed npm ci, frozen Python
dependencies, preflight, production build, and the production dependency audit.
Its Vercel branch deployment is READY; authenticated read-only content inspection
confirms the noncustodial warning, Registry lock, and Studionet chain 61999.
The protected preview still redirects a normal browser to Vercel login.

## Release decision

**NOT RELEASED.** Production writes remain locked. No user funds were accepted,
PR #1 remains a draft, and no merge or production promotion occurred. GitHub
`main` branch protection is enabled with strict `verify` and `Vercel` checks,
one required approval, last-push approval, and admin enforcement. Independent
security review, remaining extension-level flow checks, and protected-preview access
remain open gates. Local Brave/Rabby app-session disconnect is recorded in
`evidence/local-browser/2026-10-15-wallet-disconnect.json`.
