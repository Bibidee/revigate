# Implementation status

Recorded 2026-10-14 for commit `4971823c43d1b552215475573e81e1da89a979c7` on `codex/revigate-remove-escrow-2026-10-14`.

## Current architecture

Revigate is a single non-custodial GenLayer Registry. Escrow, offers, deposits, credits, refunds, payouts, withdrawals, transfer observation, and Vault messaging have been removed from the active contracts and frontend. The Registry retains GitHub rulebook authentication, publisher nomination, participant acknowledgments, revision review, material epochs, and bounded history.

## Studionet test deployment

The exact Registry source committed at `4971823c43d1b552215475573e81e1da89a979c7` is deployed on GenLayer Studionet 61999 for zero-value testing. Address: `0xBB15E0F4Ad5e61AE1374ed1EA3E32f2172EA6D3F`; deployment transaction: `0xad9f68174094e34fd971d31314a097d783ed717fe4f07b9524ebd49beca9ec97`. It finalized with `MAJORITY_AGREE`, five agreeing votes, leader execution `SUCCESS`, and `value_credited=false`. Deployed code matches the local contract byte-for-byte; source SHA-256 is `169F2569CC7374B94A7CD0059D002A87480B8E62D60F18BCE42A22E0CD50F2EF`. Canonical config reports chain 61999, protocol `revigate-registry-v1`, version 2, and custody `NONE`.

This is a test deployment only. It is not bound for production, production writes remain locked, and it has no financial functionality.

## Hosted rulebook results

- Signed baseline commit `313dfb0ac2b20f32954dd0ffb08fa60214ae34da` registered as program 1 and verified at epoch 1. The publisher acknowledgment transaction finalized, and its canonical readback matched the expected wallet, epoch, SHA, and digest.
- Signed nonmaterial commit `7fa24a913b0e7e86aaec2cb42011df7bcf8a4e10` returned `NONMATERIAL`. Canonical program state advanced to that SHA and digest while epoch remained 1; pending review and material-event count were zero.
- Signed material commit `376e447065b8a7efd1d26a60c6c9ac476bd1e567` returned `INCONCLUSIVE`: both base and candidate GitHub commit lookups returned HTTP 403. Canonical program state remained on the nonmaterial SHA at epoch 1.
- Signed ambiguous commit `14401f20f2d3eeeac537746966646809e5c01b8c` returned `INCONCLUSIVE` for the same HTTP 403 source-authentication result. The first request was rejected by the contract because it occurred during the 300-second publisher cooldown. After the cooldown, request 3 and its assessment finalized. No semantic ambiguous-language verdict was produced.

These results are not a certified three-outcome semantic lifecycle: no hosted `MATERIAL` verdict, no semantic ambiguity verdict, and no validator disagreement have been observed. Exact transactions and canonical readbacks are in [Studionet evidence](STUDIONET_EVIDENCE.md).

## Verification

- Local preflight on this source: 10 JavaScript tests, 27 Direct Mode tests, typecheck, lint, Studionet source guard, and production build all pass. Direct Mode uses mocked providers.
- Fresh GitHub Actions run 16 passed for commit `4971823c43d1b552215475573e81e1da89a979c7`.
- Vercel reports a successful status check for this commit. The preview deployment URL could not be retrieved because the connected Vercel API returned HTTP 403 for the `bibidees-projects` scope.
- Studionet access works through the approved host network path; the ordinary restricted process's earlier DNS/socket errors are local environment restrictions, not evidence of Studionet outage.

## Browser and wallet status

Real browser and wallet-extension checks remain incomplete. The controlled Brave tab at `http://192.168.100.4:3000/`, a fresh Brave tab at `http://localhost:3000/`, and the in-app browser at `http://127.0.0.1:3000/` all timed out. The PowerShell localhost request was denied by the execution environment's socket permissions. The Vercel preview lookup returned HTTP 403. No live wallet connection, account/network switch, rejection, signature, or refresh-recovery flow was performed.

## Release decision and remaining blockers

NOT RELEASED. Production writes remain locked. No user funds were accepted; no merge or production promotion occurred.

- Resolve the validator's GitHub API HTTP 403 source lookups and rerun the signed material and ambiguous assessments to observe actual semantic outcomes.
- Complete real desktop/mobile browser and wallet-extension checks against an accessible preview.
- Obtain an independent security review. The existing audit is adversarial self-audit; the PR currently has no submitted reviews.

There is no independent review, no production custody, and no release certification.
