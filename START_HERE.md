# REVIGATE V1 — CODEX IMPLEMENTATION HANDOFF

**Handoff status:** fully specified proposed V1, **not an implemented/deployed application**. This bundle intentionally contains authoritative design, engineering, fixtures and release gates, not fake production source or a fabricated deployment. The user will invoke Codex using `CODEX_BUILD_PROMPT.txt` when ready to authorize implementation. Original prior approval gate for building was `GO AHEAD`; generating this package does not itself deploy anything.

## Reading order (mandatory for Codex)
1. `CODEX_BUILD_PROMPT.txt` — binding execution mandate
2. `PRODUCT_SPEC.md` — purpose, originality and user journeys
3. `docs/DECISIONS_AND_GATES.md` — locked decisions and honest blockers
4. `docs/CONTRACT_API_AND_DATA.md` — required records, methods, indexing and permissions
5. `docs/STATE_MACHINES.md` — precise phase transitions
6. `docs/ESCROW_AND_ACCOUNTING.md` — economic rights and invariants
7. `docs/RULEBOOK_PROVENANCE.md` — GitHub evidence, ownership caveats and publication model
8. `docs/CONSENSUS_AND_JUDGMENT.md` — real GenLayer validator work
9. `docs/FAILURE_AND_FINALITY.md` — hardest network and money failure cases
10. `docs/SECURITY_AND_ADVERSARIAL.md` — threat model
11. `docs/FRONTEND_UX.md` — complete frontend
12. `docs/TEST_MATRIX.md`, `docs/LIVE_PROOF_PLAN.md`, `docs/RELEASE_CHECKLIST.md`
13. `docs/BUILD_BLUEPRINT.md`, `docs/ACCEPTANCE_EXAMPLES.md`, `docs/RISK_REGISTER.md`, `docs/ORIGINALITY_AND_REFERENCES.md`, example fixtures

## Product in one sentence
Revigate is a backendless GenLayer rulebook versioning and **participant-entitlement escrow** protocol: a publisher registers publicly authenticated program rules, backs a participant-specific entitlement with GEN, the participant acknowledges immutable terms, and GenLayer validators independently judge material rule changes while the old financial commitment remains protected.

## Locked constraints
- GenLayer Studionet ONLY, chain **61999**; RPC `https://studio.genlayer.com/api`; explorer `https://explorer-studio.genlayer.com`.
- Pin **repository-local GenLayer CLI 0.39.1**. Do not silently update to a later stable or RC or use a global CLI. Confirm live compatibility; report a blocker if incompatible.
- Next.js App Router, TypeScript, injected EIP-1193 wallet, no application backend, no off-chain authority, no private key in browser or repository.
- Prefer **one Intelligent Contract** for program, revision and escrow, **unless an empirically demonstrated custody risk warrants a split**. No architectural changes merely for elegance.
- Wallet A = publisher and sole funder of a named offer. Wallet B = designated participant and sole acceptor/claimant. One publisher may issue numerous independently bound offers.
- Financial entitlement and cash splits are frozen upon signed acceptance; no publisher override. GenLayer semantic judgment decides **materiality of revisions**, not whether the participant completed subjective work.
- Permissionless deadline recovery for persisted on-chain requests. No claim that consensus-failed writes persist.
- `ACCEPTED` is provisional. A finalized protocol status does not by itself prove successful execution or recipient credit.
- **Actual successful recipient delivery and failure handling are release-blocking feasibility proofs.** Do not call an emitted transfer or user click a verified receipt.

## Non-goals
Do not build generic task escrow, GitHub fix bounty, freelance acceptance marketplace, dispute arbitration court, token exchange, staking duel, governance voting app or Vowmark promise bond. Do not copy source/UI/prompt language from Patchbound, Crossbench, Vowmark or Accordant.

## One important implementation instruction
Prior documents were high-level conversation design, not executed GenVM verification. This handoff converts them into a **target specification** with explicit *feasibility gates*. If the exact network cannot support an important required guarantee, **do not fabricate an implementation or downgrade safety**. Implement defensively, demonstrate test results, and label blocked objectives. Never report `COMPLETE` while escrow guarantees remain unverified.
