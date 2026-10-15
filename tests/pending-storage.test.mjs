import assert from "node:assert/strict";
import test from "node:test";
import { forgetPendingTransaction, isDuplicatePendingWrite, loadPendingTransactions, pendingStorageKey, savePendingTransaction } from "../lib/pending-storage.mjs";
class MemoryStorage { values = new Map(); getItem(k) { return this.values.get(k) ?? null; } setItem(k, v) { this.values.set(k, v); } }
const registry = `0x${"a".repeat(40)}`;
const item = { hash: `0x${"b".repeat(64)}`, account: `0x${"c".repeat(40)}`, method: "verify_program", args: ["1"], value: "0", submittedAt: 1, contractAddress: registry, chainId: 61999 };
test("Registry transaction persists across refresh and is address scoped", () => {
  const storage = new MemoryStorage(); const key = pendingStorageKey(61999, registry);
  savePendingTransaction(storage, key, item, registry, 61999);
  assert.deepEqual(loadPendingTransactions(storage, key, registry, 61999), [item]);
  assert.deepEqual(loadPendingTransactions(storage, key, `0x${"d".repeat(40)}`, 61999), []);
  forgetPendingTransaction(storage, key, item.hash, registry, 61999);
  assert.deepEqual(loadPendingTransactions(storage, key, registry, 61999), []);
});
test("duplicate action is detected and native value is preserved", () => {
  assert.equal(isDuplicatePendingWrite([item], item), true);
  const storage = new MemoryStorage();
  savePendingTransaction(storage, pendingStorageKey(61999, registry), { ...item, value: "1" }, registry, 61999);
  assert.equal(loadPendingTransactions(storage, pendingStorageKey(61999, registry), registry, 61999)[0].value, "1");
  assert.throws(() => savePendingTransaction(storage, pendingStorageKey(61999, registry), { ...item, value: "one" }, registry, 61999), /active Registry/);
});
