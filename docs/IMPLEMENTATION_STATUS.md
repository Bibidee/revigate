# Implementation status

Recorded 2026-10-15 after the clean Wallet A lifecycle, finalized Wallet B
participant acknowledgment, and the transaction/source-integrity hardening pass
on GenLayer Studionet.

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
authoritative evidence. The new transaction observer captures a canonical
pre-state before every write and clears a pending hash only after a newly created
record or a unique state transition attributable to that write is read back.
Historical argument matches, same-version acknowledgment replays, and
execution-unknown receipts remain `CANONICAL_STATE_UNVERIFIED`; unknown,
failed, delayed, canceled, and RPC-unavailable states remain distinct. No
automatic replay is allowed. These fixes are on this remediation branch and
are now promoted to production. Extension-level rejection and disconnect
interaction remains tooling-limited. The observer does not infer recipient
credit from finality.

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

The corrected frontend was promoted to production deployment
`dpl_4q5XjNb6jAt2Rr3jJVf4Atozsz6n` at
`https://the-revigate.vercel.app`. A real Brave/Rabby production session
connected Wallet B and showed `Disconnect`; clicking it changed the app to
`Connect wallet` and displayed `Revigate app session disconnected. Your wallet
remains connected in Rabby.` The wallet extension remained connected and no
transaction or contract write was sent. Exact evidence is
`evidence/local-browser/2026-10-15-production-disconnect.json`.

The same production page then ran the saved Wallet B acknowledgment through
the read-only observer. It classified hash
`0xefb3e3cec4fa655acbc88072574ee6effe5d933ccc7b4f3a20f4aec1631c1209` as
`FINALIZED` with execution result unavailable, verified the canonical
acknowledgment at epoch 3 with SHA `d35d438d0e45e58e3227f95135fa3a2abc523aed`
and digest `2cc96aef276627479deb9a9ba9c66b0015a9faaafa28bc9b7805503dd444fb2b`,
removed the pending card, and did not replay. This is canonical-readback
evidence; it does not infer execution success or recipient credit from
finality. Evidence is `evidence/local-browser/2026-10-15-production-observer.json`.

Local verification currently passes 23 JavaScript tests and 34 Direct Mode tests
(57 total). Direct Mode uses mocked providers and does not replace hosted
validator evidence. GitHub Actions run `38694594371`
(`https://github.com/Bibidee/revigate/actions/runs/38694594371`) passed for the
final branch head, including clean install, preflight, production build, and
production dependency audit. Production promotion evidence is preserved in
`evidence/vercel/2026-10-15-production-promotion.json`.
The promoted Vercel production deployment is READY; authenticated content
inspection and the public Brave/Rabby check confirm the noncustodial warning,
Registry lock, Studionet chain 61999, and app-session disconnect behavior. The
protected preview still redirects a normal browser to Vercel login.

## Release decision

**NOT RELEASED.** Production writes remain locked. No user funds were accepted,
PR #1 remains a draft, and the draft was not merged. The corrected
reconciliation/source-integrity frontend is promoted, but hosted prompt-injection
and disagreement evidence, independent review, and full extension-level wallet
flows remain open.
GitHub `main` branch protection is enabled with strict `verify` and `Vercel`
checks, one required approval, last-push approval, and admin enforcement.
Independent security review, extension-level flow checks, and a
GitHub-verified prompt-injection fixture remain open gates. Production
app-session disconnect is recorded in
`evidence/local-browser/2026-10-15-production-disconnect.json`; observer
evidence is in `evidence/local-browser/2026-10-15-production-observer.json`.
