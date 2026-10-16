const HASH = /^0x[0-9a-fA-F]{64}$/;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

export function pendingStorageKey(chainId, registryAddress) {
  return `revigate:registry-transactions:v3:${chainId}:${registryAddress?.toLowerCase() ?? "unbound"}`;
}
function valid(item, registryAddress, chainId) {
  return Boolean(item && HASH.test(item.hash) && ADDRESS.test(item.account)
    && item.contractAddress?.toLowerCase() === registryAddress?.toLowerCase()
    && item.chainId === chainId && typeof item.method === "string"
    && typeof item.submittedAt === "number" && typeof item.value === "string" && /^\d+$/.test(item.value));
}
export function loadPendingTransactions(storage, key, registryAddress, chainId) {
  try {
    const parsed = JSON.parse(storage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => valid(item, registryAddress, chainId)).slice(0, 20) : [];
  } catch { return []; }
}
export function savePendingTransaction(storage, key, item, registryAddress, chainId) {
  if (!valid(item, registryAddress, chainId)) throw new Error("The saved transaction does not match the active Registry and chain.");
  const current = loadPendingTransactions(storage, key, registryAddress, chainId);
  storage.setItem(key, JSON.stringify([item, ...current.filter((entry) => entry.hash !== item.hash)].slice(0, 20)));
}
export function forgetPendingTransaction(storage, key, hash, registryAddress, chainId) {
  storage.setItem(key, JSON.stringify(loadPendingTransactions(storage, key, registryAddress, chainId).filter((item) => item.hash !== hash)));
}
export function isDuplicatePendingWrite(items, candidate) {
  const args = JSON.stringify(candidate.args ?? []);
  return items.some((item) => item.account.toLowerCase() === candidate.account.toLowerCase()
    && item.method === candidate.method && JSON.stringify(item.args ?? []) === args);
}
