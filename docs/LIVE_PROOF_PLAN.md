# Real Studionet Acceptance and Proof Plan

All real transactions require authorized funded test wallets. No fabricated tx hashes, CI screenshots, browser results or claimed finality. User signatures and paid deployments must be explicitly authorized in the executing Codex session.

## Preflight
Verify CLI 0.39.1 as local dependency, target Studionet 61999 (`https://studio.genlayer.com/api`), correct fee profile and sufficient test GEN. Record Git commit SHA and contract source bytes SHA256. Create at least two unlocked/signed test wallets A/B; optionally a third attacker wallet C. Use a controlled public GitHub repository with **genuinely signed, verified** commits and manifest nominating A. Ensure no secrets in git.

## Scenario A — Baseline and normal full payout
- Deploy final contract and prove successful `FINALIZED` + execution result.
- A proposes/validates program with GitHub baseline SHA; record source digest/epoch 1.
- A creates separate named offer for B with 0.01 or other specifically authorized test GEN, deadline and 20% early exit policy; verify no value transferred during offer creation.
- A funds exactly; confirm finalized contract readback and actual held ledger.
- B acknowledges and accepts exact frozen rules; try A/third wallet acceptance negative tests.
- Advance or set realistic maturity without faking network time, then B claims allocation of 100%; B withdraws; verify actual recipient balance or child transaction independently. Record all transaction IDs, observed confirmations and any unknown-delivery gaps.

## Scenario B — Nonmaterial revision
Using a second funded accepted offer (or program state without changing a resolved offer), A submits signed typo-only candidate SHA. Review in separate tx; expect NONMATERIAL and unchanged epoch. Previously acknowledged B remains current; funding/maturity terms untouched.

## Scenario C — Material revision and early exit
Create a fresh funded accepted B offer; A requests a signed candidate that changes qualification from 14 to 60 days. GenLayer yields MATERIAL and epoch increments exactly once. The previous acknowledgment is stale, but original GEN maturity entitlement unchanged. B exercises the explicitly frozen 20% early exit within window: credit 20% to B and 80% to A. Both withdraw and confirm real delivery independently, no other party can withdraw. Confirm no second payout after eventual maturity.

## Scenario D — Indeterminate evidence + failure recovery
- Authentic source inaccessible, unsigned or malformed. A typed semantic inconclusive may finalize without epoch change; or an actual protocol failure leaves previously finalized PENDING request intact.
- Wait real 24h network time or use Direct Mode clock controls for automated deadline tests; invoke deterministic expiry, confirm old rules remain active and B's already accepted mature claim was never blocked.
- Do not falsify passage of time or mine fake Studionet blocks.

## Scenario E — Refund and mutual closure
- Fresh A funded unaccepted offer, B declines or acceptance expires; A gets exact credit and real refund.
- Fresh accepted offer, A proposes different closure split; B rejects/ignores, proposal expires and B still claims full maturity amount. If both approve exact digest, split executes once and is verified.

## Scenario F — Malicious/invalid funding
- Invalid fund attempt with wrong sender/value and valid `msg.value`: verify actual contract balance and sender-refundable credit or prove the attempt safely rejected without deposit. Test duplicate deposit and errors. If value enters contract but cannot be recovered, mark release NOT COMPLETE.
- Attempt failed external transfer where possible safely without real fund risk (Direct Mode plus controlled live boundary), and do not overclaim detection or retry.

## Production browser acceptance
After deployment, configure frontend only to new contract, deploy to Vercel, load actual pages at 1440x900 and 390x844, exercise wallet A/B flows, pending/provisional/finalized/error/readback states, canonical source links and all routes. Confirm network display, exact contract address, browser logs, mobile layout, wallet reconnect and transaction recovery after refresh. Real deployment URL and deployment ID required.

## Evidence table for each transaction
`scenario | actor | contract | function | tx_hash | explorer URL | status | execution result | canonical state readback | before/after GEN value/balance | emitted child/reference | verified recipient credit status | timestamp | exact source commit`.

## Deployment fail conditions
A code change after deployment invalidates prior production certification: redeploy and re-run live evidence, update manifest/website/bindings. Do not claim COMPLETE when unverified money movement, wrong deployed source, failed tests, absent final browser verification, or no relevant live lifecycle.
