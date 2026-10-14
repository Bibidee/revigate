# Implementation status

Recorded 2026-10-14 for source correction commit `46b749669c532bf85b3491d2ea6dd4bcee987422` on branch `codex/revigate-remediation-2026-10-14`.

## Current architecture

Revigate is a single non-custodial GenLayer Registry. Escrow, offers, deposits, credits, refunds, payouts, withdrawals, and Vault messaging are absent from the active contracts and frontend. The Registry authenticates GitHub rulebook commits, records participant acknowledgments, assesses revisions, and tracks material epochs and bounded history.

## Current corrected-source Studionet deployment

Corrected Registry source commit `46b749669c532bf85b3491d2ea6dd4bcee987422` is deployed at `0xFe59b3F7a867B4Aca632b0F40060aACfF8DC36B3`. Deployment transaction `0xe51db5761f1808bdb93b3a98a4d895e31339a48a85882b8c081a4e455dc6fbf2` finalized `MAJORITY_AGREE` with successful execution and zero value. Deployed source readback exactly matches local SHA-256 `EA457FEAB7B270970586FFFCBB12D8B9E58FA5F057A3C49241AA4CBFB6992D56` and Git blob `3e094b1b359cc7d451a209db79a2456cbc17bd`. Canonical config is chain 61999, Registry version 2, protocol `revigate-registry-v1`, custody `NONE`.

The signed baseline verified successfully. The signed 14-to-60-day revision produced `MATERIAL` and advanced the program to epoch 2. After the required cooldown, the intentionally ambiguous revision also produced the actual hosted result `MATERIAL`; three validators agreed and two became idle after quorum. Canonical review 2 records verified base and candidate sources and rationale that the new vague eligibility language changed criteria and discretion. Final program state is `VERIFIED`, active SHA `14401f20f2d3eeeac537746966646809e5c01b8c`, digest `3a95f7e76cedba0bce0db531b97c17a0c0d842b967278d0768c2320ba1769631`, epoch 3, material-event count 2, and no pending review.

## Historical earlier deployment

Registry V2 source commit `4971823c43d1b552215475573e81e1da89a979c7` is deployed at `0xBB15E0F4Ad5e61AE1374ed1EA3E32f2172EA6D3F` on Studionet 61999. Deployment transaction `0xad9f68174094e34fd971d31314a097d783ed717fe4f07b9524ebd49beca9ec97` finalized with zero value. The deployed source SHA-256 is `169F2569CC7374B94A7CD0059D002A87480B8E62D60F18BCE42A22E0CD50F2EF`.

This deployment predates source correction `46b7496`. It does not contain the new authenticated snapshot reuse, provider-failure classification, bounded backoff, or diagnostic probe. Do not use its attestation as evidence for the current source.

## Hosted lifecycle already recorded

- Signed baseline `313dfb0ac2b20f32954dd0ffb08fa60214ae34da` verified at epoch 1, and the publisher acknowledgment finalized.
- Signed NONMATERIAL fixture `7fa24a913b0e7e86aaec2cb42011df7bcf8a4e10` returned `NONMATERIAL`; canonical state advanced to that SHA while epoch stayed 1.
- Signed MATERIAL fixture `376e447065b8a7efd1d26a60c6c9ac476bd1e567` returned `INCONCLUSIVE` after GitHub commit lookups returned HTTP 403.
- Signed ambiguous fixture `14401f20f2d3eeeac537746966646809e5c01b8c` also returned `INCONCLUSIVE` after HTTP 403. Its meaning was not assessed.

Those results belong to the earlier deployment and do not prove a hosted MATERIAL or semantic ambiguity outcome. Exact transactions and canonical readbacks remain in [Studionet evidence](STUDIONET_EVIDENCE.md).

## Source authentication correction

Commit `46b749669c532bf85b3491d2ea6dd4bcee987422` stores the authenticated active source and a verified candidate snapshot in canonical Registry state. It reuses the baseline during assessments and reuses a candidate only when its source identity, SHA, digest, signature metadata, tree/blob identifiers, and ancestry base match. Validators still independently fetch a first-seen candidate and independently assess the same authenticated source.

Provider failures now distinguish access denial, rate limiting, missing resources, and upstream errors. Safe GitHub response headers and bounded error messages are recorded without authorization headers. Retries use capped exponential delay and respect numeric or date-form `Retry-After` and GitHub reset times. The program view exposes `provider_retry_at`.

