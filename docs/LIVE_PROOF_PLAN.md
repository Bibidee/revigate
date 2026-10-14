# Real Studionet Acceptance and Proof Plan

Use GenLayer Studionet 61999 only, through the repository-local CLI 0.39.1 and https://studio.genlayer.com/api. The user has authorized unlocked-CLI deployment and lifecycle work. Do not send value to the current pair: the deployed contracts are custody-disabled test candidates and the runtime's incoming-value accounting failure remains unresolved. Do not fabricate transaction hashes, child receipts, browser results, or claimed finality.

## Completed limited proof (2026-10-14)

Current test pair: Registry 0x4EECe12604bC7444e571999D9F92b951Fcc0F740 and Vault 0xB2ce7E67d2A7766Bb62993aDd37636f0163fAAc5. Deployment transactions are 0xa70dae8864a58749081a3379be2cf031736d6d8580ac44756e71f679ad893558 and 0xf8fe9162f92506d643b25166183f52ae0a63b821c918d20485fa60d7b0f3792c. Both finalized with zero value. The deployed Registry and Vault source bytes match their local source SHA256 values recorded in [Two-Contract Migration](TWO_CONTRACT_MIGRATION.md). Read-only configuration confirms reciprocal addresses, chain 61999, and custody disabled. The Registry bind is confirmed by state, but its transaction hash was not captured.

A prior single-contract test proved one 1-wei unknown-offer credit and one EOA withdrawal balance increase. The transfer record remains UNKNOWN_DELIVERY; this proves one success path, not general receipt or recovery. No GEN was sent to the current Registry/Vault pair. Full historic values and reads are in [Studionet evidence](STUDIONET_EVIDENCE.md).

A separate disposable clone of the current contract was given a test-only payable method that credited 1 wei to the ledger and then deliberately failed. The transaction finalized with `value_credited=true`, leader execution `ERROR`/rollback, and the clone retained 1 wei while accounting state was zero. This is a reproduced critical failure. No further variations of this rollback probe are warranted until the custody architecture changes or GenLayer provides an atomicity/recovery guarantee.

A 1-wei no-calldata transfer to the same clone then finalized without GenVM execution and left another wei unaccounted. Studio cannot establish whether a GenLayer Chain `__receive__` handler would execute because Studio does not implement the ghost-contract layer. The current contract remains fail-closed; do not describe a receive handler as a remedy without a chain-supported test.

A 1-wei call carrying value to the nonpayable `create_offer` method also finalized with execution `ERROR` and `value_credited=true`; the disposable clone retained it without a liability. This closes the live T13 attempt as a failure. The three probe transactions and all post-state reads are recorded in [Studionet evidence](STUDIONET_EVIDENCE.md).

Production Vercel was most recently redeployed as dpl_7gc2DA839XWKiZKH1U4mnuHzFNvk to https://the-revigate.vercel.app. The hosted build succeeded and prerendered all 10 routes. All nine app routes were read-only checked at desktop and 390x844 viewport sizes, with expected headings and no page-level horizontal overflow. All publish-page contract action controls are disabled in the deployed build; no contract address is configured. Wallet actions, account switching, transaction recovery, and canonical reads were not exercised. Vercel deployed an uncommitted worktree; this is not a signed release.

An unrelated wallet's live attempt to replace the current Registry's bound Vault finalized with execution ERROR; the binding remained unchanged. This does not prove that another contract cannot impersonate the Registry, nor that an authenticated child message successfully reaches the Vault. An attempted helper contract for those cases failed with invalid_contract/absent_runner_comment.

This remains limited test evidence. No signed-source program verification or two-wallet lifecycle has run. The older single-contract and first-pair candidates described below or in [Studionet evidence](STUDIONET_EVIDENCE.md) are superseded and must not be used.

## Preflight
Verify CLI 0.39.1 as local dependency, target Studionet 61999 (`https://studio.genlayer.com/api`), correct fee profile and sufficient test GEN. Record Git commit SHA and contract source bytes SHA256. Create at least two unlocked/signed test wallets A/B; optionally a third attacker wallet C. Use a controlled public GitHub repository with **genuinely signed, verified** commits and manifest nominating A. Ensure no secrets in git.

## Scenario A — Baseline and normal full payout
- After custody and child-message blockers are resolved in a supported runtime, deploy the final Registry/Vault pair and prove both deployments plus authenticated child finality.
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
- Invalid fund attempt with wrong sender/value and valid `msg.value`: verify actual contract balance and sender-refundable credit or prove the attempt safely rejected without deposit. Direct Mode covers several invalid cases; live payable-error, nonpayable-value, and direct-transfer scenarios all failed accounting. The single-contract escrow is not deployable for user funds on this evidence.
- Attempt failed external transfer where possible safely without real fund risk (Direct Mode plus controlled live boundary), and do not overclaim detection or retry.

## Production browser acceptance

Partial route-only acceptance has been completed on https://the-revigate.vercel.app: all nine application routes rendered at desktop and phone viewport sizes; the expected page headings appeared and no page-level horizontal overflow was observed. The mobile navigation is horizontally scrollable. The release banner says escrow actions are disabled and no production-approved Studionet contract is bound. The production write gate now blocks every contract mutation outside explicit development opt-in.

The remaining acceptance requires a final signed source release and approved contract address, then wallet A/B flows, account/network switching, wallet rejection and provider absence, pending/provisional/finalized/error/readback states, canonical source links, browser logs, refresh recovery and verified recipient delivery. Do not enable funding or withdrawal while custody recovery remains unresolved.

## Evidence table for each transaction
`scenario | actor | contract | function | tx_hash | explorer URL | status | execution result | canonical state readback | before/after GEN value/balance | emitted child/reference | verified recipient credit status | timestamp | exact source commit`.

## Deployment fail conditions
A code change after deployment invalidates prior production certification: redeploy and re-run live evidence, update manifest/website/bindings. Do not claim COMPLETE when unverified money movement, wrong deployed source, failed tests, absent final browser verification, or no relevant live lifecycle.
