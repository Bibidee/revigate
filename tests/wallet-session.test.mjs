import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyTransactionFinality,
  disconnectWallet,
  isFinalizedForCanonical,
  normalizeWalletAccount,
  normalizeWalletChainId,
  requestWalletConnection,
  submitAndPersistHash,
  watchWallet,
} from "../lib/wallet-session.mjs";

const accountA = `0x${"a".repeat(40)}`;
const accountB = `0x${"b".repeat(40)}`;

class FakeProvider {
  listeners = new Map();
  pending = new Map();
  calls = [];
  current = { eth_accounts: [], eth_chainId: "0xf22f" };
  request({ method, params }) {
    this.calls.push({ method, params });
    if (this.pending.has(method)) return this.pending.get(method)();
    if (method === "eth_requestAccounts") return Promise.resolve([accountA]);
    if (method === "wallet_revokePermissions") { this.current.eth_accounts = []; return Promise.resolve(null); }
    if (method === "wallet_switchEthereumChain") {
      this.current.eth_chainId = params[0].chainId;
      return Promise.resolve(null);
    }
    if (method === "wallet_addEthereumChain") return Promise.resolve(null);
    return Promise.resolve(this.current[method]);
  }
  on(event, callback) {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(callback);
    this.listeners.set(event, listeners);
  }
  removeListener(event, callback) { this.listeners.get(event)?.delete(callback); }
  emit(event, value) { for (const listener of this.listeners.get(event) ?? []) listener(value); }
}

test("T31 event updates win over stale initial wallet reads and listeners are removed", async () => {
  const provider = new FakeProvider();
  const deferred = new Map();
  provider.pending.set("eth_accounts", () => new Promise((resolve) => deferred.set("accounts", resolve)));
  provider.pending.set("eth_chainId", () => new Promise((resolve) => deferred.set("chain", resolve)));
  const states = [];
  const session = watchWallet(provider, (state) => states.push(state));
  provider.emit("accountsChanged", [accountB]);
  provider.emit("chainChanged", "0x1");
  deferred.get("accounts")([accountA]);
  deferred.get("chain")("0xf22f");
  await session.ready;
  assert.deepEqual(session.getState(), { account: accountB, chainId: "0x1" });

  provider.emit("chainChanged", "0xf22f");
  provider.emit("accountsChanged", []);
  assert.deepEqual(session.getState(), { account: "", chainId: "0xf22f" });
  assert.ok(states.length >= 4);
  session.stop();
  provider.emit("accountsChanged", [accountA]);
  assert.deepEqual(session.getState(), { account: "", chainId: "0xf22f" });
  assert.equal(provider.listeners.get("accountsChanged").size, 0);
});

test("T43 provider absence, account normalization, and wallet rejection remain explicit", async () => {
  assert.equal(normalizeWalletAccount([accountA]), accountA);
  assert.equal(normalizeWalletAccount(["not-an-address"]), "");
  assert.equal(normalizeWalletChainId("0xf22f"), "0xf22f");
  assert.equal(normalizeWalletChainId("61999"), "");
  await assert.rejects(() => requestWalletConnection(undefined, { refresh: async () => ({ account: "", chainId: "" }) }), /Install an EIP-1193 wallet/);

  const provider = new FakeProvider();
  const session = watchWallet(provider, () => undefined);
  await session.ready;
  provider.request = ({ method }) => method === "eth_requestAccounts"
    ? Promise.reject(new Error("User rejected the request")) : Promise.resolve("0xf22f");
  await assert.rejects(() => requestWalletConnection(provider, session), /User rejected/);
  session.stop();
});

test("T43 connection requests Studionet when the wallet is on another chain", async () => {
  const provider = new FakeProvider();
  provider.current.eth_chainId = "0x1";
  const session = watchWallet(provider, () => undefined);
  await session.ready;
  await requestWalletConnection(provider, session);
  assert.ok(provider.calls.some(({ method, params }) => method === "wallet_switchEthereumChain"
    && params[0].chainId === "0xf22f"));
  assert.equal(session.getState().chainId, "0xf22f");
  session.stop();
});

test("T43 connection adds Studionet only when the wallet reports an unknown chain", async () => {
  const provider = new FakeProvider();
  provider.current.eth_chainId = "0x1";
  provider.request = function request({ method, params }) {
    this.calls.push({ method, params });
    if (method === "eth_requestAccounts") return Promise.resolve([accountA]);
    if (method === "eth_accounts") return Promise.resolve([accountA]);
    if (method === "eth_chainId") return Promise.resolve(this.current.eth_chainId);
    if (method === "wallet_switchEthereumChain" && !this.added) {
      const error = new Error("Unknown chain");
      error.code = 4902;
      return Promise.reject(error);
    }
    if (method === "wallet_addEthereumChain") { this.added = true; return Promise.resolve(null); }
    if (method === "wallet_switchEthereumChain") { this.current.eth_chainId = params[0].chainId; return Promise.resolve(null); }
    return Promise.resolve(null);
  };
  const session = watchWallet(provider, () => undefined);
  await session.ready;
  await requestWalletConnection(provider, session);
  assert.ok(provider.calls.some(({ method }) => method === "wallet_addEthereumChain"));
  assert.equal(session.getState().chainId, "0xf22f");
  session.stop();
});

