import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { Address, CalldataEncodable, GenLayerTransaction, Hash } from "genlayer-js/types";
import { classifyTransactionFinality } from "./wallet-session.mjs";
import { makeWriteRequest } from "./write-request.mjs";

export type { Hash } from "genlayer-js/types";
export const STUDIONET_CHAIN_ID = 61999;
const endpoint = process.env.NEXT_PUBLIC_GENLAYER_RPC || studionet.rpcUrls.default.http[0];

export type Eip1193Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, callback: (...args: unknown[]) => void): void;
  removeListener?(event: string, callback: (...args: unknown[]) => void): void;
};

export function getConfiguredRegistryAddress(): Address | undefined {
  const value = process.env.NEXT_PUBLIC_REVIGATE_REGISTRY?.trim();
  if (!value) return undefined;
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) throw new Error("The configured Registry address is invalid.");
  return value as Address;
}

export function getReadClient() { return createClient({ chain: studionet, endpoint }); }

export async function verifyRevigateDeployment() {
  const registryAddress = getConfiguredRegistryAddress();
  if (!registryAddress) throw new Error("A verified Revigate Registry address must be configured.");
  const registryConfig = await getReadClient().readContract({
    address: registryAddress, functionName: "get_config", args: [], jsonSafeReturn: true,
  }) as { chain_id?: number | string; protocol?: string; contract_version?: number | string; custody?: string };
  if (Number(registryConfig.chain_id) !== STUDIONET_CHAIN_ID
      || registryConfig.protocol !== "revigate-registry-v1"
      || Number(registryConfig.contract_version) !== 2 || registryConfig.custody !== "NONE") {
    throw new Error("The configured contract is not the non-custodial Revigate Registry v2.");
  }
  return { registryAddress, registryConfig };
}

export async function readRevigate(functionName: string, args: CalldataEncodable[] = []) {
  const { registryAddress, registryConfig } = await verifyRevigateDeployment();
  if (functionName === "get_config") return registryConfig;
  return getReadClient().readContract({ address: registryAddress, functionName, args, jsonSafeReturn: true });
}

export async function submitRevigateWrite(options: {
  provider: Eip1193Provider; account: string; functionName: string; args?: CalldataEncodable[];
}): Promise<Hash> {
  const { registryAddress } = await verifyRevigateDeployment();
  const [chain, accounts] = await Promise.all([
    options.provider.request({ method: "eth_chainId" }), options.provider.request({ method: "eth_accounts" }),
  ]);
  if (typeof chain !== "string" || Number.parseInt(chain, 16) !== STUDIONET_CHAIN_ID) throw new Error("Connect to Studionet chain 61999 before signing.");
  if (!Array.isArray(accounts) || typeof accounts[0] !== "string" || accounts[0].toLowerCase() !== options.account.toLowerCase()) throw new Error("The active wallet changed. Reconnect before signing.");
  const client = createClient({ chain: studionet, endpoint, account: options.account as Address, provider: options.provider as never });
  const hash = await client.writeContract(makeWriteRequest({ address: registryAddress,
    functionName: options.functionName, args: options.args ?? [], value: 0n }));
  if (typeof hash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(hash)) throw new Error("The wallet did not return a transaction hash.");
  return hash as Hash;
}

export async function observeTransaction(hash: Hash, checks = 10, expectedAccount?: string, expectedContract?: string) {
  let latest: GenLayerTransaction | undefined;
  for (let index = 0; index < checks; index += 1) {
    latest = await getReadClient().getTransaction({ hash });
    if (!latest) throw new Error(`Transaction ${hash} is unavailable from the configured RPC.`);
    const sender = latest.from_address ?? latest.sender;
    if (expectedAccount && !sender) return { state: "sender-unverified" as const, transaction: latest };
    if (expectedAccount && sender?.toLowerCase() !== expectedAccount.toLowerCase()) return { state: "sender-mismatch" as const, transaction: latest };
    const recipient = latest.to_address ?? latest.recipient;
    if (expectedContract && !recipient) return { state: "contract-unverified" as const, transaction: latest };
    if (expectedContract && recipient?.toLowerCase() !== expectedContract.toLowerCase()) return { state: "contract-mismatch" as const, transaction: latest };
    const state = classifyTransactionFinality(latest);
    if (state !== "pending") return { state, transaction: latest };
    if (index + 1 < checks) await new Promise((resolve) => setTimeout(resolve, 3_000));
  }
  return { state: "pending" as const, transaction: latest };
}
