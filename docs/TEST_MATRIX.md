# Test matrix status

The local suite currently passes 23 JavaScript tests and 52 Direct Mode tests.
The Direct Mode tests now target the single active `contracts/revigate.py` and
cover rulebook authentication, revision states, funding validation,
refundable credits, acceptance, refunds, exits, maturity, mutual closure,
withdrawal accounting and bounded pages.

The hosted 52-scenario matrix is **OPEN**. Browser wallet extension rejection,
network/account switching, pending and unknown finality, refresh recovery,
source-attested hosted revision outcomes, payable failure recovery, outbound
transfer delivery, recipient balance deltas and independent review still need
fresh evidence against the new deployment. Local tests use mocks and cannot
substitute for those hosted results.

No production funds were accepted. Production writes remain locked.
