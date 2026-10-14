import type { PendingTransaction } from "./genlayer";
export type StorageLike = { getItem(key: string): string | null; setItem(key: string, value: string): void };
export function pendingStorageKey(chainId: number, registryAddress?: string): string;
export function loadPendingTransactions(storage: StorageLike, key: string, registryAddress: string | undefined, chainId: number): PendingTransaction[];
export function savePendingTransaction(storage: StorageLike, key: string, item: PendingTransaction, registryAddress: string | undefined, chainId: number): void;
export function forgetPendingTransaction(storage: StorageLike, key: string, hash: string, registryAddress: string | undefined, chainId: number): void;
export function isDuplicatePendingWrite(items: PendingTransaction[], candidate: Pick<PendingTransaction, "account" | "method" | "args">): boolean;
