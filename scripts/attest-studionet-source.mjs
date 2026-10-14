import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const [registryAddress, vaultAddress] = process.argv.slice(2);
for (const [label, address] of [["Registry", registryAddress], ["Vault", vaultAddress]]) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address ?? "")) {
    throw new Error(`${label} address must be supplied as a 20-byte 0x address.`);
  }
}

if (Number(studionet.id) !== 61999) {
  throw new Error(`The GenLayerJS Studionet chain definition is ${studionet.id}, expected 61999.`);
}

const client = createClient({
  chain: studionet,
  endpoint: "https://studio.genlayer.com/api",
});
const [deployedRegistry, deployedVault, registryConfig, vaultConfig] = await Promise.all([
  client.getContractCode(registryAddress),
  client.getContractCode(vaultAddress),
  client.readContract({ address: registryAddress, functionName: "get_config", args: [], jsonSafeReturn: true }),
  client.readContract({ address: vaultAddress, functionName: "get_config", args: [], jsonSafeReturn: true }),
]);
const [localRegistry, localVault] = await Promise.all([
  readFile(new URL("../contracts/revigate_registry.py", import.meta.url), "utf8"),
  readFile(new URL("../contracts/revigate_vault.py", import.meta.url), "utf8"),
]);
const sha256 = (text) => createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex").toUpperCase();

const result = {
  network: "GenLayer Studionet",
  chain_id: 61999,
  registry: {
    address: registryAddress,
    sha256: sha256(deployedRegistry),
    matches_local_source: deployedRegistry === localRegistry,
  },
  vault: {
    address: vaultAddress,
    sha256: sha256(deployedVault),
    matches_local_source: deployedVault === localVault,
  },
  registry_config: registryConfig,
  vault_config: vaultConfig,
};
console.log(JSON.stringify(result, null, 2));

if (!result.registry.matches_local_source || !result.vault.matches_local_source
    || Number(registryConfig.chain_id) !== 61999
    || Number(vaultConfig.chain_id) !== 61999
    || registryConfig.vault?.toLowerCase() !== vaultAddress.toLowerCase()
    || vaultConfig.registry?.toLowerCase() !== registryAddress.toLowerCase()
    || registryConfig.custody_enabled !== false
    || vaultConfig.custody_enabled !== false) {
  process.exitCode = 1;
}
