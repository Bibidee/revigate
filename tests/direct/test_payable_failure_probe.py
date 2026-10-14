"""Documents that Direct Mode is not rollback evidence for payable failures."""


def test_direct_mode_does_not_rollback_probe_storage_after_exception(direct_deploy, direct_vm):
    direct_vm.check_pickling = True
    direct_vm.value = 1
    contract = direct_deploy("tests/live/payable_failure_probe.py", sdk_version="v0.2.16")

    try:
        with direct_vm.expect_revert("REVIGATE_TEST_PAYABLE_FAILURE"):
            contract.fail_after_receipt()
    finally:
        direct_vm.value = 0

    # Direct Mode preserves this mutation after the raised UserError. That is
    # simulator behavior and cannot establish Studionet rollback semantics.
    assert contract.read_accounting()["recorded"] == 1
