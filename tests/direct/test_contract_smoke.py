"""Smoke tests that load the production source in GenLayer Direct Mode."""

def test_contract_loads_and_reports_studionet_config(direct_deploy):
    contract = direct_deploy("contracts/revigate.py")

    config = contract.get_config()
    assert config["chain_id"] == 61999
    assert config["protocol"] == "revigate-v1"
