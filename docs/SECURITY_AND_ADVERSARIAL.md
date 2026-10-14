# Registry V2 security and adversarial review

## Scope and review independence

This is an adversarial self-audit performed during implementation. It is not a genuinely independent security review. The checked CI workflow does not make independent review a formal gate; an external review remains recommended assurance.

## Protected properties

- Only the program publisher can verify its proposal or request a revision.
- A verified source must be an exact, signed, branch member commit in the declared repository.
- The fixed Git tree blob bytes must match the fetched rulebook and publisher manifest.
- The manifest must nominate the actual publisher wallet on chain 61999.
- A candidate must descend from the active commit, and the stored base digest must still match.
- Invalid, missing, conflicting, malformed, or unavailable evidence resolves to INCONCLUSIVE.
- Semantic output must use the exact changed clause identifiers and a bounded rationale.
- Repeated successful decisions cannot advance state again; inconclusive and expired attempts are capped.
- Writes remain disabled until an on-chain Registry V2 identity readback succeeds.

## Adversarial cases exercised locally

Unsigned or incomplete signature metadata, wrong repository identity, wrong branch ancestry, sibling commits, truncated and oversized provider data, rate limits and access denials, wrong blob bytes, duplicate clauses, malformed documents, unsafe paths, stale acknowledgments, unauthorized callers, same epoch source changes, deadline boundaries, replay, retry exhaustion, pagination pressure, wallet account or chain races, rejected signatures, missing finality evidence, browser refresh recovery, duplicate pending writes, and nonzero transaction value persistence are covered by automated fixtures. The latest local source correction adds tests for provider status classification, sanitized response headers, `Retry-After` and reset timing, bounded backoff, and source-snapshot integrity/reuse.

The rulebook is quoted to the model as untrusted evidence. Model output is type checked and validators compare outcome, commit identities, digests, and changed IDs. Hosted validator disagreement and prompt injection behavior still require live evidence.

## Residual risks

- GitHub availability, API behavior, signature policy, and validator web access can cause INCONCLUSIVE results. On the deployed Registry source, both signed MATERIAL and ambiguous assessments returned INCONCLUSIVE after commit lookups returned HTTP 403. A later source-exact disposable probe reached the same public commit endpoint and GitHub rate-limit endpoint with HTTP 200 and 42 of 60 core requests remaining. This proves the denial was not recurring during the probe, but its historical cause remains unknown. The new Registry provider diagnostics and backoff are local-only until exact-source Registry deployment and hosted verification.
- A GitHub verified signature proves GitHub's verification result; it does not prove legal authority over an organization.
- Semantic materiality remains a judgment result and may disagree or remain undetermined.
- Repository changes are invisible until the publisher submits a signed candidate.
- Nonpayable entry points and zero value application writes do not prevent unsolicited native value at the network level.
- Corrected source `46b7496` is deployed and byte-for-byte attested. Its hosted signed MATERIAL and ambiguous fixtures both produced actual `MATERIAL` outcomes, with canonical state at epoch 3. The ambiguous wording was treated as materially changing eligibility criteria and discretion; this is a model-governed judgment, not a universal semantic guarantee. Fresh CI run `38650041315` for evidence commit `84ce9d8` is green, and `main` branch protection is enabled. The live browser pass covered Wallet A and a read-only Wallet B history query; extension account/network/rejection/disconnect behavior and external review remain unverified.

## Current verdict

NOT RELEASED. Source authentication and the required hosted Registry lifecycle pass. Real wallet-extension flows, hosted prompt-injection and disagreement cases, and independent security review remain open; production writes stay locked.
