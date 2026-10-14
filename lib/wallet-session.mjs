const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const HASH = /^0x[0-9a-fA-F]{64}$/;

export function normalizeWalletAccount(value) {
  return Array.isArray(value) && typeof value[0] === "string" && ADDRESS.test(value[0])
    ? value[0] : "";
}

export function normalizeWalletChainId(value) {
  if (typeof value !== "string" || !/^0x[0-9a-f]+$/i.test(value)) return "";
  const parsed = Number.parseInt(value, 16);
  return Number.isSafeInteger(parsed) ? value : "";
}

export function watchWallet(provider, onChange) {
  let active = true;
  let accountRevision = 0;
  let chainRevision = 0;
  let state = { account: "", chainId: "" };

  const emit = (kind) => { if (active) onChange({ ...state }, kind); };
  const setAccount = (value, fromEvent = false) => {
    if (fromEvent) accountRevision += 1;
    state = { ...state, account: normalizeWalletAccount(value) };
    emit("account");
  };
  const setChain = (value, fromEvent = false) => {
    if (fromEvent) chainRevision += 1;
    state = { ...state, chainId: normalizeWalletChainId(value) };
    emit("chain");
  };
  const onAccounts = (value) => setAccount(value, true);
  const onChain = (value) => setChain(value, true);
  const onDisconnect = () => {
    accountRevision += 1;
    chainRevision += 1;
    state = { account: "", chainId: "" };
    emit("disconnect");
  };
  const onConnect = () => { void refresh().catch(() => undefined); };

  provider.on?.("accountsChanged", onAccounts);
  provider.on?.("chainChanged", onChain);
  provider.on?.("disconnect", onDisconnect);
  provider.on?.("connect", onConnect);

  const initialAccountRevision = accountRevision;
  const initialChainRevision = chainRevision;
  const ready = Promise.allSettled([
    provider.request({ method: "eth_accounts" }).then((value) => {
      if (active && accountRevision === initialAccountRevision) setAccount(value);
    }),
    provider.request({ method: "eth_chainId" }).then((value) => {
      if (active && chainRevision === initialChainRevision) setChain(value);
    }),
  ]);

  async function refresh() {
    const accountAtStart = accountRevision;
    const chainAtStart = chainRevision;
    const results = await Promise.allSettled([
      provider.request({ method: "eth_accounts" }),
      provider.request({ method: "eth_chainId" }),
    ]);
    if (!active) return { ...state };
    if (accountRevision === accountAtStart && results[0].status === "fulfilled") {
      setAccount(results[0].value);
    }
    if (chainRevision === chainAtStart && results[1].status === "fulfilled") {
      setChain(results[1].value);
    }
    return { ...state };
  }

  return {
    ready,
    refresh,
    getState: () => ({ ...state }),
    stop() {
      active = false;
      provider.removeListener?.("accountsChanged", onAccounts);
      provider.removeListener?.("chainChanged", onChain);
      provider.removeListener?.("disconnect", onDisconnect);
      provider.removeListener?.("connect", onConnect);
    },
  };
}

export async function requestWalletConnection(provider, session) {
  if (!provider) throw new Error("Install an EIP-1193 wallet such as MetaMask or Rabby to connect.");
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  if (!normalizeWalletAccount(accounts)) throw new Error("The wallet returned no usable account.");
  return session.refresh();
}

export function classifyTransactionFinality(transaction) {
  if (!transaction) return "pending";
  if (transaction.statusName === "UNDETERMINED") return "undetermined";
  if (transaction.statusName === "CANCELED") return "cancelled";
  if (transaction.statusName !== "FINALIZED") return "pending";
  if (transaction.txExecutionResultName === "FINISHED_WITH_RETURN") return "finalized-success";
  if (transaction.txExecutionResultName === "FINISHED_WITH_ERROR") return "finalized-error";
  return "finalized-execution-unknown";
}

export async function submitAndPersistHash(submit, makePending, persist) {
  const hash = await submit();
  if (typeof hash !== "string" || !HASH.test(hash)) {
    throw new Error("The wallet did not return a transaction hash.");
  }
  const pending = makePending(hash);
  try {
    persist(pending);
    return { pending, persisted: true };
  } catch (error) {
    return { pending, persisted: false, error };
  }
}
