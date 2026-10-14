# Implementation inventory

Recorded 2026-10-14 for Registry source correction commit `46b749669c532bf85b3491d2ea6dd4bcee987422` on `codex/revigate-remediation-2026-10-14`.

## Active product

Revigate is a single noncustodial GenLayer Registry. The active contract is `contracts/revigate_registry.py`. It authenticates signed GitHub rulebook commits, records participant acknowledgments, assesses publisher submitted revisions, and tracks material epochs and bounded history. Escrow, deposits, user credits, refunds, payouts, withdrawals, and Vault messaging are absent from active contracts and frontend code.

The frontend reads canonical programs, reviews, material event pages, and acknowledgment pages. It fetches the exact rulebook commit recorded by the Registry and checks the normalized SHA-256 digest. Each application write sends zero native value, persists its transaction hash, refuses duplicate pending actions, waits for finality, and checks canonical state before reporting success.

## Registry controls

- The supported network is fixed to GenLayer Studionet chain `61999`.
- Source authentication checks repository, branch, path, full commit SHA, ancestry, Git tree and blob identity, GitHub signature metadata, publisher nomination, UTF-8 normalization, clause structure, and source digest.
- A GitHub signature must report `verified=true`, `reason=valid`, and nonempty signature, payload, and verification timestamp fields.
- Revision requests allow one pending review, a five minute cooldown, at most three attempts, and a one day decision deadline.
- `MATERIAL`, `NONMATERIAL`, and `INCONCLUSIVE` remain separate outcomes. Only a successful decision consumes a candidate; only `MATERIAL` advances the epoch.
- Program, review, material-event, and acknowledgment reads are bounded to 50 records.
- Source correction `46b7496` persists authenticated baseline and candidate snapshots. It avoids repeating verified baseline reads and reuses a candidate only when its complete source identity, signature metadata, tree/blob proofs, digest, and ancestry binding match.
- Provider failures are classified and include sanitized, bounded diagnostics. Retry timing respects GitHub `Retry-After` and reset headers with capped exponential backoff. This source correction has passed local Direct Mode checks but has not been deployed or verified on Studionet.

## Automated evidence

For source commit `46b749669c532bf85b3491d2ea6dd4bcee987422`, local preflight passed: 10 JavaScript tests, 34 Direct Mode tests, TypeScript checking, lint, the Studionet source guard, and the production build. Direct Mode uses mocked providers and does not establish hosted validator behavior. A production dependency audit could not reach `registry.npmjs.org` because host DNS returned `ENOTFOUND`.

GitHub Actions run 18 (`38615258759`) passed for commit `ab4d2c29e2f1592eac80947d5170a08020b98f72`, including dependency installation, frozen Python dependencies, preflight, production build, and production dependency audit. This run includes source correction `46b7496`. Run 17 passed on parent evidence commit `f2987c9`; run 16 is older still.

## Hosted boundary

Registry source `4971823c43d1b552215475573e81e1da89a979c7` is deployed on Studionet at `0xBB15E0F4Ad5e61AE1374ed1EA3E32f2172EA6D3F`. That deployment successfully verified the signed baseline and completed one `NONMATERIAL` transition. Signed `MATERIAL` and ambiguous assessments returned `INCONCLUSIVE` when GitHub commit lookups returned HTTP 403. These results do not reveal why GitHub denied the hosted requests.

The new two-URL diagnostic probe is prepared at `evidence/github-access-diagnostic/github_api_probe.py`, but has not been deployed or run. The repository-local CLI rejected the password provided for the keystore; the prompt was stopped before its final attempt. No diagnostic transaction or deployment was created. No password is recorded here.

The current source correction differs from deployed commit `4971823`; the prior deployment address and attestation do not attest the correction. No new Registry deployment or current-source hosted lifecycle has occurred.

## Browser, preview, and review

The Vercel preview is protected. The connected Vercel identity returned HTTP 403 for the `bibidees-projects` scope and preview access. Real browser and wallet-extension tests remain unverified. Preview protection was not disabled.

This repository's checked CI workflow does not require an independent security review. No independent review has been obtained; the work performed is an adversarial self-audit. Independent review remains recommended assurance, not a formal CI requirement.

## Release decision

**NOT RELEASED.** Production writes remain locked. No user funds were accepted, and no merge or production promotion occurred. The current source needs a Studionet deployment and exact source attestation, followed by hosted source-authentication diagnosis and semantic `MATERIAL` and ambiguous assessments with canonical readbacks. Fresh Actions for the corrected source and real browser/wallet checks are also outstanding. The cause of hosted HTTP 403 remains unknown.
