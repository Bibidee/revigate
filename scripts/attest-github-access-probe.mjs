import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const [address] = process.argv.slice(2);
if (!/^0x[0-9a-fA-F]{40}$/.test(address ?? "")) {
  throw new Error("Supply the deployed GitHub access probe address.");
}
if (Number(studionet.id) !== 61999) {
  throw new Error(`Expected Studionet 61999, got ${studionet.id}.`);
}

const client = createClient({
  chain: studionet,
  endpoint: "https://studio.genlayer.com/api",
});
const [deployed, local] = await Promise.all([
  client.getContractCode(address),
  readFile(new URL("../evidence/github-access-diagnostic/github_api_probe.py", import.meta.url), "utf8"),
]);
const sha256 = (source) => createHash("sha256")
  .update(Buffer.from(source, "utf8"))
  .digest("hex")
  .toUpperCase();
const result = {
  network: "GenLayer Studionet",
  chain_id: 61999,
  address,
  local_source_sha256: sha256(local),
  deployed_source_sha256: sha256(deployed),
  matches_local_source: deployed === local,
};
console.log(JSON.stringify(result, null, 2));
if (!result.matches_local_source) process.exitCode = 1;
