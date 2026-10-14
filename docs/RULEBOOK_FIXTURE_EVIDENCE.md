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

No Studionet Registry transaction has been submitted for this fixture lifecycle yet. Baseline verification, acknowledgment, and actual MATERIAL, NONMATERIAL, and INCONCLUSIVE hosted validator results remain pending. No expected model outcome is treated as a result.
