# Registry V2 test matrix

Recorded 2026-10-15 for the clean Wallet A lifecycle and finalized Wallet B acknowledgment on corrected Registry `0xFe59b3F7a867B4Aca632b0F40060aACfF8DC36B3`. This matrix covers the noncustodial Registry only. Historical escrow tests remain archived and do not count toward this release.

Local verification currently passes 13 JavaScript tests and 34 Direct Mode tests (47 total). Direct Mode uses mocked providers. Fresh GitHub Actions run `38652447172` for observer-hardening commit `13bc812f352a6f484d8ba4d34ffb244fc65dc223` passed npm ci, frozen Python dependencies, preflight, production build, and production dependency audit. A live Brave/Rabby pass exercised the public routes, Program 3 readback, Wallet A session persistence across refresh, switching to Wallet B, a zero-value Wallet B acknowledgment, the non-custodial Registry banner, and canonical acknowledgment history. GitHub `main` protection is enabled with strict `verify` and `Vercel` checks and one required approval. `PARTIAL` and `BLOCKED` entries are not release passes.

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
| T31 | PARTIAL | Live Brave connected Rabby as Wallet A, survived refresh, switched to Wallet B, and submitted a zero-value acknowledgment. The corrected local build also connected Rabby from a non-Studionet state, requested the Studionet switch, and rendered the Wallet B account after the switch. Rejection, disconnect cleanup, and pending recovery remain unverified. |
| T32 | PASS | Program 3 baseline `b1c5254617155214e210a39dafd742fd33b102d6`; verification transaction `0x6ee5b6bbb3f67d3971bbe965b7386a542872cc9ba6c1e43bbd0c6b0cfa59f048`; canonical state VERIFIED at epoch 1. |
| T33 | PASS | Hosted NONMATERIAL assessment of signed commit `ee033cbef9450f58990b01eac77b5949453f2130`; assessment `0x19f9190ef84f8e6e459796dcd7d6b641c5151396cae7945a60efa9c6c083f37c`; canonical readback updated active SHA/digest and kept epoch 1. |
| T34 | PASS | Signed material candidate `ecac64c4f95a527c9f587ab992d6e503d713bb11`; assessment `0x18f4f7327ad2f68e7ac33ec6aa62eccd9013ffcf504ac941e9df5b5fdee74340`; actual `MATERIAL`, both source statuses VERIFIED, epoch advanced to 2. |
| T35 | PASS | Signed ambiguous candidate `d35d438d0e45e58e3227f95135fa3a2abc523aed`; request `0x5f19d93b54db9740ffd8f9cc12144632cba4b7553205622a1b970870c9646cd9`, assessment `0xc60c1c640fe1fc9803056e596e61bdfcdee05e60609ded5c7f38b82e163f6956`; actual `MATERIAL`, both sources VERIFIED, three validators agreed and two were idle after quorum. |
| T36 | BLOCKED | A hosted prompt-injection case has not been run. Current source authentication succeeds; the earlier 403 remains unexplained and is not used as evidence for this case. |
| T37 | BLOCKED | No validator disagreement or undetermined outcome has been observed. Quorum-cancelled validator executions are not disagreement. |
| T38 | PASS | Unsafe repository paths and source identity mismatches fail closed locally. |
| T39 | PASS | Oversized/truncated source-provider responses fail closed locally. |
| T40 | PASS | Wrong repository and non-descendant revision fixtures fail closed locally. |
| T41 | PASS | Unscoped preamble is included in the Registry clause map and semantic diff. |
| T42 | PASS | Production build prerenders all nine active routes with the Registry-only frontend. |
| T43 | PARTIAL | Live checks passed for `/`, `/publish/`, `/my-rules/`, `/activity/`, `/about/`, `/program/1/`, and `/program/3/`; Wallet A signed the publisher request and assessment, then Wallet B signed acknowledgment transaction `0xefb3e3cec4fa655acbc88072574ee6effe5d933ccc7b4f3a20f4aec1631c1209`, which direct RPC finalized as `MAJORITY_AGREE` with `value_credited=false`. The corrected local build also exercised Rabby’s wrong-network switch path and canonical Program 3/history reads. Rejection, disconnect recovery, provider-absence UI, and terminal finality for the new probe remain open. |
| T44 | PARTIAL | The browser observer retained an earlier pending/accepted snapshot for the Wallet B hash while direct RPC later reported `FINALIZED` and `MAJORITY_AGREE`; canonical `get_acknowledgment` and `get_acknowledgment_page` readbacks confirmed epoch 3, history index 1, and `value_credited=false`. Commit `13bc812f352a6f484d8ba4d34ffb244fc65dc223` now treats every finalized receipt as a canonical-readback candidate, clears it only after method-specific state matches, keeps unknown/failed/delayed states distinct, and never replays automatically. A fresh local browser probe submitted zero-value hash `0x7fd119eb65480dd7ef401dc862a751515f0613fcd4058d383b7a76d4b69d823`; Studionet exposed `ACCEPTED` with five `AGREE` votes but not terminal finality at capture, and the UI did not retry. A later read-only `eth_getTransactionByHash` call returned `-32001 Transaction not found`; this is classified as unavailable, not finalized, failed, cancelled, or rolled back. The exact poll is preserved in the evidence directory. The public deployment and browser rerun remain open. |
| T45 | PASS | Returned hashes persist; pre-hash rejection stores nothing; storage failure exposes the hash in local tests. |
| T46 | PASS | Corrected-source hosted write/readback checks match for baseline verification, NONMATERIAL, MATERIAL, and ambiguous MATERIAL decisions; final Program 3 state is epoch 3, two material events, and no pending review. |
| T47 | PARTIAL | Browser navigation, Program 3 canonical readback, Wallet B account switching, finalized Wallet B acknowledgment, refresh recovery, and the corrected local build’s wrong-network switch path were exercised in Brave/Rabby. Rejected connection, disconnect recovery, and terminal pending-hash recovery remain unverified in the real extension. |
| T48 | PASS | Program, review, material-event, and acknowledgment reads use bounded pagination. |
| T49 | PASS | Exact corrected-source deployment verified the signed baseline, returned actual `NONMATERIAL` for the editorial fixture, and actual `MATERIAL` for both the 60-day and ambiguous fixtures. Canonical sources were VERIFIED and final Program 3 state advanced to epoch 3. Historical 403 cause remains unknown. |
| T50 | N/A | Financial payout, refund, and exit cases were retired with escrow and are outside Registry V2. |
| T51 | PASS | Corrected Registry source `46b749669c532bf85b3491d2ea6dd4bcee987422` is deployed and exactly attested at `0xFe59b3F7a867B4Aca632b0F40060aACfF8DC36B3`, transaction `0xe51db5761f1808bdb93b3a98a4d895e31339a48a85882b8c081a4e455dc6fbf2`. |
| T52 | PARTIAL | Local tests, fresh CI run `38652447172` for observer-hardening commit `13bc812f352a6f484d8ba4d34ffb244fc65dc223`, and the clean hosted Wallet A lifecycle pass. All public routes and Program 3 were read in Brave; Wallet B was switched in Rabby and its zero-value acknowledgment finalized with canonical history index 1; refresh recovery passed. The protected preview redirects to Vercel login and was not bypassed; the observer fix still needs a fresh public deployment/browser rerun, and remaining extension flows and independent review remain incomplete. |

## Current decision

NOT RELEASED. The corrected Registry is deployed and source-attested. Program 3 has verified baseline, NONMATERIAL, MATERIAL, and ambiguous MATERIAL results with canonical finality. Wallet A remains the publisher signer; Wallet B has a finalized zero-value participant acknowledgment for epoch 3. Branch protection is enabled on `main`. Protected preview access, remaining wallet-extension flows, and independent security review remain open. No user funds were accepted, and no merge or production promotion occurred.
