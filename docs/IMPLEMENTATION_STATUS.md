# Revigate V1 implementation status

**Verdict: NOT COMPLETE.** This worktree contains the Vault accounting
correction, a read-only transfer observer that does not infer recipient credit
from child finality, and fake-wallet integration tests. The updated Vault source
was deployed to an isolated test-only address with custody disabled and zero
initial ledger; it is not paired to the existing Registry or bound to the app.
The existing reciprocal Studionet pair remains custody-disabled; production
remains unbound and locked.

Recorded 2026-10-14. Repository: https://github.com/Bibidee/revigate. Branch:
`codex/revigate-remediation-2026-10-14`. The verified pushed base commit is
`d89b937f78e87d32ab94f5b803a9ec3665874622`; the changes described here are
local and not yet pushed. Draft PR #1 remains open:
https://github.com/Bibidee/revigate/pull/1. Do not merge.

## Completed and verified

- The repository-local GenLayer CLI is `0.39.1`; GenLayerJS is `1.1.8`; the
  configured network is Studionet chain `61999`.
- The custody-disabled pair was deployed and attested before the present local
  Vault source change. Registry `0x5C09ffa32C1CDab36F3E1340CF94ac254eaED9bE`
  has source SHA256
  `6016F73052E44BED4CD167249AB3C5AFE70CBF457D9CCF28AC4DFF14DDE86C7F`.
  Vault `0xf390D8D77f21710679a72Fc11b84A5e85a318849` has deployed source SHA256
  `0EF791B517CAA3898A1AC578AF3656B9584FBEDF6075514A3162315E3C20263F`.
  Both remain paired, custody-disabled, and previously read with zero balances.
- The prior isolated one-wei funding/withdrawal probe finalized. Its parent and
  child hashes, exact amount, and recipient balance delta are in
  [Studionet Evidence](STUDIONET_EVIDENCE.md). The old reported shortfall was a
  false positive: `held=0`, `claimable=0`, the emitted child finalized, and the
  recipient balance rose by exactly 1 wei. The old transfer record still says
  `UNKNOWN_DELIVERY`; that is not evidence of delivery or failure to the
  contract.
- The current local Vault computes required backing from `held + claimable`,
  leaves emitted transfers in pending/unreconciled totals, and preserves the
  historical transfer records. It does not mark transfers delivered or failed.
- The corrected Vault source was deployed as a separate, custody-disabled
  disposable contract at `0xcd13bfa0f323a806020790949D7454F26544daE7` in
  transaction `0x314423da5145348606dd0519c5832b7f1e41affef457aabb87eebca261c35071`.
  Source SHA256 `C7DF6C4F18D276CFB0D52BA863CA960FC0982163BEAE4E2FCCF91F24866A6F55`
  matches the local file. `get_config` confirms Studionet 61999 and
  `custody_enabled=false`; `get_ledger` returned zero for every field. This is
  source and zero-state proof, not a live nonzero formula test.
- The frontend verifies parent-listed child identity, sender, recipient,
  amount, finality and an explicit execution result. It does not convert child
  finality into recipient credit and never changes contract storage.
- The fake EIP-1193 suite covers stale account/network responses, wallet
  rejection, account/network changes, finality classes, pre-hash rejection,
  hash persistence and chain/contract-scoped recovery storage. These are
  offline integration tests, not real wallet-extension browser tests.
- The current full preflight passes the network guard, typecheck, lint, 32 JavaScript
  tests, 8 Python tests, 93 Direct Mode tests, and the production build with all
  10 routes prerendered. These tests include outgoing transfer
  child-success-only classification, failed-but-unproven, delay, unknown and
  mismatched data,
  duplicate children, accounting correction, and duplicate claim protection.

## Not completed / release blockers

- **Current source is not deployed to the reciprocal candidate pair.** The
  corrected Vault has a separate custody-disabled test deployment with exact
  source match and zero initial ledger; it was not paired or app-bound.
  Read-only Studionet calls succeeded from the approved host path. The restricted
  process itself returned DNS “Access is denied”; host DNS resolved `172.67.210.182` and `104.21.53.84`, and HTTPS
  GET to `/api` returned 405. This is a local sandbox restriction, not a
  Studionet outage. The deployed Registry hash remains
  `6016F73052E44BED4CD167249AB3C5AFE70CBF457D9CCF28AC4DFF14DDE86C7F`; the
  deployed Vault hash remains
  `0EF791B517CAA3898A1AC578AF3656B9584FBEDF6075514A3162315E3C20263F`, which
  does not match the local accounting correction.
- **Live transfer evidence is incomplete.** The pinned SDK returned the
  historical parent and exact child hash, FINALIZED status, sender, recipient
  and 1-wei value. It omitted the execution result; the RPC full-receipt method
  returned `Method not found`. The observer therefore reports UNKNOWN. The
  separately recorded +1 wei historical balance delta remains separate
  evidence and is not treated as a reusable receipt guarantee.
- **Incoming custody remains unsafe.** Prior disposable Studionet probes
  preserved value without ledger state after payable execution failure,
  no-calldata value, and value attached to a nonpayable method. No recovery was
  demonstrated. Keep funding and withdrawals disabled.
- **No on-chain delivery recovery.** The contract has no authenticated way to
  prove recipient delivery or proven non-delivery. The GenLayerJS observer is
  frontend-only. A finalized child error is not proof that the recipient got
  zero; never auto-retry an unknown transfer.
- **No signed rulebook lifecycle.** No genuine GitHub-verified Revigate
  rulebook commit exists yet. The active local test publisher account is
  `polyglot-deployer`, address
  `0x527dA5f7022f14f7105E5f06cEc1a8EFf53556b5`; no local GPG signing tool/key
  or SSH signing key is configured. Search of this repository found no
  verified commit. Do not mark any fixture as signed or verified. No program registration/verification,
  signed baseline, actual Registry child, acknowledgment, semantic revision,
  or two-wallet economic lifecycle was performed.
- **Release matrix/audit remain open.** Current row counts are 27 PASS,
  20 PARTIAL, 2 FAIL, 2 BLOCKED, and 1 NOT EXECUTED. The wallet checks use a
  fake EIP-1193 provider; no browser wallet extension was exercised. The
  independent production audit and hosted validator outcomes remain open.
  There is no independent production audit.
- **Candidate implementation commit is pushed and verified.** Commit
  `8aa8f9674383c1df6d3c2a582e3b9883cdfd6b14` passed GitHub Actions run 11,
  including clean dependency install, full preflight, and the production
  dependency audit. GitHub's Vercel check is green for the same commit, but the
  Vercel details API returned 403, so its preview URL/state was not inspected.
  No local commit-signing key/configuration is present, and
  branch protection remains unavailable to the connected GitHub API.
- Vercel production at https://the-revigate.vercel.app is still on its prior
  locked, unbound deployment. No production contract addresses are configured.

## Release posture

Do not accept user GEN, enable custody, replace the main pair's Vault, or bind
the candidate pair to production until the updated source is compiled and
verified on Studionet, incoming failure recovery is addressed, delivery
evidence is proven, the signed-source Registry and two-wallet lifecycle pass,
and the independent audit and release checks are complete.
