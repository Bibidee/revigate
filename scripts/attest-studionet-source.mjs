import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const [registryAddress] = process.argv.slice(2);
if (!/^0x[0-9a-fA-F]{40}$/.test(registryAddress ?? "")) throw new Error("Supply the Registry address.");
if (Number(studionet.id) !== 61999) throw new Error(`Expected Studionet 61999, got ${studionet.id}.`);
const client = createClient({ chain: studionet, endpoint: "https://studio.genlayer.com/api" });
const [deployed, config, local] = await Promise.all([
  client.getContractCode(registryAddress),
  client.readContract({ address: registryAddress, functionName: "get_config", args: [], jsonSafeReturn: true }),
  readFile(new URL("../contracts/revigate_registry.py", import.meta.url), "utf8"),
]);
const sha256 = (text) => createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex").toUpperCase();
const result = { network: "GenLayer Studionet", chain_id: 61999, address: registryAddress,
  source_sha256: sha256(deployed), matches_local_source: deployed === local, config };
console.log(JSON.stringify(result, null, 2));
if (!result.matches_local_source || Number(config.chain_id) !== 61999
    || config.protocol !== "revigate-registry-v1" || Number(config.contract_version) !== 2
    || config.custody !== "NONE") process.exitCode = 1;
