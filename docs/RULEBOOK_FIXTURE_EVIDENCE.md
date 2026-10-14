# Signed rulebook fixture evidence

Recorded 2026-10-14 from GitHub public commit pages and the hosted Registry.

## Current signed public fixture

Repository: https://github.com/Bibidee/revigate
Branch: revigate-rulebook-wallet-a-web
Rulebook path: rules/revigate-v2.md
Manifest path: .revigate/publisher.json
Network chain: 61999
Publisher manifest wallet (Wallet A): 0x4A7D76b8C4668a3426d6d54eC24b41Fa87b532f5

Every listed commit was created through GitHub's web editor and displays the green Verified badge. The old branch and the old 0x527d... signer belong to archived evidence and are not part of this fixture.

| Fixture state | Commit SHA | GitHub evidence |
|---|---|---|
| Baseline | b1c5254617155214e210a39dafd742fd33b102d6 | Verified |
| Nonmaterial editorial marker | ee033cbef9450f58990b01eac77b5949453f2130 | Verified |
| Material eligibility change | ecac64c4f95a527c9f587ab992d6e503d713bb11 | Verified |
| Ambiguous eligibility language | d35d438d0e45e58e3227f95135fa3a2abc523aed | Verified |

The commits form the ancestry used by the Registry. The final commit changes R-01 to: “Participants generally qualify after sufficient participation, subject to exceptional circumstances.” This wording describes the test fixture; it does not predetermine the hosted result.

## Hosted lifecycle on corrected Registry

Registry: 0xFe59b3F7a867B4Aca632b0F40060aACfF8DC36B3
All writes were signed by Wallet A and attached zero native value.

| Step | Transaction | Actual result |
|---|---|---|
| Register baseline | 0xf14863cefa5c8c80526b55f1500cdc111c859f4fa0bfd670f93968a49433aa0b | Program 3 created. |
| Verify baseline | 0x6ee5b6bbb3f67d3971bbe965b7386a542872cc9ba6c1e43bbd0c6b0cfa59f048 | VERIFIED, epoch 1, baseline b1c5254617155214e210a39dafd742fd33b102d6. |
| NONMATERIAL request / assessment | 0xb0747438b5d83667b6aa551093aa9ff66240de0b75587a9d1aa6d0002934c82e / 0x19f9190ef84f8e6e459796dcd7d6b641c5151396cae7945a60efa9c6c083f37c | Actual NONMATERIAL; active SHA ee033cbef9450f58990b01eac77b5949453f2130; epoch 1. |
| MATERIAL request / assessment | 0xd2dee5dbfce5b605aa7003554f25ba483565ecbf95d887120bc675a37614b4a3 / 0x18f4f7327ad2f68e7ac33ec6aa62eccd9013ffcf504ac941e9df5b5fdee74340 | Actual MATERIAL; both source statuses VERIFIED; epoch 2. |
| Ambiguous request | 0x5f19d93b54db9740ffd8f9cc12144632cba4b7553205622a1b970870c9646cd9 | Review 5 created and finalized. |
| Ambiguous assessment | 0xc60c1c640fe1fc9803056e596e61bdfcdee05e60609ded5c7f38b82e163f6956 | Actual MATERIAL; MAJORITY_AGREE; three validators agreed and two were idle after quorum; both sources VERIFIED. |

Review 5 canonical candidate digest: 2cc96aef276627479deb9a9ba9c66b0015a9faaafa28bc9b7805503dd444fb2b. Final Program 3 state is VERIFIED, active SHA d35d438d0e45e58e3227f95135fa3a2abc523aed, epoch 3, material-event count 2, and pending_review 0.

No user funds were accepted. Wallet B (0xFf203Bb65942F50CB81A8AF98c5F5bd9d8a79b54) was not used in this publisher-only cycle.
