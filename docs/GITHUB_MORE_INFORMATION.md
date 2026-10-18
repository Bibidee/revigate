# Revigate — Additional GitHub Information

## What Revigate is

Revigate is a source-attested GenLayer Studionet application. Its single Intelligent Contract combines:

- GitHub rulebook authentication;
- GenLayer materiality consensus;
- participant acknowledgments and revision epochs; and
- a constructor-gated agreement ledger for disposable Studionet tests.

Repository: <https://github.com/Bibidee/revigate>

Network: **GenLayer Studionet**, chain ID `61999`

Current V5 test deployment: `0xb77DF392fFE9bFc93Ab9Fd79D7a26400dB3c3684`

Current constructor configuration:

- `custody_enabled = true`
- `public_custody = false`

The deployment is a controlled test target. Public custody is disabled and no production user funds are accepted.

## Material-exit issue resolution

The material-exit path previously risked reusing the program's historical first material timestamp. That could make a later material event appear to have an already expired exit window.

The current contract resolves this with `_first_material_after(program, epoch)` in [`contracts/revigate.py`](../contracts/revigate.py). The helper scans the ordered material-event history and selects the first event whose epoch is strictly greater than the offer's acknowledged epoch.

`exercise_material_exit` then derives the exit deadline from that event's timestamp:

```text
exit_deadline = min(selected_event.at + offer.exit_window, offer.maturity)
```

This preserves the event that actually made the later exit available.

## Regression proof

The Direct Mode regression is in [`tests/direct/test_escrow.py`](../tests/direct/test_escrow.py):

`test_material_exit_uses_later_event_timestamp_after_acknowledged_epoch`

The test creates two material events:

1. The first event is before the offer's acknowledged epoch and its one-hour window is allowed to expire.
2. A second material event is recorded after the acknowledged epoch.
3. The participant exercises the exit inside the second event's one-hour window.
4. The test verifies that the exit trigger is epoch `3` and that the deadline uses the second event's timestamp.

The test also verifies the 20% participant allocation and 80% publisher allocation for a 101 wei offer.

## Hosted Studionet evidence

The controlled funded regression is recorded in [`evidence/single-contract/2026-10-18-v5-two-material-funded-regression.json`](../evidence/single-contract/2026-10-18-v5-two-material-funded-regression.json).

Observed values:

| Field | Result |
| --- | --- |
| Offer amount | 555 wei |
| Acknowledged epoch | 2 |
| First material event | epoch 2 at `1792307579` |
| First event window end | `1792311179` |
| Later material event | epoch 3 at `1792311710` |
| Later event exit deadline | `1792315310` |
| Final offer state | `MATERIAL_EXIT_ALLOCATED` |
| Publisher allocation | 444 wei |
| Participant allocation | 111 wei |
| Held amount after exit | 0 wei |
| Deposited/accounted amount | 555 wei |
| Contract native balance | 555 wei |

Relevant finalized transactions:

- Funding: `0xbcaee2528003301469262f070a5e7e9222758894316ff1045f88a5374af24375`
- Acceptance: `0xb684349159f5c694391d771e3d92568185b015d8945003b11d9bc49d4f40ce03`
- Second revision request: `0x67c08421f1ca2f71a902ca0a7b314dd22d72c58d92ebbe6c867f0610141e4861`
- Second revision assessment: `0x3cf33c069c720825cf40454c0451a2712fd8d2aab2ecf2a4ff055fb03c31bb8e`
- Material exit: `0x6f285a9ad5a729a30d07c9f7000694b39caec7c3ed70bbdcd2cd61c74ebc49d1`

The ledger reconciled as:

```text
held + credits + dispatched = accounted = deposited
0    + 555     + 0          = 555       = 555
```

No withdrawal was submitted in this regression, so it does not claim independently verified external transfer delivery.

## Verification performed

The merged release evidence includes:

- JavaScript tests: 23 passing;
- Direct Mode tests: 47 passing;
- TypeScript typecheck: passing;
- lint: passing;
- production build: passing;
- JSON validation: passing; and
- `git diff --check`: passing.

The evidence update was merged through [PR #11](https://github.com/Bibidee/revigate/pull/11).

## Safety boundary

This evidence proves the corrected material-event selection and the deterministic ledger allocation for a controlled disposable Studionet test. It does **not** prove:

- atomic recovery for every failed payable call;
- recovery of unsolicited no-calldata or wrong-method native transfers;
- separately verifiable child transaction identity and finality; or
- production custody safety.

The frontend remains public-custody locked. Do not send production funds to the deployment.
