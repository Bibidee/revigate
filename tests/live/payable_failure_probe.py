"""Disposable Studionet probe for failed value-only receipt behavior.

This intentionally failing contract is never used by the application. Deploy only
to an isolated test network, send the minimum test value, and discard the address.
"""

# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


class PayableFailureProbe(gl.Contract):
    received: u256

    def __init__(self):
        self.received = u256(0)

    @gl.public.write.payable
    def fail_after_receipt(self) -> bool:
        self.received = self.received + gl.message.value
        raise gl.vm.UserError("REVIGATE_TEST_PAYABLE_FAILURE")

    @gl.public.view
    def read_accounting(self) -> dict:
        return {"recorded": self.received, "contract_balance": self.balance}
