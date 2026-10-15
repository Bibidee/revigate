export type ReconciliationResult = { verified: true; value: unknown } | { verified: false; reason: string };
export function reconcileCanonicalTransaction(item: { method: string; account: string; args?: unknown[] }, before: unknown, after: unknown): ReconciliationResult;
export function transactionStateLabel(state: string): string;
