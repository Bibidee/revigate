# Revigate V1 release checklist

**Current verdict: NOT COMPLETE.** The two-contract candidate is deployed and source-attested on Studionet 61999. Its custody gates are disabled. See [Implementation Status](IMPLEMENTATION_STATUS.md), [Two-Contract Migration](TWO_CONTRACT_MIGRATION.md), and [Studionet Evidence](STUDIONET_EVIDENCE.md).

## Source, implementation, and local checks

- [x] Revigate branding and Registry/Vault implementation.
- [x] JavaScript and Python lockfiles are present.
- [x] Repository-local GenLayer CLI 0.39.1 and Studionet 61999 were verified.
- [x] Current preflight passed: network guard, typecheck, lint, 9 JavaScript tests, 8 Python tests, 90 Direct Mode tests, and production build prerendering all 10 routes.
- [x] Production dependency audit: zero vulnerabilities. Two moderate UUID advisories remain in the pinned development CLI dependency chain.
- [ ] Full contract mutation suite and fresh independent hostile audit.
- [x] Implementation and evidence commits pushed; draft PR #1 open; GitHub Actions CI run 6 passed for application commit 3ecf429a.
- [ ] Signed commit verified. The implementation commit is unsigned because local signing was not configured.

## Studionet pair and custody

- [x] Fresh Registry and Vault deployed; both deployment receipts finalized with zero value.
- [x] Deployed Registry and Vault bytes match their local source hashes.
- [x] Reciprocal Registry/Vault addresses and custody_enabled=false confirmed by live reads.
- [x] Unauthorized wallet could not replace the Registry's Vault address.
- [ ] Capture the final bind transaction and prove the authenticated child transaction finalizes.
- [ ] Prove child message exactly-once mutation, duplicate idempotency, and stale/out-of-order handling on hosted Studionet.
- [ ] Resolve or bound the live incoming-value failures: payable error, direct transfer, and value on nonpayable method.
- [ ] Prove failed outgoing transfer recovery and objective receipt handling without resend or unbacked credits.
- [ ] Run a signed-source two-wallet lifecycle and independently verify funding, payout, and refund recipient balances.
- [ ] No high or critical custody risk remains.

## Matrix and frontend

- [ ] All T01–T52 meet their evidence requirements; see [Test Matrix](TEST_MATRIX.md).
- [ ] Hosted validator disagreement, prompt-injection, and source-integrity adversarial cases completed.
- [x] Existing production route checks covered nine routes on desktop and mobile; contract actions remain locked.
- [ ] Browser wallet connect, rejection, account/network switching, pending-hash recovery, finality, and canonical readback suites completed.
- [ ] Vercel deployment tied to reviewed release source and approved contract configuration.

## GitHub and release decision

- [x] Remediation branch pushed and a draft pull request against main created.
- [ ] Main requires pull requests, signed commits, passing CI, and prevents force pushes/deletion.
- [x] Ready Vercel Preview for application commit 3ecf429a checked with authenticated CLI; publish page shows the write lock and does not contain the pair addresses.
- [x] Current remediation source deployed to https://the-revigate.vercel.app as dpl_J4rL77NTRTwc2S4YkiVTKRvizkgv; authenticated page check confirms the write lock and no pair addresses; last-hour error-log scan returned zero entries.
- [ ] Approved contract binding configured in production. Keep addresses unset until custody certification.

Keep the production contract address unset and all contract mutations locked until the custody, message, and lifecycle gates above are proven. A successful build, deployment, pairing read, or isolated one-wei withdrawal does not clear these gates.

Status definitions:
- COMPLETE requires every critical custody, source, lifecycle, and release requirement to be proven.
- COMPLETE WITH MANUAL ACTION is only for a safe, verified release with a specific noncritical external action left.
- NOT COMPLETE applies while custody, source identity, lifecycle, or another critical requirement is missing.
