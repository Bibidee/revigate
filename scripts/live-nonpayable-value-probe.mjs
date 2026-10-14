// One-off Studionet probe for attaching value to a nonpayable contract method.
// Uses an existing disposable clone; never targets the current candidate.
// The fresh wallet is funded with exactly 1 wei, and one call is submitted.

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createAccount, createClient, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rpc = "https://studio.genlayer.com/api";
const cliScript = resolve(projectRoot, "scripts/local-cli.mjs");
const probeAddress = "0x819Ce44739a2ed252B5f45a863cA6e65f4fF7fC3";

function runCli(args) {
  const result = spawnSync(process.execPath, [cliScript, ...args], {
    cwd: projectRoot,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 20 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) throw result.error;
  return { code: result.status ?? 1, output: (result.stdout ?? "") + "\n" + (result.stderr ?? "") };
}

function transactionHash(output, label) {
  const match = output.match(/(?:transactionHash|Transaction Hash)\s*:?\s*[\s\n]*['"]?(0x[0-9a-fA-F]{64})/i);
  if (!match) throw new Error(label + " returned no transaction hash.");
  return match[1];
}

function jsonSafe(value) {
  return JSON.parse(JSON.stringify(value, (_key, item) => typeof item === "bigint" ? item.toString() : item));
}

if (!process.argv.includes("--execute")) {
  process.stdout.write("This sends exactly 1 wei to a disposable contract's nonpayable create_offer method. Add --execute only for the authorized test.\n");
  process.exit(0);
}

const cliManifest = JSON.parse(readFileSync(resolve(projectRoot, "node_modules/genlayer/package.json"), "utf8"));
if (cliManifest.version !== "0.39.1") throw new Error("Expected local GenLayer CLI 0.39.1, found " + cliManifest.version + ".");

const readClient = createClient({ chain: studionet, endpoint: rpc });
const priorState = await readClient.readContract({
  address: probeAddress,
  functionName: "probe_value_state",
  args: ["0x0000000000000000000000000000000000000000"],
  jsonSafeReturn: true,
});
if (BigInt(priorState.contract_balance) !== 2n) {
  throw new Error("Refusing to fund or submit: this one-off probe expects the clone's pre-call balance to be exactly 2 wei.");
}

const wallet = createAccount(generatePrivateKey());
const funding = runCli(["account", "send", wallet.address, "1", "--rpc", rpc]);
if (funding.code !== 0 || !/Transfer successful!/i.test(funding.output)) {
  throw new Error("Funding the ephemeral test wallet with 1 wei failed.");
}
const fundingTx = transactionHash(funding.output, "Funding transaction");

const client = createClient({ chain: studionet, endpoint: rpc, account: wallet });
const before = {
  walletBalance: await client.getBalance({ address: wallet.address }),
  probeState: await client.readContract({
    address: probeAddress,
    functionName: "probe_value_state",
    args: [wallet.address],
    jsonSafeReturn: true,
  }),
};

let testTx;
let submissionError = null;
try {
  testTx = await client.writeContract({
    address: probeAddress,
    functionName: "create_offer",
    args: [999999n, wallet.address, 1n, 1n, 2n, 3n, 2000n, 3600n],
    value: 1n,
  });
} catch (error) {
  submissionError = error instanceof Error ? error.message : String(error);
}

if (!testTx) {
  process.stdout.write(JSON.stringify({
    probeAddress,
    wallet: wallet.address,
    fundingTransaction: fundingTx,
    sentValueWei: "1",
    submitted: false,
    submissionError,
    before: jsonSafe(before),
  }, null, 2) + "\n");
  process.exit(0);
}

let receipt;
let receiptWaitError = null;
try {
  receipt = await client.waitForTransactionReceipt({
    hash: testTx,
    status: TransactionStatus.FINALIZED,
    interval: 3000,
    retries: 40,
  });
} catch (error) {
  receiptWaitError = error instanceof Error ? error.message : String(error);
  receipt = await client.getTransaction({ hash: testTx });
}

const after = {
  walletBalance: await client.getBalance({ address: wallet.address }),
  probeState: await client.readContract({
    address: probeAddress,
    functionName: "probe_value_state",
    args: [wallet.address],
    jsonSafeReturn: true,
  }),
};
const raw = await client.getTransaction({ hash: testTx });
process.stdout.write(JSON.stringify({
  probeAddress,
  wallet: wallet.address,
  fundingTransaction: fundingTx,
  nonpayableTransaction: testTx,
  receipt: {
    status: receipt.statusName ?? raw.statusName ?? "UNKNOWN",
    result: raw.result_name ?? "UNKNOWN",
    execution: raw.txExecutionResultName ?? raw.consensus_data?.leader_receipt?.[0]?.execution_result ?? "UNKNOWN",
    valueCredited: raw.value_credited ?? null,
    requestedValueWei: raw.value === undefined ? "UNKNOWN" : String(raw.value),
    waitError: receiptWaitError,
  },
  before: jsonSafe(before),
  after: jsonSafe(after),
  walletBalanceDeltaWei: (after.walletBalance - before.walletBalance).toString(),
  contractBalanceDeltaWei: (
    BigInt(after.probeState.contract_balance) - BigInt(before.probeState.contract_balance)
  ).toString(),
}, (_key, value) => typeof value === "bigint" ? value.toString() : value, 2) + "\n");
