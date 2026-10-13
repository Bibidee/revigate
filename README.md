# Revigate V1

Revigate is a backendless GenLayer application for versioned program rules and participant-specific GEN entitlements. The product name, npm package, Python project, and contract are named `revigate`.

## Release status

**NOT COMPLETE.** The Revigate blueprint is published at [the-revigate.vercel.app](https://the-revigate.vercel.app); it explicitly states that the contract is not deployed and no live programs exist. The contract has not been compiled/deployed to Studionet, and the frontend has no verified address, so contract actions remain locked. No wallet signature, contract transaction, address, or live two-wallet lifecycle has been produced.

Outgoing GEN delivery and failure recovery remain a release-blocking custody question. The contract records an outgoing transfer as `UNKNOWN_DELIVERY`; the frontend deliberately does not expose withdrawal. A passing local test cannot prove recipient receipt on Studionet. Do not use this candidate to hold user funds.

## Repository layout

- `contracts/revigate.py`: single-contract implementation candidate.
- `components/contract-workbench.tsx`, `lib/genlayer.ts`: browser wallet, GenLayerJS reads/writes, finality observation, and recovery by the same transaction hash.
- `protocol/accounting.py`: reference accounting model, not production custody logic.
- `tests/direct/`: GenLayer Direct Mode tests against the contract source.
- `docs/`: product constraints, risk register, release gates, and current evidence.
- `.github/workflows/ci.yml`: reproducible Node/Python checks for pushes and pull requests.

## Network and toolchain

- Studionet only: chain ID `61999`, RPC `https://studio.genlayer.com/api`.
- Repository-local GenLayer CLI is pinned to `0.39.1`; the `npm run cli` wrapper refuses parent or global binaries.
- GenLayerJS is pinned to `1.1.8` and its Studionet chain definition is used for browser access.
- Node.js 20+ and Python 3.12+ are required.

## Local checks

```powershell
npm ci
uv sync --frozen
npm run preflight
npm audit --omit=dev --audit-level=high
npm run cli -- --version
npm run cli -- network info
```

`npm run preflight` checks the network lock, TypeScript, ESLint, Node helpers, the Python accounting model, GenLayer Direct Mode, and the static production build. It does not replace the live Studionet custody proofs, the full 52-scenario matrix, or an independent production audit.

## Deployment gates

The source is pushed to [GitHub](https://github.com/Bibidee/revigate), and CI has completed a green run. Vercel is connected to the repository and the public blueprint is live at [the-revigate.vercel.app](https://the-revigate.vercel.app). **The contract is not deployed.** Contract release remains blocked until compiler/source checks, the full adversarial matrix, independent audit, payable failure behavior, external transfer evidence/recovery, and live two-wallet tests pass. Read [the current evidence and open gates](docs/IMPLEMENTATION_STATUS.md) before any contract deployment.