test("T43 declined network switch remains an explicit wallet error", async () => {
  const provider = new FakeProvider();
  provider.current.eth_chainId = "0x1";
  provider.request = ({ method }) => {
    if (method === "eth_requestAccounts") return Promise.resolve([accountA]);
    if (method === "eth_chainId") return Promise.resolve("0x1");
    if (method === "wallet_switchEthereumChain") return Promise.reject(Object.assign(new Error("User rejected"), { code: 4001 }));
    return Promise.resolve(null);
  };
  const session = watchWallet(provider, () => undefined);
  await session.ready;
  await assert.rejects(() => requestWalletConnection(provider, session), /User rejected/);
  session.stop();
});

test("T43 disconnect revokes wallet permission and confirms the account is gone", async () => {
  const provider = new FakeProvider();
  provider.current.eth_accounts = [accountA];
  const session = watchWallet(provider, () => undefined);
  await session.ready;
  assert.equal(session.getState().account, accountA);
  await disconnectWallet(provider, session);
  assert.ok(provider.calls.some(({ method, params }) => method === "wallet_revokePermissions" && params[0].eth_accounts));
  assert.equal(session.getState().account, "");
  session.stop();
});

test("T43 unsupported in-app disconnect remains an explicit wallet limitation", async () => {
  const provider = new FakeProvider();
  provider.current.eth_accounts = [accountA];
  provider.request = ({ method }) => method === "wallet_revokePermissions"
    ? Promise.reject(Object.assign(new Error("Unsupported"), { code: -32601 }))
    : Promise.resolve(provider.current[method]);
  const session = watchWallet(provider, () => undefined);
  await session.ready;
  await assert.rejects(() => disconnectWallet(provider, session), /does not support in-app disconnect/);
  assert.equal(session.getState().account, accountA);
  session.stop();
});

test("T43 account and network changes are read from the currently active wallet", async () => {
  const provider = new FakeProvider();
  const session = watchWallet(provider, () => undefined);
  await session.ready;
  provider.current = { eth_accounts: [accountB], eth_chainId: "0x1" };
  assert.deepEqual(await session.refresh(), { account: accountB, chainId: "0x1" });
  session.stop();
});

test("T44 finality keeps pending, undetermined, cancellation, missing execution, and execution failure distinct", () => {
  assert.equal(classifyTransactionFinality({ statusName: "ACCEPTED" }), "pending");
  assert.equal(classifyTransactionFinality({ statusName: "UNDETERMINED" }), "undetermined");
  assert.equal(classifyTransactionFinality({ statusName: "CANCELED" }), "cancelled");
  assert.equal(classifyTransactionFinality({ statusName: "FINALIZED", txExecutionResultName: "FINISHED_WITH_RETURN" }), "finalized-success");
  assert.equal(classifyTransactionFinality({ statusName: "FINALIZED", txExecutionResultName: "FINISHED_WITH_ERROR" }), "finalized-error");
  assert.equal(classifyTransactionFinality({ statusName: "FINALIZED" }), "finalized-execution-unknown");
  assert.equal(classifyTransactionFinality({ statusName: "FINALIZED", txExecutionResultName: "NOT_VOTED" }), "finalized-execution-unknown");
  assert.equal(isFinalizedForCanonical("finalized-success"), true);
  assert.equal(isFinalizedForCanonical("finalized-execution-unknown"), true);
  assert.equal(isFinalizedForCanonical("finalized-error"), false);
});

test("T45 no pre-hash rejection is persisted; a returned hash is saved once for same-hash recovery", async () => {
  const saved = [];
  await assert.rejects(() => submitAndPersistHash(
    async () => { throw new Error("User rejected"); },
    (hash) => ({ hash }), (pending) => saved.push(pending),
  ), /User rejected/);
  assert.deepEqual(saved, []);

  const hash = `0x${"d".repeat(64)}`;
  const result = await submitAndPersistHash(async () => hash, (returnedHash) => ({ hash: returnedHash }), (pending) => saved.push(pending));
  assert.deepEqual(result, { pending: { hash }, persisted: true });
  assert.deepEqual(saved, [{ hash }]);
});

test("T45 hash survives local persistence failure in memory without authorizing resubmission", async () => {
  const hash = `0x${"e".repeat(64)}`;
  const result = await submitAndPersistHash(async () => hash, (value) => ({ hash: value }), () => { throw new Error("quota"); });
  assert.equal(result.persisted, false);
  assert.equal(result.pending.hash, hash);
});
