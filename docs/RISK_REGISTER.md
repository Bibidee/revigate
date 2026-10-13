# Risk Register — Must Be Closed or Explicitly Disclosed

| Risk | Impact | Likelihood / status | Mandatory closure evidence |
|---|---|---|---|
| Payable GenLayer rejection can trap value despite execution error | Critical | Platform behavior reported by referenced Vowmark, **not yet tested on Revigate** | Live invalid funding, balance and refundable-credit proof |
| Outgoing finalized message lacks independently queryable recipient receipt | Critical | Platform/documentation limitation to be investigated | Real B/A EOA balance deltas, child message trace if supported; never use wallet click as receipt |
| Unknown-delivery transfer resent and double pays | Critical | Preventable in contract logic | Unknown delivery state with replay rejection and no blind retries |
| Publisher can rewrite funded benefit through program revision | Critical | Design must prevent | Economic property tests before/after material and nonmaterial revision |
| One contract nondeterministic failure traps funds | Critical | Prevent with separation of request & assessment and unconditional matured claim | Failed consensus + deterministic expiry; matured payout during pending review |
| GitHub commit `verified=true` misunderstood as wallet owner identity | High | Provider verification doesn't bind EVM key | Frozen publisher nomination manifest at signed commit and explicit trust limit |
| GitHub API rate limit/outage yields false NONMATERIAL | High | Possible | Typed uncertainty, no epoch advance, live error fixture |
| Unauthorized wallet accepts/changes split/withdraws | Critical | Preventable | Live C-wallet negative tests and Direct Mode guard tests |
| Stale wallet reads or wrong-chain writes | High | Preventable | Account-switch/race/network tests, 61999 hardcode guard |
| Overlap with Accordant deliverable acceptance | High (product originality) | Design drift risk | Hostile originality matrix, no task completion evaluator |
| Branch HEAD silently changes without review | Medium (freshness) | V1 explicitly doesn't monitor | UI 'latest reviewed commit' and issuer documentation |
| Program accepted while publisher pending revision | Medium | Product rule blocks future accept during request; malicious A can delay | 24h deterministic request expiry; refund and B maturity always available |
| Closure proposal interferes with B's matured claim | High | Preventable | Maturity precedence race tests, closure expiry/cancel checks |
| Actual deployed source differs from reviewed commit | Critical | Deployment verification needed | Finalized `gen_getContractCode` bytes, source hash and commit comparison where supported |
| Signed/verified provider content lacks ancestry/path checks | High | Preventable | Wrong repo, wrong path, sibling SHA and replay negatives |
| LLM leader tricks validators into accepting contradictory materiality | High | Preventable | Independent re-evaluation, consensus-critical exact verdict comparison |
| Future user misreads result as legally enforceable promise | Medium | Scope/copy risk | Disclaimer: onchain financial entitlement only, not automatic off-chain legal rights |

No risk closure may be marked passed based on an architecture document alone. Link runnable tests or finalized actual transactions with exact dates/commits. Platform limitations that prevent a critical funds-safety guarantee mean NOT COMPLETE, not 'complete with limitations'.
