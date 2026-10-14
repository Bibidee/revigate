import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { fileURLToPath } from "node:url";
import { encodeAddressArguments } from "../lib/calldata-address.mjs";

const [registryAddress, vaultAddress, walletAddress,
  registrySourcePath = "artifacts/live-message-proof/revigate_registry_probe.py"] = process.argv.slice(2);
for (const [label, address] of [["Registry", registryAddress], ["Vault", vaultAddress], ["Wallet", walletAddress]]) {
  assert.match(address ?? "", /^0x[0-9a-fA-F]{40}$/, `${label} must be a 20-byte 0x address`);
}
assert.equal(Number(studionet.id), 61999, "This read-only proof only runs on Studionet 61999");

const client = createClient({ chain: studionet, endpoint: "https://studio.genlayer.com/api" });
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [deployedRegistry, deployedVault, registrySchema, vaultSchema, registryConfig, vaultConfig,
  localRegistry, localVault] = await Promise.all([
  client.getContractCode(registryAddress),
  client.getContractCode(vaultAddress),
  client.getContractSchema(registryAddress),
  client.getContractSchema(vaultAddress),
  client.readContract({ address: registryAddress, functionName: "get_config", args: [], jsonSafeReturn: true }),
  client.readContract({ address: vaultAddress, functionName: "get_config", args: [], jsonSafeReturn: true }),
  readFile(resolve(root, registrySourcePath), "utf8"),
  readFile(resolve(root, "contracts/revigate_vault.py"), "utf8"),
]);

const argType = (schema, method, index) => schema.methods[method]?.params?.[index]?.[1];
assert.equal(registrySchema.methods.bind_vault.params[0][1], "address");
assert.equal(registrySchema.methods.get_acknowledgment.params[1][1], "address");
assert.equal(vaultSchema.ctor.params[0][1], "address");
assert.equal(argType(vaultSchema, "register_program_snapshot", 3), "address");
assert.equal(argType(vaultSchema, "register_offer", 1), "address");
assert.equal(argType(vaultSchema, "get_wallet_offer_page", 0), "address");
assert.equal(Number(registryConfig.chain_id), 61999);
assert.equal(Number(vaultConfig.chain_id), 61999);
assert.equal(registryConfig.vault.toLowerCase(), vaultAddress.toLowerCase());
assert.equal(vaultConfig.registry.toLowerCase(), registryAddress.toLowerCase());
assert.equal(registryConfig.custody_enabled, false);
assert.equal(vaultConfig.custody_enabled, false);
assert.equal(deployedRegistry, localRegistry, "deployed test Registry must match its generated source");
assert.equal(deployedVault, localVault, "deployed Vault must match the repository source");

const [acknowledgment, offerPage] = await Promise.all([
  client.readContract({
    address: registryAddress,
    functionName: "get_acknowledgment",
    args: encodeAddressArguments("get_acknowledgment", [0n, walletAddress]),
    jsonSafeReturn: true,
  }),
  client.readContract({
    address: vaultAddress,
    functionName: "get_wallet_offer_page",
    args: encodeAddressArguments("get_wallet_offer_page", [walletAddress, 0n, 20n]),
    jsonSafeReturn: true,
  }),
]);

console.log(JSON.stringify({
  chain_id: Number(studionet.id),
  registry: registryAddress,
  vault: vaultAddress,
  constructor_and_method_address_types: "verified",
  reciprocal_custody_disabled_pair: true,
  registry_source_sha256: createHash("sha256").update(deployedRegistry, "utf8").digest("hex").toUpperCase(),
  vault_source_sha256: createHash("sha256").update(deployedVault, "utf8").digest("hex").toUpperCase(),
  address_encoded_reads_succeeded: true,
  acknowledgment_is_dict: acknowledgment !== null && typeof acknowledgment === "object",
  wallet_offer_page_is_dict: offerPage !== null && typeof offerPage === "object",
}, null, 2));