The disposable two-URL probe at `evidence/github-access-diagnostic/github_api_probe.py` was deployed to Studionet at `0x1d89559F621AEb81b53E7004Fe54BfBe1D5c9a02`. Deployment transaction `0x45aa328c86e642173a3a331e0c25d0030100fa1808c3d80c1530a4ff8418f8ae` finalized `MAJORITY_AGREE`, with successful execution and no value credited. Readback matched the local source exactly at SHA-256 `82328DAF235D06A2C790AE093D916E4E69EF3EA6F37F03378981ECDD91396F1D`.

Probe transaction `0x2add2cd295c1cbcfc2753631582947d4ef59b266eef77bb377cc7d74469c0228` finalized `MAJORITY_DISAGREE`. The leader and successful validator executions both reached the GitHub commit and rate-limit endpoints with HTTP 200; the captured rate-limit response reported 42 of 60 core requests remaining. This establishes that the previous HTTP 403 was not recurring during this probe, but it does not establish its historical cause. The disagreement was caused by a diagnostic-contract defect: it truncated the commit response to 512 bytes before JSON parsing, so the separately returned `sha` field was empty and the validator's expected-SHA check necessarily returned false. No permanent GitHub access-policy change is claimed.

## Verification

- Full local `npm run preflight` passed for source commit `46b7496`: network guard, typecheck, lint, 10 JavaScript tests, 34 Direct Mode tests, and production build. Direct Mode uses mocked providers and is not hosted validator proof.
- The Windows sandbox initially denied Next.js generated route-directory creation; the same preflight passed with scoped permission to write build output under this repository.
- `npm audit --omit=dev --audit-level=high` could not reach `registry.npmjs.org` because host DNS returned `ENOTFOUND`; this is not an audit result.
- GitHub Actions run 18 (`38615258759`) passed for commit `ab4d2c29e2f1592eac80947d5170a08020b98f72`, including `npm ci`, frozen Python dependencies, preflight, production build, and production dependency audit. Run 17 passed for its parent evidence commit `f2987c9`; run 16 passed for the older deployment source `4971823`.
- GitHub Actions run 20 (`38621313012`) passed for deployment and lifecycle evidence commit `2ebd9f9`, including `npm ci`, frozen Python dependencies, the complete preflight, production build, and production dependency audit. The corresponding Vercel preview status also passed.

## Preview and review

## Live browser validation

The public HTTPS frontend was exercised in Brave on Studionet 61999. The reading room, publisher, acknowledgments, activity, about, and `/program/1/` routes loaded. Wallet B `0xFf203Bb65942F50CB81A8AF98c5F5bd9d8a79b54` signed the zero-value Program 1 epoch 3 acknowledgment in the browser (`0xb3c62284235bddd5f785f4c8c47bb9da0f4e924c0c675ec89328def5b199f140`); finality and canonical acknowledgment readback matched. The browser also read the actual hosted MATERIAL results for review 1 and review 2.

The browser session's connected account was `0x4A7D76b8C4668a3426d6d54eC24b41Fa87b532f5`. It is the publisher recorded for Program 2, whose verification remains `INCONCLUSIVE` because the signed manifest nominates `0x527dA5f7022f14f7105E5f06cEc1a8EFf53556b5`. The successful Program 1 publisher lifecycle is bound to `0x527d…56b5`; no browser publisher write was submitted from that account. The observer conservatively classified the acknowledgment as finalized-execution-unknown because the RPC omitted `txExecutionResultName`, although the finalized receipt and canonical readback were successful.

The Vercel preview is protected. The connected Vercel identity returned HTTP 403 for the `bibidees-projects` team scope and for preview access. The protected preview and extension-specific controls therefore remain unverified; protection was not disabled. Vercel environment values and the live Registry binding could not be verified.

The checked repository CI workflow does not require an external security review. No independent review has been obtained; it remains a recommended assurance step. The current work is adversarial self-audit, not independent review.

## Release decision

**NOT RELEASED.** Production writes remain locked. No user funds were accepted; no merge or production promotion occurred. Exact-source deployment, the required hosted MATERIAL and ambiguous lifecycles, route checks, and a zero-value browser acknowledgment are complete. Remaining release work is publisher-account browser signing from the manifest wallet, wallet-extension account/network/rejection coverage, independent security review, and fresh CI for the evidence update. The historical HTTP 403 cause remains unknown because it did not recur.
