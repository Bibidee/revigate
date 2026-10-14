# Signed rulebook fixture evidence

Recorded 2026-10-14 from GitHub's public commit API for `Bibidee/revigate`.

The public test rulebook is on branch `revigate-rulebook-fixture-v2`, whose fixture head is `14401f20f2d3eeeac537746966646809e5c01b8c`. Its publisher manifest at `.revigate/publisher.json` nominates `0x527dA5f7022f14f7105E5f06cEc1a8EFf53556b5`, the configured `polyglot-deployer` test wallet. The manifest binds protocol `revigate-v1`, chain ID `61999`, and rulebook path `rules/revigate-v2.md`.

| Fixture state | Commit SHA | GitHub verification |
|---|---|---|
| Publisher manifest | `d53b4add33bfdd0e6ce9c10a1cf13c782a972154` | `verified=true`, `reason=valid`, signature and payload present; verified at `2026-10-14T16:09:56Z` |
| Baseline | `313dfb0ac2b20f32954dd0ffb08fa60214ae34da` | `verified=true`, `reason=valid`, signature and payload present; verified at `2026-10-14T16:10:29Z` |
| Nonmaterial editorial marker | `7fa24a913b0e7e86aaec2cb42011df7bcf8a4e10` | `verified=true`, `reason=valid`, signature and payload present; verified at `2026-10-14T16:10:51Z` |
| Material eligibility change (14 to 60 days) | `376e447065b8a7efd1d26a60c6c9ac476bd1e567` | `verified=true`, `reason=valid`, signature and payload present; verified at `2026-10-14T16:11:05Z` |
| Ambiguous eligibility language | `14401f20f2d3eeeac537746966646809e5c01b8c` | `verified=true`, `reason=valid`, signature and payload present; verified at `2026-10-14T16:11:29Z` |

GitHub returned nonempty signature, payload, and `verified_at` for each listed commit. The four rulebook commits form an ordered ancestry on the fixture branch, and the final head is the ambiguous revision. These are genuine signed public source fixtures; they are not hosted Registry results.

## Hosted Registry lifecycle on 2026-10-14

The deployed Registry at `0xBB15E0F4Ad5e61AE1374ed1EA3E32f2172EA6D3F` was exercised on Studionet 61999 with the unlocked repository-local CLI. Each write attached zero value (`value_credited=false`). The deployment address and source attestation are recorded in [Studionet evidence](STUDIONET_EVIDENCE.md).

| Step | Transaction | Actual result / canonical state |
|---|---|---|
| Register signed baseline | `0xc4069ee95a663fb183e801b6c31912a0737573cf11380b2b9187a5f7d9db6e52` | Program 1 created for the nominated publisher, fixed repository, branch, manifest, and rulebook path. |
| Verify baseline | `0xb2ef13b3191e01b884f7a59cc6ffa6a86520da83fe24ecdcf976bfa0365cccd9` | Finalized; program readback `VERIFIED`, epoch 1, baseline SHA `313dfb0ac2b20f32954dd0ffb08fa60214ae34da`, digest `ca32895d80580ab3a3ddc771e1836da0a8a1e4d3fa2d3ebe85fb047ba7883170`. |
| Publisher acknowledgment | `0x96d42b7cbc90339dda4f0c16752139450b30fbbe1cbe89d12b49b296c46a46b0` | Finalized and read back at epoch 1 for the baseline SHA/digest. |
| NONMATERIAL candidate `7fa24a9…` | Request `0xb33c3f63d957b00ac2a90883d6dec2898234287347745f72ad87afc73e3b2ffa`; assessment `0xfb6cb52f1145c564ef2b3feae7a728cdccc8f970118987b2c8041e9628ebd624` | Actual `NONMATERIAL`. Program readback: active SHA `7fa24a913b0e7e86aaec2cb42011df7bcf8a4e10`, digest `55fa1674d3523cb117b08643556f06ea39085790266ba047fe430fc0cf2ae3a4`, epoch 1, `pending_review=0`, material-event count 0. |
| MATERIAL candidate `376e447…` | Request `0xe87dfeb08031474f41c442c116c196788571740e633e253540f5d529d95cdfe2`; assessment `0xbc87505c4131907777fd7ea3a9c8d38fa762bbdbcbabf09984cfa4159a31bf0b` | Actual `INCONCLUSIVE`. Base and candidate source lookups each returned HTTP 403; reason `authenticated evidence unavailable`. Program remained at the NONMATERIAL SHA/digest and epoch 1. |
| Ambiguous candidate `14401f2…` | First request `0x5b32091c5e36b98acb0ad193ebf53dde25c69a2bad25fc3dc4e3216cb53c8552` | Finalized as execution `ERROR` on all five validators because the 300-second publisher cooldown was still active; no review was created. |
| Ambiguous candidate after cooldown | Request `0xb85625fdb851b9bb1c4708bdb9ee34581e21bc59e3ed8f8d19419f48d1b82d5a`; review 3 assessment `0x6829dae057666682f4775dd0bfd001e0b95017380c9ce6ae0d8abdbe1654bcc9` | Actual `INCONCLUSIVE`. Both base and candidate source lookups returned HTTP 403. Canonical review 3 is `INCONCLUSIVE`; canonical program remains `VERIFIED`, active SHA/digest unchanged, epoch 1, pending review 0. No semantic ambiguity verdict was produced. |

