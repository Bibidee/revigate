# Revigate

Revigate is one GenLayer Studionet application and one source-attested Intelligent Contract. The contract combines authenticated GitHub rulebooks, GenLayer materiality consensus, participant acknowledgments, and a deploy-gated native GEN agreement ledger.

## Current contract

- Source: `contracts/revigate.py`
- Network: GenLayer Studionet, chain `61999`
- Protocol: `revigate-registry-v1`
- Contract version: `5`
- Financial mode: constructor-gated `SINGLE_CONTRACT_ESCROW`
- Current V5 deployment: `0xb77DF392fFE9bFc93Ab9Fd79D7a26400dB3c3684`
- Current constructor configuration: `custody_enabled=true`, `public_custody=false`
- Current source SHA-256: `ED52C6BC82B9A4990DB2A0FC9C6D2C531C0CAEF76BD013124D18CBD0705C6A88`

The current deployment is a disposable source-attested Studionet test target. Its frontend financial controls remain locked because `public_custody=false`, while the contract's controlled financial methods are governed by `custody_enabled=true`. The two-material-revision funded regression has now finalized on this address: a 555 wei controlled offer was funded and accepted, a later signed MATERIAL event advanced the program to epoch 3, and the participant material exit allocated 444 wei to the publisher and 111 wei to the participant. No withdrawal was submitted and no user funds are accepted.

The earlier `public_custody=true` funded demonstration remains historical evidence only. It must not be read as the current deployment or as production custody approval; see [the historical public-enabled evidence](evidence/single-contract/2026-10-16-public-enabled-funded-demo.json).

The supported payable route accounts value before validation and returns typed outcomes for invalid offer, sender, deadline, amount and duplicate cases. Withdrawals consume credit once and create a pending external-settlement record. The demo observed exact recipient balance deltas, but the runtime did not expose a separately verifiable child transaction identity/finality record. Unsolicited no-calldata transfers, value sent to unsupported methods and failed external delivery remain protocol-level hazards.

## Local checks

```powershell
npm ci
uv sync --frozen
npm run preflight
```

Repository: [Bibidee/revigate](https://github.com/Bibidee/revigate)
