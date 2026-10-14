# Revigate V1 implementation status

**Verdict: NOT COMPLETE.** A full two-contract candidate is implemented and freshly deployed to Studionet with custody disabled. The source-exact Registry and Vault bytecode match local source exactly and their on-chain configurations are reciprocal. A separate disposable proof pair established authenticated child execution, duplicate no-op behavior, stale nonce and spoof rejection. Custody safety and the real wallet lifecycle remain unproven.

Recorded 2026-10-14. Repository: https://github.com/Bibidee/revigate. Branch: codex/revigate-remediation-2026-10-14. Current local HEAD at contract deployment was 0c4de92062c2866612d8269078bc9ddd66fe0bd6; address-typing and frontend calldata changes were uncommitted. This turn's verified changes are being prepared for the existing draft PR #1. Application code was previously deployed from commit 3ecf429a9dff768b9133dfce9a2243dfcafd6dbd. Remediation commits are unsigned because no local signing key/configuration was available.

## Completed and verified

- Revigate branding and the Registry/Vault architecture are in place. The production site is https://the-revigate.vercel.app.
- Repository-local GenLayer CLI 0.39.1 was used on Studionet chain 61999 at https://studio.genlayer.com/api.
- The source-exact Registry `0x4C55E4e0ab00C8534B6d4A826620cdb506349B45` finalized in transaction `0x73a64f695854b54eea242bb88921e768994bce875ce9adaf285c8ec2d14dc3ac`; SHA256 `6016F73052E44BED4CD167249AB3C5AFE70CBF457D9CCF28AC4DFF14DDE86C7F`.
- The source-exact Vault `0xdCa7E9DF49e2773FaEFAD6B27B612BC296C74751` finalized in transaction `0xd573670ccc439863757fb9346e836c88809857608fe31260988cd8f1566e8545`; SHA256 `53982AE6B5E0351F0987249947732EC1A186616DCDCF52ED6FA045997F7BF629`. Both deploys attached zero value.
- Pairing transaction `0xf14c1fce80975470197d2d9287667644412cb95facf641158a34d9d1be6e2894`; on-chain config confirms reciprocal addresses, chain 61999, and custody disabled. Read-only source attestation matched both deployed files byte-for-byte.
- A separate probe Registry paired to the exact-source Vault proved a finalized authenticated snapshot child, duplicate child no-op, stale nonce rejection, spoof rejection, and unauthorized-wallet bind rejection. Full transaction evidence is in `docs/STUDIONET_EVIDENCE.md`.
- Full `npm run preflight` passed: Studionet-only network guard, typecheck, lint, 13 JavaScript tests, 8 Python tests, 90 Direct Mode tests, and production build prerendering all 10 app routes. Production-only npm audit previously reported zero vulnerabilities.
- GitHub Actions CI run 6 passed for application commit 3ecf429a9dff768b9133dfce9a2243dfcafd6dbd. The draft PR is [#1](https://github.com/Bibidee/revigate/pull/1).
- A Ready Preview of that application commit is dpl_GwXvBnYf9HfCbPUz5DzrHGfBcxWa. Authenticated Vercel CLI checks confirm its publish page has the contract-action lock and neither pair address.
- Vercel Production deployment dpl_J4rL77NTRTwc2S4YkiVTKRvizkgv now serves https://the-revigate.vercel.app from PR head 3ecf429a9dff768b9133dfce9a2243dfcafd6dbd. Its protected publish page has the lock and neither pair address; the last-hour error-log scan returned zero entries. This is an unbound noncustodial shell, not a custody-enabled release.

## Critical release blockers

- **Custody failure on Studionet.** Disposable one-wei probes previously showed value retained without ledger liability after a payable execution error, a no-calldata transfer, and value attached to a nonpayable call. One successful earlier EOA withdrawal increased the recipient balance by one wei, but the contract still classified delivery as UNKNOWN_DELIVERY. Failed-transfer recovery and objective receipt handling remain unresolved. Do not accept GEN into the current or previous candidates.
- **Cross-contract message proof.** A disposable Registry test harness paired with the source-exact Vault successfully emitted a finalized child, and duplicate, stale-nonce, spoof, and unauthorized-rebind cases were exercised. The exact-source Registry itself has not emitted the tested notification, and full Registry event coverage remains open.
- **Two-wallet lifecycle.** No signed-source live program verification or Wallet A/B/C run has completed. There has been no funding, acceptance, acknowledgment, revision, refund, material exit, maturity payout, or recipient balance proof on this pair.
- **Signed source.** The implementation is pushed and has a draft PR; CI passed for the current head. The commits are unsigned. The branch-protection API still returns 403 for the GitHub connection and the ruleset list is empty; a fresh independent hostile audit also remains outstanding.
- **Full release matrix and browser acceptance.** T01–T52 remains incomplete. Production routes were previously read-only checked on desktop/mobile, and the protected preview publish page was checked through authenticated CLI. A local browser check of this pair was limited by a connection timeout. No wallet lifecycle browser suite has run.
- **Dependency audit.** A root npm override pins the CLI's transitive UUID dependency to patched 11.1.1 while leaving GenLayer CLI 0.39.1 and Dockerode 4.0.12 unchanged. Clean `npm ci`, `npm ls`, and full `npm audit` succeeded with zero vulnerabilities. Dockerode continues to resolve its UUID v4 call through the patched version.

## Deployment and safety decision

Use only the Registry/Vault addresses above for further read-only test evidence. They are custody-disabled test contracts and must not receive GEN. Do not configure them in production. Keep the public site's contract address unset and writes locked.

The exact-source pair establishes deployment, bytecode integrity, and reciprocal address configuration. The probe pair establishes a limited hosted message path. Neither establishes custody safety, live source verification, materiality consensus, or economic lifecycle correctness.

See [Two-Contract Migration](TWO_CONTRACT_MIGRATION.md), [Studionet Evidence](STUDIONET_EVIDENCE.md), [Test Matrix](TEST_MATRIX.md), [Risk Register](RISK_REGISTER.md), and [Release Checklist](RELEASE_CHECKLIST.md).
