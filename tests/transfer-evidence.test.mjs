import assert from "node:assert/strict";
import test from "node:test";
import { classifyOutgoingTransfer, classifyRecipientBalanceDelta } from "../lib/transfer-evidence.mjs";

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

test("one finalized successful child reports execution only, not recipient delivery", () => {
  assert.deepEqual(classify([child]), {
    status: "CHILD_FINALIZED_SUCCESS", matchingChildren: [child.hash],
  });
});

test("a finalized child execution failure remains distinct and is not retry authorization", () => {
  assert.equal(classify([{ ...child, txExecutionResultName: "FINISHED_WITH_ERROR" }]).status,
    "CHILD_FINALIZED_FAILURE");
});

test("a finalized child with omitted or NOT_VOTED execution remains unknown", () => {
  assert.equal(classify([{ ...child, txExecutionResultName: undefined }]).status, "UNKNOWN");
  assert.equal(classify([{ ...child, txExecutionResultName: "NOT_VOTED" }]).status, "UNKNOWN");
});

test("a delayed child remains explicitly pending", () => {
  assert.equal(classify([{ ...child, statusName: "ACCEPTED" }]).status, "CHILD_PENDING");
  assert.equal(classify([{ ...child, statusName: "UNDETERMINED" }]).status, "CHILD_UNDETERMINED");
  assert.equal(classify([{ ...child, statusName: "CANCELED" }]).status, "CHILD_CANCELLED");
});

test("missing child or mismatched identity is unknown, not proof of failure", () => {
  assert.equal(classify([]).status, "UNKNOWN");
  assert.equal(classify([{ ...child, to_address: other }]).status, "UNKNOWN");
});

test("duplicate matching finalized children are reported instead of collapsed into one payment", () => {
  const second = { ...child, hash: `0x${"2".repeat(64)}` };
  assert.deepEqual(classify([child, second]), {
    status: "DUPLICATE_SUCCESSFUL_CHILDREN", matchingChildren: [child.hash, second.hash],
  });
  assert.equal(classify([child, child]).status, "CHILD_FINALIZED_SUCCESS");
});

test("unsafe numeric precision and wrong parent identity cannot verify payment", () => {
  assert.equal(classify([{ ...child, value: Number.MAX_SAFE_INTEGER + 1 }]).status, "UNKNOWN");
  assert.equal(classify([{ ...child, hash: undefined, txId: undefined }]).status, "UNKNOWN");
  assert.equal(classify([child], { parentRecipient: other }).status, "UNKNOWN");
});

test("missing parent execution evidence preserves exact child identity but cannot call it successful", () => {
  assert.deepEqual(classify([child], { parentExecution: "" }), {
    status: "UNKNOWN", matchingChildren: [child.hash],
  });
});

test("a child response whose transaction ID differs from its parent-reported ID is ignored", () => {
  assert.equal(classify([{ ...child, requestedHash: `0x${"2".repeat(64)}` }]).status, "UNKNOWN");
});

test("recipient balance delta is reported separately from child finality", () => {
  assert.deepEqual(classifyRecipientBalanceDelta({ before: "100", after: "101", expectedAmount: 1n }),
    { status: "BALANCE_DELTA_MATCHED", observedDelta: "1" });
  assert.deepEqual(classifyRecipientBalanceDelta({ before: 100n, after: 100n, expectedAmount: 1n }),
    { status: "BALANCE_DELTA_MISMATCHED", observedDelta: "0" });
  assert.deepEqual(classifyRecipientBalanceDelta({ before: 100, after: Number.MAX_SAFE_INTEGER + 1, expectedAmount: 1n }),
    { status: "BALANCE_DELTA_UNKNOWN" });
});
