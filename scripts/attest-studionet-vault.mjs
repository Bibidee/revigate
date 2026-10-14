import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const [address, deploymentHash] = process.argv.slice(2);
if (!/^0x[0-9a-fA-F]{40}$/.test(address ?? "")) {
  throw new Error("Vault address must be a 20-byte 0x address.");
}
if (!/^0x[0-9a-fA-F]{64}$/.test(deploymentHash ?? "")) {
  throw new Error("Deployment transaction must be a 32-byte 0x hash.");
}
if (Number(studionet.id) !== 61999) {
  throw new Error(`GenLayerJS Studionet is ${studionet.id}, expected 61999.`);
}

const client = createClient({
  chain: studionet,
  endpoint: "https://studio.genlayer.com/api",
});
let transaction;
for (let attempt = 0; attempt < 10; attempt += 1) {
  transaction = await client.getTransaction({ hash: deploymentHash });
  if (transaction?.statusName === "FINALIZED") break;
  if (attempt < 9) await new Promise((resolve) => setTimeout(resolve, 3_000));
}
const [deployedSource, config, ledger, localSource] = await Promise.all([
  client.getContractCode(address),
  client.readContract({ address, functionName: "get_config", args: [], jsonSafeReturn: true }),
  client.readContract({ address, functionName: "get_ledger", args: [], jsonSafeReturn: true }),
  readFile(new URL("../contracts/revigate_vault.py", import.meta.url), "utf8"),
]);
const sha256 = (text) => createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex").toUpperCase();
const result = {
  network: "GenLayer Studionet",
  chain_id: Number(studionet.id),
  address,
  deployment: {
    hash: deploymentHash,
    status: transaction?.statusName ?? transaction?.status_name ?? "NOT_RETURNED",
    consensus: transaction?.result_name ?? transaction?.resultName ?? "NOT_RETURNED",
    execution: transaction?.txExecutionResultName ?? "NOT_RETURNED_BY_RPC",
    sender: transaction?.from_address ?? transaction?.sender ?? transaction?.from ?? null,
    value: transaction?.value ?? null,
  },
  source: {
    sha256: sha256(deployedSource),
    local_sha256: sha256(localSource),
    exact_match: deployedSource === localSource,
  },
  config,
  ledger,
};
console.log(JSON.stringify(result, null, 2));

const expectedLedgerFields = [
  "received", "held", "claimable", "transfer_pending", "outgoing_emitted",
  "delivery_verified", "delivery_failed_proven", "recipient_claimed_delivery",
  "unreconciled", "native_balance", "unassigned_surplus", "liability_shortfall",
  "backing_liabilities", "accounted_liabilities", "reconciled_total", "reconciliation_delta",
];
if (transaction?.statusName !== "FINALIZED"
    || !result.source.exact_match
    || Number(config?.chain_id) !== 61999
    || config?.protocol !== "revigate-vault-v1"
    || config?.custody_enabled !== false
    || !/^0x[0-9a-f]{40}$/.test(String(config?.registry).toLowerCase())
    || !expectedLedgerFields.every((field) => BigInt(ledger?.[field]) === 0n)) {
  process.exitCode = 1;
}