The hosted lifecycle therefore confirms baseline authentication, acknowledgment, and one NONMATERIAL transition, but it does not demonstrate a semantic MATERIAL result or an assessment of ambiguous language. The two HTTP 403 outcomes do not identify the underlying cause of provider authorization failure. No expected model outcome is counted as a result, and no validator disagreement was observed.

## Current source correction boundary

The hosted lifecycle above was executed against Registry source commit `4971823`. At the time of that historical run, correction `46b749669c532bf85b3491d2ea6dd4bcee987422` had not been deployed. The corrected-source lifecycle below now supersedes that former release blocker while preserving the earlier outcomes as historical evidence.

## Corrected-source hosted lifecycle

The required fresh lifecycle was completed against source-attested Registry `0xFe59b3F7a867B4Aca632b0F40060aACfF8DC36B3`. All writes carried zero value.

| Step | Transaction | Actual result / canonical state |
|---|---|---|
| Deploy corrected source | `0xe51db5761f1808bdb93b3a98a4d895e31339a48a85882b8c081a4e455dc6fbf2` | `FINALIZED`, `MAJORITY_AGREE`, execution `SUCCESS`; deployed source exactly matched SHA-256 `EA457FEAB7B270970586FFFCBB12D8B9E58FA5F057A3C49241AA4CBFB6992D56`. |
| Register baseline | `0xc48d0fffa186b9c35ec1e7181b2902feb7a1f9b48019d4795609f5cab255fe09` | Program 1 created. |
| Verify baseline | `0xad3ee46ca318d710c1a957d4f47a51c4c464d00f0cbb2025f980eaede6f86db8` | `VERIFIED`, epoch 1, active SHA `313dfb0ac2b20f32954dd0ffb08fa60214ae34da`, digest `ca32895d80580ab3a3ddc771e1836da0a8a1e4d3fa2d3ebe85fb047ba7883170`. |
| MATERIAL candidate `376e447…` | Request `0x1deee7091023f61e2797fe526cae9521e5ef8a7d34fff07826cab49fd2f45f52`; assessment `0xeae537a1354d3335cb9c721eb6225edd4ffe71a52e7629d75b819a4c6756df1f` | Actual `MATERIAL`; both sources `VERIFIED`; epoch advanced to 2. |
| Ambiguous candidate `14401f2…` | Request `0x79c27d3aed9bdd7bfeb6073764b91d5fe3108744083bb930a77369b559493a12`; review 2 assessment `0x37bff50bff4456cb062fda7a210d6a4f3a8ac8d37d9585d4f08c4b78f37ab866` | Actual `MATERIAL`; three validator votes `AGREE`, two `IDLE` after quorum. Canonical rationale: vague “sufficient participation” plus discretion changed eligibility criteria. |

Final canonical program state is `VERIFIED`, active SHA `14401f20f2d3eeeac537746966646809e5c01b8c`, digest `3a95f7e76cedba0bce0db531b97c17a0c0d842b967278d0768c2320ba1769631`, epoch 3, material-event count 2, `pending_review=0`, and `provider_retry_at=0`. The actual ambiguous outcome was recorded as returned; no expected outcome was substituted.
