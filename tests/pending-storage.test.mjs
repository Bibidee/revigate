import assert from "node:assert/strict";
import test from "node:test";
import { forgetPendingTransaction, loadPendingTransactions, pendingStorageKey, savePendingTransaction } from "../lib/pending-storage.mjs";
import { makeWriteRequest } from "../lib/write-request.mjs";

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
}

test("T43 native value is an explicit integer field separate from wallet-calculated fees", () => {
  const call = makeWriteRequest({ address: `0x${"a".repeat(40)}`, functionName: "fund_offer", args: [7n], value: 1_000_000_000_000_000_000n });
  assert.equal(call.value, 1_000_000_000_000_000_000n);
  assert.equal("gas" in call, false);
  assert.throws(() => makeWriteRequest({ address: `0x${"a".repeat(40)}`, functionName: "fund_offer", args: [7n], value: 1 }), /bigint/);
});

test("T47 pending hash survives a browser reload and is isolated by chain and contract pair", () => {
  const storage = new MemoryStorage();
  const registry = `0x${"a".repeat(40)}`;
  const vault = `0x${"b".repeat(40)}`;
  const account = `0x${"c".repeat(40)}`;
  const hash = `0x${"d".repeat(64)}`;
  const key = pendingStorageKey(61999, registry, vault);
  const item = { hash, account, method: "verify_program", submittedAt: 1, args: ["10"], value: "0", contractAddress: registry, chainId: 61999 };

  savePendingTransaction(storage, key, item, registry, vault, 61999);
  // A page reload creates new UI state; the persisted storage pointer remains.
  assert.deepEqual(loadPendingTransactions(storage, key, registry, vault, 61999), [item]);
  assert.deepEqual(loadPendingTransactions(storage, pendingStorageKey(61999, registry, `0x${"e".repeat(40)}`), registry, `0x${"e".repeat(40)}`, 61999), []);
  assert.deepEqual(loadPendingTransactions(storage, pendingStorageKey(4221, registry, vault), registry, vault, 4221), []);

  forgetPendingTransaction(storage, key, hash, registry, vault, 61999);
  assert.deepEqual(loadPendingTransactions(storage, key, registry, vault, 61999), []);
});

test("pending storage rejects forged hashes and transactions scoped to another contract", () => {
  const storage = new MemoryStorage();
  const registry = `0x${"a".repeat(40)}`;
  const vault = `0x${"b".repeat(40)}`;
  const base = { hash: `0x${"d".repeat(64)}`, account: `0x${"c".repeat(40)}`, method: "verify_program", submittedAt: 1, contractAddress: registry, chainId: 61999 };
  assert.throws(() => savePendingTransaction(storage, pendingStorageKey(61999, registry, vault), { ...base, contractAddress: `0x${"e".repeat(40)}` }, registry, vault, 61999), /configured contracts/);
  assert.throws(() => savePendingTransaction(storage, pendingStorageKey(61999, registry, vault), { ...base, hash: "bad" }, registry, vault, 61999), /configured contracts/);
});
