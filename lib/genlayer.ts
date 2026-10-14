import { createClient } from "genlayer-js";
import { encodeAddressArguments } from "./calldata-address.mjs";
import { studionet } from "genlayer-js/chains";
import type { Address, CalldataEncodable, GenLayerTransaction, Hash } from "genlayer-js/types";
import { classifyOutgoingTransfer } from "./transfer-evidence.mjs";
import { classifyTransactionFinality } from "./wallet-session.mjs";
import { pendingStorageKey, loadPendingTransactions as readPendingTransactions,
  savePendingTransaction as writePendingTransaction, forgetPendingTransaction as deletePendingTransaction } from "./pending-storage.mjs";
import { makeWriteRequest } from "./write-request.mjs";
export type { Hash } from "genlayer-js/types";

export const STUDIONET_CHAIN_ID = 61999;
const rpcEndpoint = process.env.NEXT_PUBLIC_GENLAYER_RPC || studionet.rpcUrls.default.http[0];
export type ContractTarget = "registry" | "vault";

const REGISTRY_METHODS = new Set([
  "get_config", "get_program", "get_program_for_vault", "get_program_page",
  "get_review", "get_review_page", "get_acknowledgment", "register_program", "verify_program",
  "expire_unverified_program", "acknowledge_rules", "reaffirm_rules",
  "request_revision", "assess_revision", "expire_revision_request",
  "reconcile_vault_program",
]);

export function contractTargetForMethod(method: string): ContractTarget {
  if (REGISTRY_METHODS.has(method)) return "registry";
  return "vault";
}

export type Eip1193Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, callback: (...args: unknown[]) => void): void;
  removeListener?(event: string, callback: (...args: unknown[]) => void): void;
};

function readConfiguredAddress(name: "NEXT_PUBLIC_REVIGATE_REGISTRY" | "NEXT_PUBLIC_REVIGATE_VAULT"): Address | undefined {
  const configured = process.env[name]?.trim();
  if (!configured) return undefined;
  if (!/^0x[0-9a-fA-F]{40}$/.test(configured)) throw new Error(`The configured ${name.endsWith("REGISTRY") ? "Registry" : "Vault"} address is not a valid EVM address.`);
  return configured as Address;
}

export function getConfiguredRegistryAddress(): Address | undefined {
  return readConfiguredAddress("NEXT_PUBLIC_REVIGATE_REGISTRY");
}

export function getConfiguredVaultAddress(): Address | undefined {
  return readConfiguredAddress("NEXT_PUBLIC_REVIGATE_VAULT");
}

export function getConfiguredAddressForMethod(method: string): Address | undefined {
  return contractTargetForMethod(method) === "registry"
    ? getConfiguredRegistryAddress() : getConfiguredVaultAddress();
}

export function getReadClient() {
  return createClient({ chain: studionet, endpoint: rpcEndpoint });
}

export async function verifyRevigateDeployment() {
  const registryAddress = getConfiguredRegistryAddress();
  const vaultAddress = getConfiguredVaultAddress();
  if (!registryAddress || !vaultAddress) throw new Error("Both verified Revigate Registry and Vault addresses must be configured.");
  const client = getReadClient();
  const [registryConfig, vaultConfig] = await Promise.all([
    client.readContract({ address: registryAddress, functionName: "get_config", args: [], jsonSafeReturn: true }),
    client.readContract({ address: vaultAddress, functionName: "get_config", args: [], jsonSafeReturn: true }),
  ]) as [{ chain_id?: number | string; protocol?: string; contract_version?: number | string; vault?: string; custody_enabled?: boolean },
    { chain_id?: number | string; protocol?: string; contract_version?: number | string; registry?: string; custody_enabled?: boolean }];
  if (Number(registryConfig.chain_id) !== STUDIONET_CHAIN_ID
      || registryConfig.protocol !== "revigate-registry-v1"
      || Number(registryConfig.contract_version) !== 1
      || registryConfig.vault?.toLowerCase() !== vaultAddress.toLowerCase()
      || registryConfig.custody_enabled !== false
      || Number(vaultConfig.chain_id) !== STUDIONET_CHAIN_ID
      || vaultConfig.protocol !== "revigate-vault-v1"
      || Number(vaultConfig.contract_version) !== 1
      || vaultConfig.registry?.toLowerCase() !== registryAddress.toLowerCase()
      || vaultConfig.custody_enabled !== false) {
    throw new Error("The configured Registry/Vault pair does not return a reciprocal Studionet identity.");
  }
  return { registryAddress, vaultAddress, registryConfig, vaultConfig };
}

export async function readRevigate(functionName: string, args: CalldataEncodable[] = [], target?: ContractTarget) {
  const { registryAddress, vaultAddress, registryConfig, vaultConfig } = await verifyRevigateDeployment();
  const selectedTarget = target ?? contractTargetForMethod(functionName);
  if (functionName === "get_config") return selectedTarget === "registry" ? registryConfig : vaultConfig;
  const address = selectedTarget === "registry" ? registryAddress : vaultAddress;
  return getReadClient().readContract({
    address, functionName, args: encodeAddressArguments(functionName, args), jsonSafeReturn: true,
  });
}

