# Revigate

Revigate is a non-custodial GenLayer application for authenticated public rulebooks, participant acknowledgments and materiality assessments.

## Scope

Revigate records:

- a GitHub repository, fixed rulebook path and publisher manifest;
- genuinely GitHub-verified signed commit identities;
- the active reviewed commit and normalized document digest;
- participant acknowledgments for exact epochs;
- `MATERIAL`, `NONMATERIAL` and `INCONCLUSIVE` revision outcomes; and
- bounded revision and material-event history.

Revigate has no escrow, deposits, offers, token entitlements, refunds, payouts, withdrawals or transfer mechanism. No contract in the active source accepts value. Earlier custody experiments remain available through Git history and explicitly historical evidence documents.

## Active implementation

- `contracts/revigate_registry.py` — sole Intelligent Contract.
- `components/contract-workbench.tsx` and `lib/genlayer.ts` — Registry-only wallet interface.
- `tests/direct/` — source authentication and revision tests.
- `docs/IMPLEMENTATION_STATUS.md` — current release state.

Network: GenLayer Studionet, chain ID `61999`. The app requires a deployed non-custodial Registry v2 before writes are enabled.

## Local checks

```powershell
npm ci
uv sync --frozen
npm run preflight
```

Repository: [Bibidee/revigate](https://github.com/Bibidee/revigate)
