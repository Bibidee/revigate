# Registry V2 test matrix

Recorded 2026-10-14 for source correction commit `46b749669c532bf85b3491d2ea6dd4bcee987422` on branch `codex/revigate-remediation-2026-10-14`. The evidence update at `ab4d2c29e2f1592eac80947d5170a08020b98f72` was verified by GitHub Actions run 18. This matrix covers the noncustodial Registry only. Historical escrow tests remain archived and do not count toward this release.

Local verification for source commit `46b749669c532bf85b3491d2ea6dd4bcee987422`: 10 JavaScript tests and 34 Direct Mode tests pass; TypeScript, lint, the Studionet source guard, and the production build pass. Direct Mode uses mocked providers. GitHub Actions run 18 (ID `38615258759`) passed on evidence commit `ab4d2c29e2f1592eac80947d5170a08020b98f72`, including `npm ci`, frozen Python dependencies, preflight, production build, and production dependency audit. `PARTIAL` and `BLOCKED` entries are not release passes.

| ID | Status | Evidence or boundary |
|---|---|---|
| T01 | PASS | Publisher identity and full commit input validation in Direct Mode. |
| T02 | PASS | Mocked signed commit, branch membership, manifest nomination, tree blob, and digest authentication. |
| T03 | PASS | Unsigned and incomplete GitHub verification metadata remain INCONCLUSIVE. |
| T04 | PASS | Malformed, duplicate, empty, and oversized rulebook structures are rejected. |
| T05 | PASS | Only the publisher may verify or request a revision. |
| T06 | PASS | One pending review, cooldown, expiry, replay, and three-attempt cap. |
| T07 | PASS | Mocked MATERIAL decision advances source and epoch exactly once. |
| T08 | PASS | Acknowledgment history remains immutable across material epochs. |
| T09 | PASS | Same-epoch acknowledgment records a changed SHA/digest and deduplicates exact repeats. |
| T10 | PASS | INCONCLUSIVE does not advance source or epoch and can be retried within the cap. |
| T11 | PASS | Review assessment and expiry use a consistent exact deadline boundary. |
| T12 | PASS | Repository, branch, path, and SHA validation rejects traversal and URL syntax. |
| T13 | PASS | Fixed source bytes must match the authenticated Git tree blob. |
| T14 | PASS | Candidate must descend from the active commit; sibling commits are rejected. |
| T15 | PASS | Stored base digest mismatch resolves to INCONCLUSIVE. |
| T16 | PARTIAL | Output schema is validated locally; hosted malformed-output behavior has not been observed. |
| T17 | PARTIAL | Validator callback compares outcome, SHAs, digests, and changed IDs; hosted disagreement remains unobserved. |
| T18 | PARTIAL | Prompt source is quoted as untrusted data; hosted prompt-injection behavior remains untested. |
| T19 | PASS | Material-event pagination is newest first, bounded, and cursor stable over 120 records. |
| T20 | PASS | Acknowledgment pagination is newest first, bounded, and cursor stable over 120 records. |
| T21 | PASS | Program and review pages are bounded to 50. |
| T22 | PASS | Exact acknowledgment requires current epoch, SHA, and digest. |
| T23 | PASS | Reaffirmation appends explicit history without changing program state. |
| T24 | PASS | Provider status classes, sanitized headers, retry-after/reset handling, bounded exponential backoff, and enforcement of `provider_retry_at` pass Direct Mode tests. The new classification and retry behavior has not been exercised on hosted GitHub responses. |
| T25 | PASS | Rulebook normalization covers BOM, CRLF/lone CR, NFC, and SHA-256 equality. |
| T26 | PASS | Frontend clause comparison parses authenticated R-01 through R-16 sections and rejects duplicates. |
| T27 | PASS | Frontend fetches exact commit paths and verifies canonical digest before display. |
| T28 | PASS | Registry configuration requires chain 61999, protocol v1, version 2, custody NONE. |
| T29 | PASS | Every frontend write constructs native value zero. |
| T30 | PASS | Stored pending transactions reject nonzero value and are chain/address scoped. |
| T31 | PARTIAL | Wallet account/network event races and disconnect cleanup pass fake-provider tests; extension UI integration is unverified. |
| T32 | PASS | Hosted baseline verification on signed commit `313dfb0ac2b20f32954dd0ffb08fa60214ae34da`; verification transaction `0xb2ef13b3191e01b884f7a59cc6ffa6a86520da83fe24ecdcf976bfa0365cccd9`, canonical state VERIFIED at epoch 1. |
| T33 | PASS | Hosted NONMATERIAL assessment of signed commit `7fa24a913b0e7e86aaec2cb42011df7bcf8a4e10`; assessment transaction `0xfb6cb52f1145c564ef2b3feae7a728cdccc8f970118987b2c8041e9628ebd624`; canonical readback updated active SHA/digest and kept epoch 1. |
| T34 | PARTIAL | Signed material candidate `376e447065b8a7efd1d26a60c6c9ac476bd1e567` was assessed, but the actual result was INCONCLUSIVE: base and candidate GitHub commit lookups returned HTTP 403. Program state did not advance. |
| T35 | PASS | On corrected Registry `0xFe59…36B3`, signed ambiguous candidate `14401f20f2d3eeeac537746966646809e5c01b8c` assessment `0x37bff50bff4456cb062fda7a210d6a4f3a8ac8d37d9585d4f08c4b78f37ab866` returned actual `MATERIAL`; both sources were `VERIFIED`, three validators agreed, and two were idle after quorum. |
| T36 | BLOCKED | Hosted prompt-injection case has not been run; source-authentication 403 prevents a trustworthy semantic comparison. |
| T37 | BLOCKED | No validator disagreement or undetermined outcome has been observed. Quorum-cancelled validator executions are not disagreement. |
| T38 | PASS | Unsafe repository paths and source identity mismatches fail closed locally. |
| T39 | PASS | Oversized/truncated source-provider responses fail closed locally. |
| T40 | PASS | Wrong repository and non-descendant revision fixtures fail closed locally. |
| T41 | PASS | Unscoped preamble is included in the Registry clause map and semantic diff. |
| T42 | PASS | Production build prerenders all nine active routes with the Registry-only frontend. |
| T43 | PARTIAL | Provider absence, wallet rejection, account changes, and network changes remain explicit in fake-provider tests; live extension checks are unverified. |
| T44 | PASS | Pending, cancelled, undetermined, execution error, unknown execution, and success remain distinct in local tests; no live wallet UI flow was completed. |
| T45 | PASS | Returned hashes persist; pre-hash rejection stores nothing; storage failure exposes the hash in local tests. |
| T46 | PASS | Corrected-source hosted write/readback checks match for baseline verification and both MATERIAL decisions; final state is epoch 3, two material events, and no pending review. |
| T47 | PARTIAL | Refresh recovery loads the same zero-value hash and refuses duplicate pending writes in local tests; browser refresh recovery is unverified. |
| T48 | PASS | Program, review, material-event, and acknowledgment reads use bounded pagination. |
| T49 | PASS | Exact corrected-source deployment verified the signed baseline, then returned actual `MATERIAL` for the 14-to-60-day fixture and actual `MATERIAL` for the ambiguous fixture. Canonical sources were verified and final state advanced to epoch 3. Historical 403 cause remains unknown. |
| T50 | N/A | Financial payout, refund, and exit cases were retired with escrow and are outside Registry V2. |
| T51 | PASS | Corrected Registry source `46b749669c532bf85b3491d2ea6dd4bcee987422` is deployed and exactly attested at `0xFe59b3F7a867B4Aca632b0F40060aACfF8DC36B3`, transaction `0xe51db5761f1808bdb93b3a98a4d895e31339a48a85882b8c081a4e455dc6fbf2`. |
| T52 | PARTIAL | Local preflight passes for `46b7496`, and Actions run 18 passes for its evidence commit `ab4d2c2`. Vercel status is green, but the protected preview returns HTTP 403 to the connected identity; real browser/wallet-extension checks remain unverified. |

## Current decision

NOT RELEASED. The corrected Registry is deployed, source-attested, and has produced hosted semantic results for both required revisions. Production writes remain locked. Real browser/wallet-extension checks and independent security review remain incomplete, and fresh CI is required for this evidence commit. The historical 403 cause remains unknown. No user funds were accepted, and no merge or production promotion occurred.
