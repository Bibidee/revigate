const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const HASH = /^0x[0-9a-fA-F]{64}$/;
export const STUDIONET_CHAIN_ID = 61999;
export const STUDIONET_CHAIN_ID_HEX = `0x${STUDIONET_CHAIN_ID.toString(16)}`;
export const STUDIONET_CHAIN_PARAMS = {
  chainId: STUDIONET_CHAIN_ID_HEX,
  chainName: "GenLayer Studionet",
  rpcUrls: ["https://studio.genlayer.com/api"],
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  blockExplorerUrls: ["https://explorer-studio.genlayer.com"],
};

export function normalizeWalletAccount(value) {
  return Array.isArray(value) && typeof value[0] === "string" && ADDRESS.test(value[0])
    ? value[0] : "";
}

export function normalizeWalletChainId(value) {
  if (typeof value !== "string" || !/^0x[0-9a-f]+$/i.test(value)) return "";
  const parsed = Number.parseInt(value, 16);
  return Number.isSafeInteger(parsed) ? value : "";
}

function providerErrorCode(error) {
  return error && typeof error === "object" && "code" in error ? error.code : undefined;
}

export async function switchToStudionet(provider) {
  if (!provider) throw new Error("Install an EIP-1193 wallet such as MetaMask or Rabby to connect.");
  const currentChainId = await provider.request({ method: "eth_chainId" });
  if (typeof currentChainId === "string" && currentChainId.toLowerCase() === STUDIONET_CHAIN_ID_HEX) return;
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: STUDIONET_CHAIN_ID_HEX }] });
  } catch (error) {
    if (providerErrorCode(error) !== 4902) throw error;
    await provider.request({ method: "wallet_addEthereumChain", params: [STUDIONET_CHAIN_PARAMS] });
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: STUDIONET_CHAIN_ID_HEX }] });
  }
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
  await switchToStudionet(provider);
  return session.refresh();
}

export async function disconnectWallet(provider, session) {
  if (!provider) throw new Error("No wallet is connected to this browser.");
  try {
    await provider.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
  } catch (error) {
    const code = providerErrorCode(error);
    if (code === -32601 || code === 4200) {
      throw new Error("This wallet does not support in-app disconnect. Disconnect Revigate from the wallet extension.");
    }
    throw error;
  }
  const state = await session.refresh();
  if (state.account) {
    throw new Error("The wallet did not confirm that Revigate was disconnected. Use the wallet extension to disconnect it.");
  }
  return state;
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

export function isFinalizedForCanonical(state) {
  return state === "finalized-success" || state === "finalized-execution-unknown";
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
