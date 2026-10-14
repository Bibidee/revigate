// Explicit one-off Studionet probe. Never run from preflight or production.
// Deploys an isolated copy of the current contract with one test-only payable
// method, funds a fresh ephemeral test wallet with 1 wei using the pinned CLI,
// then sends exactly 1 wei to the method through GenLayerJS (the CLI write
// command hardcodes value=0). The ephemeral private key stays in this process.

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createAccount, createClient, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rpc = "https://studio.genlayer.com/api";
const cliScript = resolve(projectRoot, "scripts/local-cli.mjs");
const contractSourcePath = resolve(projectRoot, "contracts/revigate.py");
const probeMethod = `

    @gl.public.write.payable
    def probe_failure_after_credit(self) -> bool:
        value = gl.message.value
        if value == u256(0):
            self._fail("REVIGATE_TEST_PROBE_REQUIRES_VALUE")
        self.total_deposited = self.total_deposited + value
        self._credit(self._sender(), value)
        self._fail("REVIGATE_TEST_PAYABLE_FAILURE_AFTER_CREDIT")

    @gl.public.view
    def probe_value_state(self, wallet: str) -> dict:
        return {
            "contract_balance": self.balance,
            "wallet_credit": self.credits.get(wallet.lower(), u256(0)),
            "deposited": self.total_deposited,
            "held": self.total_held,
            "credits": self.total_credits,
            "withdrawn": self.total_withdrawn,
        }
`;

function runCli(args) {
  const result = spawnSync(process.execPath, [cliScript, ...args], {
    cwd: projectRoot,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 20 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) throw result.error;
  return {
    code: result.status ?? 1,
    output: `${result.stdout ?? ""}\n${result.stderr ?? ""}`,
  };
}

function compactCliLines(output) {
  return output.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length < 240 && /error|failed|success|status_name|result_name|execution_result/i.test(line))
    .slice(-12);
}

