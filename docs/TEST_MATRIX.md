# Registry V2 test matrix

Recorded 2026-10-14 against branch `codex/revigate-remove-escrow-2026-10-14`. This matrix covers the noncustodial Registry only. Historical escrow tests are retained in Git history and archived evidence and do not count toward this release.

Local totals: 10 JavaScript tests and 22 Direct Mode tests pass. TypeScript, lint, the Studionet source guard, and production build pass. Direct Mode uses mocked providers. `PARTIAL` and `BLOCKED` entries are not release passes.

| ID | Status | Evidence or boundary |
|---|---|---|
| T01 | PASS | Publisher identity and full commit input validation in Direct Mode. |
| T02 | PASS | Mocked signed commit, branch membership, manifest nomination, tree blob, and digest authentication. |
| T03 | PASS | Unsigned and incomplete GitHub verification metadata remain INCONCLUSIVE. |
| T04 | PASS | Malformed, duplicate, empty, and oversized rulebook structures are rejected. |
| T05 | PASS | Only the publisher may verify or request a revision. |
| T06 | PASS | One pending review, cooldown, expiry, replay, and three attempt cap. |
| T07 | PASS | Mocked MATERIAL decision advances source and epoch exactly once. |
| T08 | PASS | Acknowledgment history remains immutable across material epochs. |
| T09 | PASS | Same epoch source acknowledgment records a changed SHA/digest and deduplicates exact repeats. |
| T10 | PASS | INCONCLUSIVE does not advance source or epoch and can be retried within the cap. |
| T11 | PASS | Review assessment and expiry use a consistent exact deadline boundary. |
| T12 | PASS | Repository, branch, path, and SHA validation rejects traversal and URL syntax. |
| T13 | PASS | Fixed source bytes must match the authenticated Git tree blob. |
| T14 | PASS | Candidate must descend from the active commit; siblings are rejected. |
| T15 | PASS | Stored base digest mismatch resolves to INCONCLUSIVE. |
| T16 | PARTIAL | Model output schema is validated locally; hosted malformed output not yet observed. |
| T17 | PARTIAL | Validator callback compares outcome, SHAs, digests, and changed IDs; hosted disagreement pending. |
| T18 | PARTIAL | Prompt source is quoted as untrusted data; hosted prompt injection case pending. |
| T19 | PASS | Material event pagination is newest first, bounded, and cursor stable over 120 records. |
| T20 | PASS | Acknowledgment pagination is newest first, bounded, and cursor stable over 120 records. |
| T21 | PASS | Program and review pages are bounded to 50. |
| T22 | PASS | Exact acknowledgment requires current epoch, SHA, and digest. |
| T23 | PASS | Reaffirmation appends explicit history without changing program state. |
| T24 | PASS | Unavailable, rate limited, oversized, truncated, or invalid provider data stays INCONCLUSIVE. |
| T25 | PASS | Rulebook normalization covers BOM, CRLF/lone CR, NFC, and SHA-256 equality. |
| T26 | PASS | Frontend clause comparison parses authenticated R-01 through R-16 sections and rejects duplicates. |
| T27 | PASS | Frontend fetches exact commit paths and verifies canonical digest before display. |
| T28 | PASS | Registry configuration requires chain 61999, protocol v1, version 2, custody NONE. |
| T29 | PASS | Every frontend write constructs native value zero. |
| T30 | PASS | Stored pending transactions reject nonzero value and are chain/address scoped. |
| T31 | PASS | Wallet account/network event races and disconnect cleanup pass fake-provider tests. |
| T32 | BLOCKED | Genuine GitHub verified baseline fixture has not yet been published. |
| T33 | BLOCKED | Genuine signed nonmaterial revision fixture has not yet been published. |
| T34 | BLOCKED | Genuine signed material revision fixture has not yet been published. |
| T35 | BLOCKED | Genuine signed ambiguous revision fixture has not yet been published. |
| T36 | BLOCKED | Hosted prompt injection and validator behavior await signed fixtures and deployment. |
| T37 | BLOCKED | Actual hosted validator disagreement/undetermined result has not been observed. |
| T38 | PASS | Unsafe repository paths and source identity mismatches fail closed locally. |
| T39 | PASS | Oversized/truncated source provider responses fail closed locally. |
| T40 | PASS | Wrong repository and non-descendant revision fixtures fail closed locally. |
| T41 | PASS | Unscoped preamble is included in the Registry clause map and semantic diff. |
| T42 | PASS | Production build prerenders all nine active routes with the Registry-only frontend. |
| T43 | PASS | Provider absence, wallet rejection, account changes, and network changes remain explicit. |
| T44 | PASS | Pending, cancelled, undetermined, execution error, unknown execution, and success are distinct. |
| T45 | PASS | Returned hashes persist; pre-hash rejection stores nothing; storage failure exposes the hash. |
| T46 | PARTIAL | Canonical readback matching is implemented; live write/readback proof awaits deployment. |
| T47 | PASS | Refresh recovery loads the same zero-value hash and refuses duplicate pending writes. |
| T48 | PASS | Program, review, material event, and acknowledgment reads use bounded pagination. |
| T49 | BLOCKED | No live Studionet baseline, acknowledgment, and three-outcome revision lifecycle yet. |
| T50 | N/A | Financial payout/refund/exit cases were retired with escrow and are outside Registry V2. |
| T51 | BLOCKED | Exact reviewed Registry V2 source is not yet deployed and attested on Studionet. |
| T52 | PARTIAL | Local tests, typecheck, lint, network guard, and build pass; fresh CI and browser run remain. |

## Current decision

NOT RELEASED. T32–T37, T49, T51, fresh CI, real browser testing, and independent review remain open. T50 is intentionally not applicable because Registry V2 has no financial functionality.


