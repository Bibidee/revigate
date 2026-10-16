# Revigate

Revigate is one GenLayer Studionet application and one source-attested Intelligent Contract. The contract combines authenticated GitHub rulebooks, GenLayer materiality consensus, participant acknowledgments, and a deploy-gated native GEN agreement ledger.

## Current contract

- Source: `contracts/revigate.py`
- Network: GenLayer Studionet, chain `61999`
- Protocol: `revigate-registry-v1`
- Contract version: `5`
- Financial mode: constructor-gated `SINGLE_CONTRACT_ESCROW`
- Current test mode: a disposable source-attested Studionet deployment has `public_custody=true`; this is not production approval and does not prevent unsolicited network transfers

A fresh public-enabled Studionet test deployment completed signed source verification, funded acceptance, an actual MATERIAL revision, participant reaffirmation, material exit allocation and one withdrawal per controlled wallet. The exact address, receipts and canonical readbacks are in [the public-enabled funded demo evidence](evidence/single-contract/2026-10-16-public-enabled-funded-demo.json). No user funds are accepted.

The supported payable route accounts value before validation and returns typed outcomes for invalid offer, sender, deadline, amount and duplicate cases. Withdrawals consume credit once and create a pending external-settlement record. The demo observed exact recipient balance deltas, but the runtime did not expose a separately verifiable child transaction identity/finality record. Unsolicited no-calldata transfers, value sent to unsupported methods and failed external delivery remain protocol-level hazards.

## Local checks

```powershell
npm ci
uv sync --frozen
npm run preflight
```

Repository: [Bibidee/revigate](https://github.com/Bibidee/revigate)
