"""Smoke tests that load the production source in GenLayer Direct Mode."""

def test_contract_loads_and_reports_studionet_config(direct_deploy, direct_vm):
    direct_vm.check_pickling = True
    contract = direct_deploy("contracts/revigate.py", sdk_version="v0.2.16")

    config = contract.get_config()
    assert config["chain_id"] == 61999
    assert config["protocol"] == "revigate-v1"
