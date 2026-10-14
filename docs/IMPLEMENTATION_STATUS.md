# Revigate V1 implementation status

**Verdict: NOT COMPLETE.** The current Registry/Vault source is deployed and
attested on Studionet 61999, and the tested message path works on a disposable
probe pair. One ordinary invalid payable was credited safely; one one-wei EOA
withdrawal finalized and increased the recipient balance. The transfer record
still says `UNKNOWN_DELIVERY`, and other live routes can strand incoming value.
Keep custody disabled and the production frontend unbound and locked.

Recorded 2026-10-14. Repository: https://github.com/Bibidee/revigate. Branch:
`codex/revigate-remediation-2026-10-14`. The deployed contract-source commit is
`ba3ad9a83178bede7b27864d7d5c5cdded872694` (unsigned); follow-up evidence and
documentation are being published on the same branch. PR #1 is open and draft:
https://github.com/Bibidee/revigate/pull/1. GitHub Actions run 9 passed for that
commit; current Vercel preview is READY. No merge was made.

## Completed and verified

- Repository-local GenLayer CLI `0.39.1` and GenLayerJS `1.1.8` were used only
  on GenLayer Studionet, chain `61999`, RPC `https://studio.genlayer.com/api`.
- Fresh source-exact candidate Registry
  `0x5C09ffa32C1CDab36F3E1340CF94ac254eaED9bE` finalized in
  `0x857f02cc8a12c79a2a5cd23cb92e987151f0f80ce5cbf1d8868e961ec2d34c22`,
  source SHA256 `6016F73052E44BED4CD167249AB3C5AFE70CBF457D9CCF28AC4DFF14DDE86C7F`.
- Fresh source-exact candidate Vault
  `0xf390D8D77f21710679a72Fc11b84A5e85a318849` finalized in
  `0x9e68dc1b03b76388701f36d333aac730ce29de85097568d36f0f337416c3db20`,
  source SHA256 `0EF791B517CAA3898A1AC578AF3656B9584FBEDF6075514A3162315E3C20263F`.
  The one-time bind finalized in `0x55ff1283efcba6c28c1ddb71a2ff2567fd9df75839c458fff3b9de172e34ef4d`.
  Deployed bytes match local files, configs are reciprocal, custody is disabled,
  address-typed reads succeed, and the Vault ledger is zero.
- A fresh message-proof pair used a disposable Registry emitter with the current
  source-exact Vault. An authorized snapshot child finalized and wrote once; a
  duplicate finalized with `false` and no state change; stale nonce and spoofed
  contract children finalized with execution errors and no state change. An
  unrelated unlocked A0 wallet's rebind attempt finalized with execution error
  and the config stayed unchanged. Exact hashes are in
  [Studionet Evidence](STUDIONET_EVIDENCE.md).
- The exact current Vault source was deployed to a separate unpaired probe Vault
  with custody enabled only for a one-wei test. An unknown-offer `fund_offer`
  finalized with execution success and balanced the one-wei caller credit.
  One withdrawal parent and child finalized, and an independent signer balance
  read rose by exactly 1 wei. The probe contract still reports
  `UNKNOWN_DELIVERY`, with one pending liability and a one-wei shortfall; no
  retry was made. This is not an escrow lifecycle or release candidate.
- `npm run preflight` passed: Studionet-only network guard, typecheck, lint,
  13 JavaScript tests, 8 Python tests, 92 Direct Mode tests, and production build
  with all 10 routes prerendered. Full `npm audit` reports zero vulnerabilities
  with the pinned UUID `11.1.1` override; GenLayer CLI `0.39.1` and Dockerode
  `4.0.12` remain unchanged.
- GitHub Actions run 9 is green for the current pushed commit. Draft PR #1 is
  open against `main`; the commit is unsigned because no signing key or local
  signing configuration is available.
- Vercel production deployment `dpl_CPP5aU6zJyiJuwRmfLXzWx8wYriZ` is READY at
  https://the-revigate.vercel.app and was browser-checked at `/publish/`. The
  page says no Registry/Vault pair is configured and all contract actions are
  locked. It is still on source commit `f73bcb5d5b999224f5343ffb371c29150e57bb92`.
  Current pushed commit `ba3ad9a...` has a READY preview
  `dpl_9PkMxvVokGXKEJDeSB6YCDqoBwBo` at
  https://the-revigate-d3zxsfyck-bibidees-projects.vercel.app. No contract
  address is bound to either frontend.

## Critical release blockers

- **Custody safety fails.** Disposable Studionet probes showed value remains
  without accounting after a payable execution error, a no-calldata send, and
  value attached to a nonpayable call. The current source fixes only ordinary
  validation returns on the supported payable method. The one successful EOA
  transfer remains `UNKNOWN_DELIVERY`; failed outgoing recovery and objective
  contract-side receipt reconciliation are unresolved.
- **No signed-source lifecycle.** The unsigned source commit cannot pass the
  live program-verification requirement. No genuine program verification,
  wallet A/B/C lifecycle, funding, acceptance, revision, refund, early exit,
  maturity payout, or two-party balance proof ran. Real GenLayer materiality
  outcomes were not certified.
- **Message proof is limited.** A separate test Registry paired with the exact
  current Vault source proved the message boundary and replay checks. The exact
  Registry itself has not sent a notification from a verified signed program.
- **Release matrix and audit remain open.** T01–T52 is incomplete (27 PASS,
  15 PARTIAL, 2 FAIL, 2 BLOCKED, 6 NOT EXECUTED). No fresh independent hostile
  production audit or complete browser wallet/transaction suite exists.
- **GitHub protections remain unavailable.** The branch-protection API returned
  403 for the connected GitHub integration, and the repository rulesets list is
  empty. A user with repository admin access must configure required checks and
  signed-commit policy.

## Release posture

Do not accept GEN into any Revigate candidate, enable production writes, or
bind the deployed addresses to Vercel. The source-exact pair proves deployment,
byte integrity, reciprocal pairing and address ABI behavior. Probe evidence
proves limited message behavior and one ordinary payable/EOA transfer path. It
does not clear custody risk or certify the product's economic lifecycle.

See [Two-Contract Migration](TWO_CONTRACT_MIGRATION.md),
[Studionet Evidence](STUDIONET_EVIDENCE.md), [Test Matrix](TEST_MATRIX.md),
[Risk Register](RISK_REGISTER.md), and [Release Checklist](RELEASE_CHECKLIST.md).