function transactionHash(output, label) {
  const labeled = output.match(/(?:Deployment Transaction Hash|Transaction Hash|transactionHash)\s*:?\s*['"]?\s*(0x[0-9a-fA-F]{64})/i);
  if (labeled) return labeled[1];
  throw new Error(`${label} returned no transaction hash. ${compactCliLines(output).join(" | ")}`);
}

function contractAddress(output) {
  const match = output.match(/['"]Contract Address['"]\s*:\s*['"](0x[0-9a-fA-F]{40})['"]/i);
  if (!match) throw new Error(`Deployment returned no contract address. ${compactCliLines(output).join(" | ")}`);
  return match[1];
}

function receiptSummary(output) {
  const status = output.match(/status_name:\s*['"]([^'"]+)['"]/i)?.[1] ?? "UNKNOWN";
  const consensus = output.match(/result_name:\s*['"]([^'"]+)['"]/i)?.[1] ?? "UNKNOWN";
  const leaderSection = output.match(/leader_receipt:\s*\[\s*\{([\s\S]*?)\}\s*\]/i)?.[1] ?? "";
  const execution = leaderSection.match(/execution_result:\s*['"]([^'"]+)['"]/i)?.[1] ?? "UNKNOWN";
  return { status, consensus, leaderExecution: execution };
}

function jsonSafe(value) {
  return JSON.parse(JSON.stringify(value, (_key, item) => typeof item === "bigint" ? item.toString() : item));
}

if (!process.argv.includes("--execute")) {
  process.stdout.write("This deploys an isolated Studionet test contract, funds a fresh test wallet with 1 wei, and sends exactly 1 wei in the failure probe. Re-run with --execute only when authorized.\n");
  process.exit(0);
}

const cliManifest = JSON.parse(readFileSync(resolve(projectRoot, "node_modules/genlayer/package.json"), "utf8"));
if (cliManifest.version !== "0.39.1") throw new Error(`Expected repository-local GenLayer CLI 0.39.1, found ${cliManifest.version}.`);

const tempDirectory = mkdtempSync(join(tmpdir(), "revigate-studionet-probe-"));
const probeContractPath = join(tempDirectory, "revigate.py");
const baseContract = readFileSync(contractSourcePath, "utf8");
const probeSource = `${baseContract.trimEnd()}${probeMethod}`;
writeFileSync(probeContractPath, probeSource, { encoding: "utf8", flag: "wx" });
const probeSourceSha256 = createHash("sha256").update(probeSource).digest("hex").toUpperCase();

const deployment = runCli(["deploy", "--contract", probeContractPath, "--rpc", rpc]);
if (deployment.code !== 0) throw new Error(`Disposable probe deployment failed: ${compactCliLines(deployment.output).join(" | ")}`);
const deploymentTx = transactionHash(deployment.output, "Disposable probe deployment");
const probeAddress = contractAddress(deployment.output);
const deployedReceipt = runCli(["receipt", deploymentTx, "--status", "FINALIZED", "--retries", "40", "--interval", "3000", "--rpc", rpc]);
if (deployedReceipt.code !== 0) throw new Error(`Deployment finality read failed: ${compactCliLines(deployedReceipt.output).join(" | ")}`);
const deploymentFinality = receiptSummary(deployedReceipt.output);
if (deploymentFinality.status !== "FINALIZED" || /ERROR|TIMEOUT/i.test(deploymentFinality.leaderExecution)) {
  throw new Error(`Disposable probe deployment ${deploymentTx} at ${probeAddress} did not succeed: ${JSON.stringify(deploymentFinality)}`);
}

const privateKey = generatePrivateKey();
const probeWallet = createAccount(privateKey);
const funding = runCli(["account", "send", probeWallet.address, "1", "--rpc", rpc]);
if (funding.code !== 0 || !/Transfer successful!/i.test(funding.output)) {
  throw new Error(`Funding the ephemeral test wallet failed: ${compactCliLines(funding.output).join(" | ")}`);
}
const fundingTx = transactionHash(funding.output, "Ephemeral wallet funding");

const client = createClient({ chain: studionet, endpoint: rpc, account: probeWallet });
let deploymentIdentity;
try {
  deploymentIdentity = await client.readContract({ address: probeAddress, functionName: "get_config", args: [], jsonSafeReturn: true });
} catch (error) {
  throw new Error(`Disposable probe deployment ${deploymentTx} at ${probeAddress} is not callable: ${error instanceof Error ? error.message : String(error)}`);
}
if (Number(deploymentIdentity.chain_id) !== 61999 || deploymentIdentity.protocol !== "revigate-v1") {
  throw new Error("Disposable contract identity readback did not match the expected Studionet Revigate clone.");
}

async function snapshot() {
  const [walletBalance, probeState] = await Promise.all([
    client.getBalance({ address: probeWallet.address }),
    client.readContract({ address: probeAddress, functionName: "probe_value_state", args: [probeWallet.address], jsonSafeReturn: true }),
  ]);
  return { walletBalance, probeState };
}

const before = await snapshot();
const testTx = await client.writeContract({
  address: probeAddress,
  functionName: "probe_failure_after_credit",
  args: [],
  value: 1n,
});
let failedPayableReceipt;
let receiptWaitError = null;
try {
  failedPayableReceipt = await client.waitForTransactionReceipt({
    hash: testTx,
    status: TransactionStatus.FINALIZED,
    interval: 3000,
    retries: 40,
  });
} catch (error) {
  receiptWaitError = error instanceof Error ? error.message : String(error);
  failedPayableReceipt = await client.getTransaction({ hash: testTx });
}
const after = await snapshot();

const output = {
  probeSourceSha256,
  probeAddress,
  deploymentTransaction: deploymentTx,
  deploymentFinality,
  probeWallet: probeWallet.address,
  walletFundingTransaction: fundingTx,
  walletFundingCliConfirmed: /Transfer successful!/i.test(funding.output),
  failedPayableTransaction: testTx,
  failedPayableReceipt: {
    status: failedPayableReceipt.statusName ?? failedPayableReceipt.status_name ?? "UNKNOWN",
    consensus: failedPayableReceipt.resultName ?? failedPayableReceipt.result_name ?? "UNKNOWN",
    execution: failedPayableReceipt.txExecutionResultName ?? failedPayableReceipt.execution_result ?? "UNKNOWN",
    valueCredited: failedPayableReceipt.value_credited ?? null,
    waitError: receiptWaitError,
  },
  sentValueWei: "1",
  before: jsonSafe(before),
  after: jsonSafe(after),
  walletBalanceDeltaWei: (after.walletBalance - before.walletBalance).toString(),
  contractBalanceDeltaWei: (BigInt(after.probeState.contract_balance) - BigInt(before.probeState.contract_balance)).toString(),
};
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
