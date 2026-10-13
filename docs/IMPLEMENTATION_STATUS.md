# Revigate V1 Implementation Status

**Status: NOT COMPLETE — contract and live custody are not deployed or proven.**

This report records work completed in the local workspace and evidence that exists as of 2026-10-13. A passing local simulation does not prove Studionet behavior.

## Completed locally

- Renamed the product, package, Python project, and contract identity to **Revigate**.
- Added a reproducible JavaScript dependency lock (`package-lock.json`) and Python lock (`uv.lock`). A clean `npm ci` has completed.
- Added a pinned local GenLayer CLI wrapper. The repository-local CLI reports version `0.39.1`; its configured target is Studionet chain `61999` at `https://studio.genlayer.com/api`.
- Implemented the candidate single contract in `contracts/revigate.py`, the SDK-backed browser integration, and UI actions for publisher and participant workflows. The UI intentionally disables contract actions until a verified address is configured; it does not expose credit withdrawal.
- Added CI workflow configuration in `.github/workflows/ci.yml`.
- Local `npm run preflight` passed on 2026-10-13: network guard, TypeScript, ESLint, 5 Node tests, 8 Python accounting tests, 18 GenLayer Direct Mode tests, and a static Next.js production build. The Direct Mode runtime is pinned to GenVM `v0.2.16`, matching the compatible runner bundle.
- The source is committed and pushed to `Bibidee/revigate` on `main`. GitHub Actions run [#3](https://github.com/Bibidee/revigate/actions/runs/38436496897) passed, including clean `npm ci`, Python sync, preflight, and production-only dependency audit.
- The Vercel project `the-revigate` is linked to GitHub. Production deployment is Ready at [the-revigate.vercel.app](https://the-revigate.vercel.app); an unauthenticated HTTP check returned 200 and confirmed the page says the contract is not deployed.
- The production dependency audit passed with zero production dependency vulnerabilities. The development dependency audit still reports advisories.

## Not completed / release blockers

- **No contract compilation/deployment through the GenLayer CLI, Studionet contract address, wallet signature, transaction, or finalized receipt exists.** Direct Mode executes against its local test environment; it is not a deployed-chain test.
- An unlocked local account was observed for the configured CLI, but no transaction was signed or sent. Its presence does not establish adequate deployment funds or any live proof.
- Payable error behavior and recovery, outgoing GEN delivery, recipient balance receipt, and reliable recovery from unknown/failed delivery have not been proved on Studionet. Do not use the candidate contract to custody funds until these pass.
- No two-wallet live lifecycle has been run. The SDK integration has not been exercised with a browser wallet against an actual deployed contract.
- Only 18 Direct Mode test cases exist. The full 52-scenario matrix in `TEST_MATRIX.md`, including the adversarial revision-provenance and consensus cases, has not been completed. T48 has partial pagination coverage, not the full boundary suite.
- No independent production security audit has been completed.
- The full development dependency audit still reports advisories in the ESLint/Next development dependency tree, including braces with no patched release available at audit time. The production-only audit is clear. Do not force a downgrade to an older Next configuration to silence this finding.
- GitHub branch protection is not configured. The local GitHub CLI credential is invalid, and the connected GitHub API exposes no branch-protection write operation in this session.
- The Vercel deployment is a static blueprint only. No contract address is configured, and no wallet actions are available on the live site.

## Release decision

Keep `NEXT_PUBLIC_REVIGATE_CONTRACT` empty and do not announce Revigate as a functioning escrow product until the custody gates, independent audit, complete test matrix, deployed-source verification, two-wallet proof, CI, and frontend verification have actual evidence. A static site may describe the protocol blueprint, but must clearly state that the contract is not deployed and no live programs exist.

See [the test matrix](TEST_MATRIX.md), [the live proof plan](LIVE_PROOF_PLAN.md), [the release checklist](RELEASE_CHECKLIST.md), and [the risk register](RISK_REGISTER.md) for required evidence.
