# Rulebook Publication, Evidence Authenticity and Source Provenance

## Supported source class in V1
Public GitHub repository under `owner/repository`, fixed Markdown path and fixed wallet-nomination manifest path. All reviews point to **full immutable 40-character Git commit SHA**. No raw mutable `main` or latest branch URL as evidence, no arbitrary websites, IPFS, screenshots or uploaded files in V1. GitHub is a centralized evidence *host*, not an application backend or authoritative outcome engine; its availability/ownership records remain an acknowledged trust dependency.

## Baseline publisher nomination manifest
The GitHub repository at the baseline commit must contain an explicit publication manifest, e.g. `.revigate/publisher.json`:
```
{ "protocol": "revigate-v1", "publisher_wallet": "0x...", "rulebook_path": "rules/program.md", "network_chain_id": 61999 }
```
At program proposal, A's `msg.sender` must match the normalized wallet in the *content of the signed baseline commit*; the manifest file must be fetched from the same owner/repo/SHA. This establishes public GitHub publication of a wallet nomination, **not legal identity proof and not an EVM cryptographic signature from GitHub**. Do not treat a bare GitHub commit's `verified=true` as proof that its author personally owns A; rely on the wallet nomination plus A's onchain signature and document exact scope.

## Exact-source validation
- Normalize repo slug and file paths deterministically; forbid path traversal, empty segments, credentials, URL fragments, slashes escaping selected repo, private endpoints, non-HTTPS.
- Fetch canonical GitHub repo metadata, commit API, tree/blob/contents at full SHA and exact manifest/rulebook paths through bounded constructed API URLs; do not follow links embedded in rulebook text.
- Confirm returned repo full_name, canonical SHA and blob SHA/path identity agree with requested values. Confirm signed commit fields `verification.verified==true`, `reason=='valid'`, nonempty signature and payload where available. Treat missing proofs as unavailable/inconclusive, never forge them.
- Revision must descend from current accepted reviewed commit in same repo (verified through compare/ancestry API) and target same immutable rulebook path. Version change only from publisher's onchain `request_revision`; source owner/branch publication controls are an external trust boundary.
- Use `https://raw.githubusercontent.com/{owner}/{repo}/{sha}/{path}` or verified Git blob retrieval. Verify fetched bytes against provider metadata/blob hash where technically possible. Keep content SHA256 of decoded normalized text for audit; content hash alone **does not** prove provider authority or semantic truth.
- Enforce response status, UTF-8 decode, byte/character upper bounds before LLM input. Reject oversized/truncated content as UNAVAILABLE/INCONCLUSIVE, never approve cut text.
- API outages, rate limits, malformed JSON, sign errors, revoked/missing commit, inconsistent provider identity, failed redirect policy -> INCONCLUSIVE with no active rule change.

## Rulebook document format (V1)
- English UTF-8 Markdown file, <= 8 KiB normalized content, between 2 and 16 numbered clauses.
- Each normative clause: `## R-01: Title` followed by nonempty prose, unique stable clause ID `R-01`..`R-16` (1–16, no sparse ambiguity unless test proves supported).
- No HTML scripts, embedded active content or remote imports are followed. Renderer escapes/sanitizes Markdown and text.
- Normalize CRLF to LF and NFC for comparison; compute content digest from exact documented normalization. Reject control/bidi confusable characters if they would change display or meaning; disclose supported input subset.
- Required clause domains: eligibility, benefits/amount definitions, participant obligations, deadlines, rule revision process, exit/remedy policy. If one is missing, at minimum visibly warn or make schema validation fail as specified in tested parser.
- Distinguish change in words from semantic change. A clause can be edited stylistically without bumping epoch. A move or renumber cannot hide a substantive rights change.

## Semantic materiality rules
A revision is material if it changes eligibility, value/benefit entitlement, responsibility, notice, evidence obligations, appeal/exit rights, disqualification, deadlines, discretion, penalties or effective scope. Rephrase/typo without semantic effect is nonmaterial. Missing essential evidence or genuine disputed interpretation is inconclusive. Validators must examine the **complete paired bounded documents**, not only a summary given by publisher or a diff that omits untouched context.

## Branch and freshness disclosure
GitHub HEAD is mutable. V1 does not poll branches or automatically detect unpublished source revisions. The canonical contract version is the **latest publisher-submitted, successfully reviewed** commit. UI must say so. A verified GitHub commit signature proves GitHub-side verification semantics, not legal authority over a business or unilateral entitlement rewriting. Publisher cannot change the original escrow digest even if it controls the entire GitHub repo.

## Canonical fixtures
See `fixtures/rulebook_v1.md`, `fixtures/rulebook_v1_typo.md`, `fixtures/rulebook_v2_material.md`, `fixtures/rulebook_v2_ambiguous.md` and `fixtures/publisher_manifest.example.json`. These are **synthetic local tests only**, not public signed GitHub publication records. Live signed commits must be created in a repository controlled by the tester and their URLs recorded as real evidence.
