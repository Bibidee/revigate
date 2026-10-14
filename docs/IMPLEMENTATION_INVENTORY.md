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
- Provider failures are classified and include sanitized, bounded diagnostics. Retry timing respects GitHub `Retry-After` and reset headers with capped exponential backoff. This source correction passed local Direct Mode checks and is source-attested on Studionet at `0xFe59b3F7a867B4Aca632b0F40060aACfF8DC36B3`.

## Automated evidence

For source commit `46b749669c532bf85b3491d2ea6dd4bcee987422`, local preflight passed: 10 JavaScript tests, 34 Direct Mode tests, TypeScript checking, lint, the Studionet source guard, and the production build. Direct Mode uses mocked providers and does not establish hosted validator behavior. A production dependency audit could not reach `registry.npmjs.org` because host DNS returned `ENOTFOUND`.

GitHub Actions run 18 (`38615258759`) passed for commit `ab4d2c29e2f1592eac80947d5170a08020b98f72`, including dependency installation, frozen Python dependencies, preflight, production build, and production dependency audit. This run includes source correction `46b7496`. Run 17 passed on parent evidence commit `f2987c9`; run 16 is older still.

## Hosted boundary

Registry source `4971823c43d1b552215475573e81e1da89a979c7` is deployed on Studionet at `0xBB15E0F4Ad5e61AE1374ed1EA3E32f2172EA6D3F`. That deployment successfully verified the signed baseline and completed one `NONMATERIAL` transition. Signed `MATERIAL` and ambiguous assessments returned `INCONCLUSIVE` when GitHub commit lookups returned HTTP 403. These results do not reveal why GitHub denied the hosted requests.

The two-URL diagnostic probe at `evidence/github-access-diagnostic/github_api_probe.py` was deployed through the repository-local CLI at `0x1d89559F621AEb81b53E7004Fe54BfBe1D5c9a02`. Transaction `0x45aa328c86e642173a3a331e0c25d0030100fa1808c3d80c1530a4ff8418f8ae` finalized `MAJORITY_AGREE`, and deployed-source readback exactly matched local SHA-256 `82328DAF235D06A2C790AE093D916E4E69EF3EA6F37F03378981ECDD91396F1D`.

Probe transaction `0x2add2cd295c1cbcfc2753631582947d4ef59b266eef77bb377cc7d74469c0228` finalized `MAJORITY_DISAGREE`. Its leader and successful validator executions received HTTP 200 from both fixed GitHub endpoints, with 42 of 60 core requests remaining. The earlier 403 did not recur, but its historical cause remains unknown. The probe disagreed because it truncated the successful commit response before JSON parsing and consequently compared an empty `sha` against the expected SHA. No keystore password is recorded here.

The corrected source is deployed at `0xFe59b3F7a867B4Aca632b0F40060aACfF8DC36B3`, transaction `0xe51db5761f1808bdb93b3a98a4d895e31339a48a85882b8c081a4e455dc6fbf2`. Exact source readback matched SHA-256 `EA457FEAB7B270970586FFFCBB12D8B9E58FA5F057A3C49241AA4CBFB6992D56`. Its fresh signed lifecycle verified the baseline, classified the 14-to-60-day change as `MATERIAL`, and classified the ambiguous eligibility change as `MATERIAL`. Final canonical state is epoch 3, two material events, and no pending review.

## Browser, preview, and review

The Vercel preview is protected. The connected Vercel identity returned HTTP 403 for the `bibidees-projects` scope and preview access. Real browser and wallet-extension tests remain unverified. Preview protection was not disabled.

This repository's checked CI workflow does not require an independent security review. No independent review has been obtained; the work performed is an adversarial self-audit. Independent review remains recommended assurance, not a formal CI requirement.

## Release decision

**NOT RELEASED.** Production writes remain locked. No user funds were accepted, and no merge or production promotion occurred. Current-source deployment, attestation, and required semantic assessments are complete. Fresh Actions for this evidence commit, real browser/wallet checks, and independent security review remain outstanding. The historical 403 cause remains unknown.
