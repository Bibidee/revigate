# Revigate V1 implementation status

**Verdict: NOT COMPLETE.** This branch now contains a local fix for the Vault
shortfall calculation and a read-only frontend observer for finalized outgoing
child transactions. The fix and observer have passed targeted local tests but
have not been deployed or verified against Studionet. Custody stays disabled;
production stays unbound and locked.

Recorded 2026-10-14. Repository: https://github.com/Bibidee/revigate. Branch:
`codex/revigate-remediation-2026-10-14`. The last verified pushed base commit is
`9376fbd2b25c2346d53761128a61b4dc85ed089b`; this remediation is the next
revision on that branch. Draft PR #1 remains open:
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
- The frontend reads the parent and triggered child transactions using the
  pinned GenLayerJS SDK and reports a separate observer status. Missing/delayed
  children remain unknown; child errors do not authorize retries; duplicate
  successful children are surfaced. The observer never changes contract
  storage.
- `npm run preflight` passes the network guard, typecheck, lint, 19 JavaScript
  tests, 8 Python tests, 93 Direct Mode tests, and the production build with all
  10 routes prerendered. These tests include outgoing transfer
  success classification, failed-but-unproven, delay, missing/mismatched data,
  duplicate children, accounting correction, and duplicate claim protection.

## Not completed / release blockers

- **Current source is not deployed.** The prior Vault deployment does not
  include the local ledger correction. The new observer has not queried a live
  Studionet RPC in this session; the RPC lookup failed with DNS
  `ENOTFOUND studio.genlayer.com`. Do not claim live runtime compatibility.
- **Incoming custody remains unsafe.** Prior disposable Studionet probes
  preserved value without ledger state after payable execution failure,
  no-calldata value, and value attached to a nonpayable method. No recovery was
  demonstrated. Keep funding and withdrawals disabled.
- **No on-chain delivery recovery.** The contract has no authenticated way to
  prove recipient delivery or proven non-delivery. The GenLayerJS observer is
  frontend-only. A finalized child error is not proof that the recipient got
  zero; never auto-retry an unknown transfer.
- **No signed rulebook lifecycle.** The public Revigate default branch has no
  `.revigate/publisher.json` or `rules/program.md`; synthetic local fixtures do
  not meet the publisher-nomination gate. No signed rulebook commit was found
  in the checked public repositories. No program registration/verification,
  signed baseline, actual Registry child, acknowledgment, semantic revision,
  or two-wallet economic lifecycle was performed.
- **Release matrix/audit remain open.** The prior row counts are 27 PASS,
  15 PARTIAL, 2 FAIL, 2 BLOCKED, and 6 NOT EXECUTED. The targeted checks do not
  close hosted validator, browser wallet, two-wallet, or failed-custody cases.
  There is no independent production audit.
- **Publishing checks remain open at this record.** Full local preflight passes;
  GitHub Actions for the candidate revision are pending. The prior pushed
  revision's CI is the last verified run. No local commit-signing
  key/configuration is present, and branch protection remains unavailable to
  the connected GitHub API.
- Vercel production at https://the-revigate.vercel.app is still on its prior
  locked, unbound deployment. No production contract addresses are configured.

## Release posture

Do not accept user GEN, enable custody, deploy the changed Vault, or bind the
candidate pair to production until the updated source is compiled and
verified on Studionet, incoming failure recovery is addressed, delivery
evidence is proven, the signed-source Registry and two-wallet lifecycle pass,
and the independent audit and release checks are complete.
