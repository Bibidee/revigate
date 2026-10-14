import assert from "node:assert/strict";
import test from "node:test";
import { classifyOutgoingTransfer } from "../lib/transfer-evidence.mjs";

const vault = `0x${"a".repeat(40)}`;
const recipient = `0x${"b".repeat(40)}`;
const other = `0x${"c".repeat(40)}`;
const parent = { parentStatus: "FINALIZED", parentExecution: "FINISHED_WITH_RETURN", parentRecipient: vault };
const child = {
  hash: `0x${"1".repeat(64)}`, from_address: vault, to_address: recipient,
  value: 1, statusName: "FINALIZED", txExecutionResultName: "FINISHED_WITH_RETURN",
};

function classify(children, overrides = {}) {
  return classifyOutgoingTransfer({
    ...parent, expectedVault: vault, expectedRecipient: recipient,
    expectedAmount: 1n, children, ...overrides,
  });
}

test("one finalized successful child matching sender, recipient, and amount verifies external delivery", () => {
  assert.deepEqual(classify([child]), {
    status: "DELIVERY_VERIFIED_BY_FINALIZED_CHILD", matchingChildren: [child.hash],
  });
});

test("a finalized child execution failure remains unproven and is not a retry authorization", () => {
  assert.equal(classify([{ ...child, txExecutionResultName: "FINISHED_WITH_ERROR" }]).status,
    "CHILD_FAILED_DELIVERY_UNPROVEN");
});

test("a delayed child remains unknown", () => {
  assert.equal(classify([{ ...child, statusName: "ACCEPTED" }]).status, "UNKNOWN");
});

test("missing child or mismatched identity is unknown, not proof of failure", () => {
  assert.equal(classify([]).status, "UNKNOWN");
  assert.equal(classify([{ ...child, to_address: other }]).status, "UNKNOWN");
});

test("duplicate matching finalized children are reported instead of collapsed into one payment", () => {
  const second = { ...child, hash: `0x${"2".repeat(64)}` };
  assert.deepEqual(classify([child, second]), {
    status: "DUPLICATE_DELIVERY_OBSERVED", matchingChildren: [child.hash, second.hash],
  });
  assert.equal(classify([child, child]).status, "DELIVERY_VERIFIED_BY_FINALIZED_CHILD");
});

test("unsafe numeric precision and wrong parent identity cannot verify payment", () => {
  assert.equal(classify([{ ...child, value: Number.MAX_SAFE_INTEGER + 1 }]).status, "UNKNOWN");
  assert.equal(classify([{ ...child, hash: undefined, txId: undefined }]).status, "UNKNOWN");
  assert.equal(classify([child], { parentRecipient: other }).status, "UNKNOWN");
});
