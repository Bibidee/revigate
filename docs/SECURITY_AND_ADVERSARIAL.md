# Registry V2 security and adversarial review

## Scope and review independence

This is an adversarial self audit performed during implementation. It is not a genuinely independent security review. Independent review remains a release gate.

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

Unsigned or incomplete signature metadata, wrong repository identity, wrong branch ancestry, sibling commits, truncated and oversized provider data, rate limits, wrong blob bytes, duplicate clauses, malformed documents, unsafe paths, stale acknowledgments, unauthorized callers, same epoch source changes, deadline boundaries, replay, retry exhaustion, pagination pressure, wallet account or chain races, rejected signatures, missing finality evidence, browser refresh recovery, duplicate pending writes, and nonzero transaction value persistence are covered by automated fixtures.

The rulebook is quoted to the model as untrusted evidence. Model output is type checked and validators compare outcome, commit identities, digests, and changed IDs. Hosted validator disagreement and prompt injection behavior still require live evidence.

## Residual risks

- GitHub availability, API behavior, signature policy, and validator web access can cause INCONCLUSIVE results.
- A GitHub verified signature proves GitHub's verification result; it does not prove legal authority over an organization.
- Semantic materiality remains a judgment result and may disagree or remain undetermined.
- Repository changes are invisible until the publisher submits a signed candidate.
- Nonpayable entry points and zero value application writes do not prevent unsolicited native value at the network level.
- Registry V2 source, genuine signed fixtures, hosted lifecycle, real browser wallet behavior, CI, and independent audit are not yet all verified.

## Current verdict

NOT RELEASED. Local engineering gates pass, but source authentication and required live lifecycle gates remain open.
