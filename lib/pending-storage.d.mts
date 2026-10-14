import type { PendingTransaction } from "./genlayer";
export type StorageLike = { getItem(key: string): string | null; setItem(key: string, value: string): void };
export function pendingStorageKey(chainId: number, registryAddress?: string, vaultAddress?: string): string;
export function loadPendingTransactions(storage: StorageLike, key: string, registryAddress: string | undefined, vaultAddress: string | undefined, chainId: number): PendingTransaction[];
export function savePendingTransaction(storage: StorageLike, key: string, transaction: PendingTransaction, registryAddress: string | undefined, vaultAddress: string | undefined, chainId: number): void;
export function forgetPendingTransaction(storage: StorageLike, key: string, hash: string, registryAddress: string | undefined, vaultAddress: string | undefined, chainId: number): void;
