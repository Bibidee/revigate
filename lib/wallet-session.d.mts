export type WalletSessionState = { account: string; chainId: string };
export type WalletProvider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, callback: (...args: unknown[]) => void): void;
  removeListener?(event: string, callback: (...args: unknown[]) => void): void;
};
export function normalizeWalletAccount(value: unknown): string;
export function normalizeWalletChainId(value: unknown): string;
export function watchWallet(provider: WalletProvider, onChange: (state: WalletSessionState, kind: string) => void): {
  ready: Promise<PromiseSettledResult<void>[]>;
  refresh(): Promise<WalletSessionState>;
  getState(): WalletSessionState;
  stop(): void;
};
export function requestWalletConnection(provider: WalletProvider | undefined, session: { refresh(): Promise<WalletSessionState> }): Promise<WalletSessionState>;
export function disconnectWallet(provider: WalletProvider | undefined, session: { refresh(): Promise<WalletSessionState> }): Promise<WalletSessionState>;
export function classifyTransactionFinality(transaction: { statusName?: string; txExecutionResultName?: string } | null | undefined): "finalized-success" | "finalized-error" | "finalized-execution-unknown" | "undetermined" | "cancelled" | "pending";
export function isFinalizedForCanonical(state: string): boolean;
export function submitAndPersistHash<T>(submit: () => Promise<unknown>, makePending: (hash: string) => T, persist: (pending: T) => void): Promise<{ pending: T; persisted: true } | { pending: T; persisted: false; error: unknown }>;
