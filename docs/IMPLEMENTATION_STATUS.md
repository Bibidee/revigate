# Implementation status

Recorded 2026-10-15 after removing native custody from the active release.

## Active architecture

`contracts/revigate.py` is the noncustodial Revigate Registry. It authenticates GitHub rulebooks, records wallet acknowledgments and runs revision materiality assessment. It has no payable entry point, offer state, native-value ledger, wallet credit or withdrawal method. `contracts/archive/` retains the former escrow sources only as historical evidence.

`get_config()` reports protocol `revigate-registry-v1`, chain `61999`, version `4`, custody `NONE`, escrow `NONE`, and transfer evidence `NONE`. The frontend rejects any other identity and every active write sends zero native GEN.

## Local verification

- JavaScript: 23 passing.
- Direct Mode: **43 passing** after the custody redesign.
- TypeScript: **passing**.
- ESLint: **passing**.
- Production build: **passing**.
- The new Direct Mode checks assert the noncustodial config, absence of payable and escrow methods, authenticated rulebook writes and acknowledgment state.

These checks do not prove hosted consensus. They do prove that the active source no longer exposes the unsafe custody surface.

## Historical custody evidence

The former Studionet escrow deployment `0xD86A6C0a3949D2452bB8964e076983254375b5fE` and its probes remain historical only. Studionet retained attached value when payable execution failed and also retained value on unsupported incoming routes. Its outgoing child transfer could not be objectively classified from the available RPC. Do not send funds to that address or any Registry address.

## Deployment state

The noncustodial source has been changed locally but is not yet deployed or source-attested. It must be deployed as a disposable zero-value Studionet test contract before hosted Registry lifecycle evidence is refreshed. No user funds are accepted, production writes remain locked, and the old escrow deployment is not rebound to the new source.

Wallet A / publisher: `0x4A7D76b8C4668a3426d6d54eC24b41Fa87b532f5`.
Wallet B / participant: `0xFf203Bb65942F50CB81A8AF98c5F5bd9d8a79b54`.
Unlocked deployer used for disposable tests only: `0x527dA5f7022f14f7105E5f06cEc1a8EFf53556b5`.

## Remaining gates

1. Run local checks, deploy the exact committed source to Studionet with zero value and record address, transaction, receipt and byte-for-byte source attestation.
2. Refresh hosted zero-value Registry registration, verification, NONMATERIAL, MATERIAL, ambiguous and acknowledgment evidence against that new address.
3. Complete remaining browser wallet rejection, mobile, pending/unknown and refresh checks for the corrected build.
4. Obtain an independent security review and a second approved PR review.
5. Obtain explicit authorization before production promotion or merge into `main`.

Funded escrow scenarios are removed from the active product. They are not pending implementation work because the runtime evidence makes native custody unsafe.

## Release verdict

**NOT RELEASED.** The custody blocker is addressed in code by removing native custody, but the replacement source still needs local verification, disposable deployment, exact attestation and refreshed hosted lifecycle evidence.
