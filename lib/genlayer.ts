import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";
import type { Address, CalldataEncodable, GenLayerTransaction, Hash } from "genlayer-js/types";
export type { Hash } from "genlayer-js/types";

export const STUDIONET_CHAIN_ID = 61999;
const rpcEndpoint = process.env.NEXT_PUBLIC_GENLAYER_RPC || studionet.rpcUrls.default.http[0];

export type Eip1193Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, callback: (...args: unknown[]) => void): void;
  removeListener?(event: string, callback: (...args: unknown[]) => void): void;
};

export function getConfiguredContractAddress(): Address | undefined {
  const configured = process.env.NEXT_PUBLIC_REVIGATE_CONTRACT?.trim();
  if (!configured) return undefined;
  if (!/^0x[0-9a-fA-F]{40}$/.test(configured)) throw new Error("The configured Revigate address is not a valid EVM address.");
  return configured as Address;
}

export function getReadClient() {
  return createClient({ chain: studionet, endpoint: rpcEndpoint });
}

export async function readRevigate(functionName: string, args: CalldataEncodable[] = []) {
  const address = getConfiguredContractAddress();
  if (!address) throw new Error("No verified Revigate Studionet contract is configured.");
  return getReadClient().readContract({ address, functionName, args, jsonSafeReturn: true });
}

export async function submitRevigateWrite(options: {
  provider: Eip1193Provider;
  account: string;
  functionName: string;
  args?: CalldataEncodable[];
  value?: bigint;
}): Promise<Hash> {
  const address = getConfiguredContractAddress();
  if (!address) throw new Error("No verified Revigate Studionet contract is configured.");
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
  const hash = await client.writeContract({
    address,
    functionName: options.functionName,
    args: options.args ?? [],
    value: options.value ?? 0n,
  });
  if (typeof hash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(hash)) {
    throw new Error("The wallet did not return a transaction hash.");
  }
  return hash as Hash;
}

export type ObservedTransaction =
  | { state: "finalized-success"; transaction: GenLayerTransaction }
  | { state: "finalized-error"; transaction: GenLayerTransaction }
  | { state: "undetermined"; transaction: GenLayerTransaction }
  | { state: "cancelled"; transaction: GenLayerTransaction }
  | { state: "sender-mismatch"; transaction: GenLayerTransaction }
  | { state: "pending"; transaction?: GenLayerTransaction };

export async function observeTransaction(hash: Hash, checks = 10, expectedAccount?: string): Promise<ObservedTransaction> {
  const client = getReadClient();
  let latest: GenLayerTransaction | undefined;
  for (let index = 0; index < checks; index += 1) {
    latest = await client.getTransaction({ hash });
    if (!latest) throw new Error(`Transaction ${hash} is not available from the configured RPC.`);
    const sender = latest.from_address ?? latest.sender;
    if (expectedAccount && sender && sender.toLowerCase() !== expectedAccount.toLowerCase()) {
      return { state: "sender-mismatch", transaction: latest };
    }
    if (latest.statusName === TransactionStatus.UNDETERMINED) return { state: "undetermined", transaction: latest };
    if (latest.statusName === TransactionStatus.CANCELED) return { state: "cancelled", transaction: latest };
    if (latest.statusName === TransactionStatus.FINALIZED) {
      return {
        state: latest.txExecutionResultName === ExecutionResult.FINISHED_WITH_RETURN ? "finalized-success" : "finalized-error",
        transaction: latest,
      };
    }
    if (index + 1 < checks) await new Promise((resolve) => setTimeout(resolve, 3_000));
  }
  return { state: "pending", transaction: latest };
}

function pendingKey() {
  const address = getConfiguredContractAddress()?.toLowerCase() ?? "unbound";
  return `revigate:pending-transactions:v1:${STUDIONET_CHAIN_ID}:${address}`;
}
export type PendingTransaction = { hash: Hash; account: string; method: string; submittedAt: number };

export function savePendingTransaction(transaction: PendingTransaction) {
  const current = loadPendingTransactions();
  const next = [transaction, ...current.filter((item) => item.hash !== transaction.hash)].slice(0, 20);
  window.localStorage.setItem(pendingKey(), JSON.stringify(next));
}

export function loadPendingTransactions(): PendingTransaction[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(pendingKey()) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is PendingTransaction =>
      item && typeof item.hash === "string" && /^0x[0-9a-fA-F]{64}$/.test(item.hash)
      && typeof item.account === "string" && typeof item.method === "string" && typeof item.submittedAt === "number"
    ) : [];
  } catch {
    return [];
  }
}

export function forgetPendingTransaction(hash: string) {
  const next = loadPendingTransactions().filter((item) => item.hash !== hash);
  window.localStorage.setItem(pendingKey(), JSON.stringify(next));
}
