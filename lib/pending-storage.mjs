const HASH = /^0x[0-9a-fA-F]{64}$/;

export function pendingStorageKey(chainId, registryAddress, vaultAddress) {
  const registry = registryAddress?.toLowerCase() ?? "unbound";
  const vault = vaultAddress?.toLowerCase() ?? "unbound";
  return `revigate:pending-transactions:v2:${chainId}:${registry}:${vault}`;
}

function isPendingTransaction(item, allowedAddresses, chainId) {
  return Boolean(item && typeof item.hash === "string" && HASH.test(item.hash)
    && typeof item.account === "string" && /^0x[0-9a-fA-F]{40}$/.test(item.account)
    && typeof item.method === "string" && typeof item.submittedAt === "number"
    && typeof item.contractAddress === "string"
    && allowedAddresses.has(item.contractAddress.toLowerCase())
    && item.chainId === chainId
    && (!item.args || (Array.isArray(item.args)
      && item.args.every((arg) => ["string", "number", "boolean"].includes(typeof arg))))
    && (!item.value || (typeof item.value === "string" && /^\d+$/.test(item.value))));
}

export function loadPendingTransactions(storage, key, registryAddress, vaultAddress, chainId) {
  try {
    const parsed = JSON.parse(storage.getItem(key) ?? "[]");
    const allowedAddresses = new Set([registryAddress, vaultAddress].filter(Boolean).map((value) => value.toLowerCase()));
    return Array.isArray(parsed)
      ? parsed.filter((item) => isPendingTransaction(item, allowedAddresses, chainId)).slice(0, 20)
      : [];
  } catch {
    return [];
  }
}

export function savePendingTransaction(storage, key, transaction, registryAddress, vaultAddress, chainId) {
  const current = loadPendingTransactions(storage, key, registryAddress, vaultAddress, chainId);
  if (!isPendingTransaction(transaction, new Set([registryAddress, vaultAddress].filter(Boolean).map((value) => value.toLowerCase())), chainId)) {
    throw new Error("The pending transaction does not match the active chain and configured contracts.");
  }
  const next = [transaction, ...current.filter((item) => item.hash !== transaction.hash)].slice(0, 20);
  storage.setItem(key, JSON.stringify(next));
}

export function forgetPendingTransaction(storage, key, hash, registryAddress, vaultAddress, chainId) {
  const next = loadPendingTransactions(storage, key, registryAddress, vaultAddress, chainId)
    .filter((item) => item.hash !== hash);
  storage.setItem(key, JSON.stringify(next));
}
