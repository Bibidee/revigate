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

The exact noncustodial source was deployed with zero value to Studionet at `0x2E2065063b63F305512Ee66F0FEb305557c9143b`. Deployment transaction `0x89a3c601c97d936b5a068f3d62a5d623057f5d8349ca983fe871df9c300c94a6` finalized with majority agreement, successful execution and five `AGREE` votes. Deployed source SHA-256 `99DB611FC5552F26F22DC3DECC9F7A7676C0A676AD587D593D62792EDEE73064` matches `contracts/revigate.py` byte-for-byte. Canonical `get_config()` returned chain `61999`, version `4`, custody `NONE`, escrow `NONE`, and transfer evidence `NONE`.

The local frontend is bound to this test Registry. Only zero-value Registry actions are available; no user funds are accepted, and the historical escrow deployment is not rebound to the new source.

Wallet A / publisher: `0x4A7D76b8C4668a3426d6d54eC24b41Fa87b532f5`.
Wallet B / participant: `0xFf203Bb65942F50CB81A8AF98c5F5bd9d8a79b54`.
Unlocked deployer used for disposable tests only: `0x527dA5f7022f14f7105E5f06cEc1a8EFf53556b5`.

## Remaining gates

1. Complete browser wallet rejection, mobile, pending/unknown and refresh checks against the promoted build. Computer Use could not safely inspect the current Brave URL, so this remains unverified.
2. Obtain a genuinely independent security review; the existing audit is self-audit.
3. Obtain a second approved PR review.
4. Obtain explicit approval before merging into `main`.

The V4 hosted lifecycle is now complete. Registration, source verification, NONMATERIAL, MATERIAL, ambiguous, acknowledgment and reaffirmation all finalized successfully with zero value. Final program state is VERIFIED at epoch 3 with no pending review.

The corrected frontend was promoted to `https://the-revigate.vercel.app` from commit `d73c78f37ba7240fbadea06d435b7a3550e36e38`; the Vercel build passed `npm ci`, TypeScript and the production build. A public HTTP read returned 200 and the deployed JavaScript bundle contains the V4 Registry address. Runtime browser disappearance of the identity warning remains unverified because the browser safety check stopped before reading the live tab.

Funded escrow scenarios are removed from the active product. They are not pending implementation work because the runtime evidence makes native custody unsafe.

## Release verdict

**NOT RELEASED.** The custody blocker is addressed by removing native custody, and the replacement source is deployed, exactly attested and promoted. Independent review, second approval and fresh real-browser verification remain open. No user funds are accepted.
