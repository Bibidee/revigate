import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyTransactionFinality,
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
  current = { eth_accounts: [], eth_chainId: "0xf22f" };
  request({ method }) {
    if (this.pending.has(method)) return this.pending.get(method)();
    if (method === "eth_requestAccounts") return Promise.resolve([accountA]);
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
