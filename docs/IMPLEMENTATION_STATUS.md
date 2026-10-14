# Revigate V1 implementation status

**Verdict: NOT COMPLETE.** A full two-contract candidate is implemented and freshly deployed to Studionet with custody disabled. The deployed Registry and Vault bytecode match local source exactly and their on-chain configurations are reciprocal. Custody safety, live Registry-to-Vault message execution, and the real wallet lifecycle are still unproven.

Recorded 2026-10-14. Repository: https://github.com/Bibidee/revigate. Branch: codex/revigate-remediation-2026-10-14. Base commit: 5fb3a6d58e2d9c8247570ba7d885592100aa436c. Worktree remains uncommitted at this report.

## Completed and verified

- Revigate branding and the Registry/Vault architecture are in place. The production site is https://the-revigate.vercel.app.
- Repository-local GenLayer CLI 0.39.1 was used on Studionet chain 61999 at https://studio.genlayer.com/api.
- The fresh Registry at 0x4EECe12604bC7444e571999D9F92b951Fcc0F740 finalized in deployment transaction 0xa70dae8864a58749081a3379be2cf031736d6d8580ac44756e71f679ad893558.
- The fresh Vault at 0xB2ce7E67d2A7766Bb62993aDd37636f0163fAAc5 finalized in deployment transaction 0xf8fe9162f92506d643b25166183f52ae0a63b821c918d20485fa60d7b0f3792c. Both deploys attached zero value.
- Read-only bytecode attestation confirms exact source matches: Registry SHA256 5602F7DEDA868864900D0336E3D25509DDCA6564998E0181C997A2842A4255FA; Vault SHA256 A6090229AF3F3140A83576C44FC2F13954411F89C617D9FE2283FF827D148EFD.
- On-chain reads confirm Registry.vault equals the Vault address and Vault.registry equals the Registry address. Both report chain ID 61999 and custody_enabled=false. Both ledgers have zero balance, liabilities, surplus, and shortfall.
- An unrelated wallet's attempt to replace the Registry's Vault address finalized with execution ERROR and did not change the live pairing. Transaction: 0xa97042009c493ab8d2a84018a7d2c8fb1c755865b4ff833cb956dd043f6eb5ef.
- Full npm run preflight passed: Studionet-only network guard, typecheck, lint, 9 JavaScript tests, 8 Python tests, 90 Direct Mode tests, and production build prerendering all 10 app routes. Production-only npm audit reports zero vulnerabilities.
- Production Vercel remains safely unbound: contract address unset, contract writes locked, and page copy explains that release certification is pending. No production deployment was made from this uncommitted worktree.

## Critical release blockers

- **Custody failure on Studionet.** Disposable one-wei probes previously showed value retained without ledger liability after a payable execution error, a no-calldata transfer, and value attached to a nonpayable call. One successful earlier EOA withdrawal increased the recipient balance by one wei, but the contract still classified delivery as UNKNOWN_DELIVERY. Failed-transfer recovery and objective receipt handling remain unresolved. Do not accept GEN into the current or previous candidates.
- **Cross-contract message proof.** The final pair is bound and reciprocal configuration is confirmed, but there is no recorded successful child-message receipt proving that an authenticated Registry notification reached the Vault and changed canonical state exactly once. The bind transaction hash was not captured. An attempted helper probe ended in execution ERROR; Direct Mode is not hosted proof.
- **Two-wallet lifecycle.** No signed-source live program verification or Wallet A/B/C run has completed. There has been no funding, acceptance, acknowledgment, revision, refund, material exit, maturity payout, or recipient balance proof on this pair.
- **Signed source and publication.** The current changes are not yet committed or pushed. No PR or final-commit CI run exists. Signing configuration was not available in local Git settings; do not describe any future unsigned commit as signed.
- **Repository protection and independent audit.** Branch protection and a fresh independent hostile audit remain outstanding. Previous GitHub admin requests returned 403; the local GitHub CLI credential was invalid.
- **Full release matrix and browser acceptance.** T01–T52 remains incomplete. Vercel production routes were previously read-only checked on desktop/mobile, and actions were visibly locked. A local browser check of this newly configured pair was limited by a connection timeout. No wallet lifecycle browser suite has run.
- **Development advisories.** Production audit is clear. The pinned development GenLayer CLI chain has two moderate UUID advisories through Dockerode 4; no incompatible override was introduced.

## Deployment and safety decision

Use only the Registry/Vault addresses above for further read-only test evidence. They are custody-disabled test contracts and must not receive GEN. Do not configure them in production. Keep the public site's contract address unset and writes locked.

The live pair establishes deployment, bytecode integrity, reciprocal address configuration, and one unauthorized Registry-bind rejection. It does not establish custody safety, child-message delivery, live source verification, materiality consensus, or economic lifecycle correctness.

See [Two-Contract Migration](TWO_CONTRACT_MIGRATION.md), [Studionet Evidence](STUDIONET_EVIDENCE.md), [Test Matrix](TEST_MATRIX.md), [Risk Register](RISK_REGISTER.md), and [Release Checklist](RELEASE_CHECKLIST.md).