export async function submitRevigateWrite(options: {
  provider: Eip1193Provider;
  account: string;
  functionName: string;
  target?: ContractTarget;
  args?: CalldataEncodable[];
  value?: bigint;
}): Promise<Hash> {
  const { registryAddress, vaultAddress } = await verifyRevigateDeployment();
  const address = (options.target ?? contractTargetForMethod(options.functionName)) === "registry"
    ? registryAddress : vaultAddress;
  if (!/^0x[0-9a-fA-F]{40}$/.test(options.account)) throw new Error("Connect a valid wallet address before signing.");

  const [chain, accounts] = await Promise.all([
    options.provider.request({ method: "eth_chainId" }),
    options.provider.request({ method: "eth_accounts" }),
  ]);
  if (typeof chain !== "string" || Number.parseInt(chain, 16) !== STUDIONET_CHAIN_ID) {
    throw new Error("Wallet is not connected to Studionet chain 61999. No transaction was submitted.");
  }
  if (!Array.isArray(accounts) || typeof accounts[0] !== "string" || accounts[0].toLowerCase() !== options.account.toLowerCase()) {
    throw new Error("The active wallet changed. Reconnect the intended account before signing.");
  }

  const client = createClient({
    chain: studionet,
    endpoint: rpcEndpoint,
    account: options.account as Address,
    provider: options.provider as never,
  });
  const hash = await client.writeContract(makeWriteRequest({
    address,
    functionName: options.functionName,
    args: encodeAddressArguments(options.functionName, options.args ?? []),
    value: options.value ?? 0n,
  }));
  if (typeof hash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(hash)) {
    throw new Error("The wallet did not return a transaction hash.");
  }
  return hash as Hash;
}

export type ObservedTransaction =
  | { state: "finalized-success"; transaction: GenLayerTransaction }
  | { state: "finalized-error"; transaction: GenLayerTransaction }
  | { state: "finalized-execution-unknown"; transaction: GenLayerTransaction }
  | { state: "undetermined"; transaction: GenLayerTransaction }
  | { state: "cancelled"; transaction: GenLayerTransaction }
  | { state: "sender-mismatch"; transaction: GenLayerTransaction }
  | { state: "sender-unverified"; transaction: GenLayerTransaction }
  | { state: "contract-mismatch"; transaction: GenLayerTransaction }
  | { state: "contract-unverified"; transaction: GenLayerTransaction }
  | { state: "pending"; transaction?: GenLayerTransaction };

export async function observeTransaction(
  hash: Hash,
  checks = 10,
  expectedAccount?: string,
  expectedContract?: string,
): Promise<ObservedTransaction> {
  const client = getReadClient();
  let latest: GenLayerTransaction | undefined;
  for (let index = 0; index < checks; index += 1) {
    latest = await client.getTransaction({ hash });
    if (!latest) throw new Error(`Transaction ${hash} is not available from the configured RPC.`);
    const sender = latest.from_address ?? latest.sender;
    if (expectedAccount) {
      if (!sender) return { state: "sender-unverified", transaction: latest };
      if (sender.toLowerCase() !== expectedAccount.toLowerCase()) {
        return { state: "sender-mismatch", transaction: latest };
      }
    }
    if (expectedContract) {
      const recipient = latest.to_address ?? latest.recipient;
      if (!recipient) return { state: "contract-unverified", transaction: latest };
      if (recipient.toLowerCase() !== expectedContract.toLowerCase()) {
        return { state: "contract-mismatch", transaction: latest };
      }
    }
    const finality = classifyTransactionFinality(latest);
    if (finality !== "pending") return { state: finality, transaction: latest };
    if (index + 1 < checks) await new Promise((resolve) => setTimeout(resolve, 3_000));
  }
  return { state: "pending", transaction: latest };
}

export async function observeOutgoingTransfer(options: {
  parentHash: Hash;
  vault: string;
  recipient: string;
  amount: bigint;
}) {
  const client = getReadClient();
  const parent = await client.getTransaction({ hash: options.parentHash });
  const childHashes = await client.getTriggeredTransactionIds({ hash: options.parentHash });
  if (!parent || !Array.isArray(childHashes)) {
    const missing = classifyOutgoingTransfer({
      parentStatus: "", parentExecution: "", parentRecipient: undefined,
      expectedVault: options.vault, expectedRecipient: options.recipient,
      expectedAmount: options.amount, children: [],
    });
    return { ...missing, parentHash: options.parentHash, childHashes: [] };
  }
  const children = await Promise.all(childHashes.map(async (requestedHash) => {
    const transaction = await client.getTransaction({ hash: requestedHash });
    return transaction ? { ...transaction, requestedHash } : { requestedHash };
  }));
  const evidence = classifyOutgoingTransfer({
    parentStatus: String(parent.statusName ?? ""),
    parentExecution: String(parent.txExecutionResultName ?? ""),
    parentRecipient: parent.to_address ?? parent.recipient,
    expectedVault: options.vault,
    expectedRecipient: options.recipient,
    expectedAmount: options.amount,
    children,
  });
  return { ...evidence, parentHash: options.parentHash, childHashes };
}

function pendingKey() {
  return pendingStorageKey(STUDIONET_CHAIN_ID, getConfiguredRegistryAddress(), getConfiguredVaultAddress());
}
export type PendingTransaction = {
  hash: Hash;
  account: string;
  method: string;
  submittedAt: number;
  args?: (string | number | boolean)[];
  value?: string;
  contractAddress?: string;
  chainId?: number;
};

export function savePendingTransaction(transaction: PendingTransaction) {
  writePendingTransaction(window.localStorage, pendingKey(), transaction,
    getConfiguredRegistryAddress(), getConfiguredVaultAddress(), STUDIONET_CHAIN_ID);
}

export function loadPendingTransactions(): PendingTransaction[] {
  return readPendingTransactions(window.localStorage, pendingKey(),
    getConfiguredRegistryAddress(), getConfiguredVaultAddress(), STUDIONET_CHAIN_ID);
}

export function forgetPendingTransaction(hash: string) {
  deletePendingTransaction(window.localStorage, pendingKey(), hash,
    getConfiguredRegistryAddress(), getConfiguredVaultAddress(), STUDIONET_CHAIN_ID);
}
