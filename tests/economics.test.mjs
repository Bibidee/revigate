import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CONTRACT_WRITE_METHODS, exitAllocation, genToWei, GEN, isContractWriteAllowed,
  isCustodyWriteAllowed,
  isDuplicatePendingWrite, isEscrowWriteEnabled,
} from "../lib/economics.mjs";

test("20 percent exit of 10 GEN allocates the exact complement", () => {
  assert.deepEqual(exitAllocation(10n * GEN, 2_000n), { publisher: 8n * GEN, participant: 2n * GEN });
});
test("floor rounding assigns all remainder to publisher", () => {
  assert.deepEqual(exitAllocation(1n, 3_333n), { publisher: 1n, participant: 0n });
});
test("basis point endpoints conserve the whole amount", () => {
  assert.deepEqual(exitAllocation(123n, 0n), { publisher: 123n, participant: 0n });
  assert.deepEqual(exitAllocation(123n, 10_000n), { publisher: 0n, participant: 123n });
});
test("invalid amounts and percentages are rejected", () => {
  assert.throws(() => exitAllocation(0n, 0n), RangeError);
  assert.throws(() => exitAllocation(1n, 10_001n), RangeError);
});
test("GEN parser uses integer wei and rejects excess precision", () => {
  assert.equal(genToWei("0", "01"), 10n ** 16n);
  assert.throws(() => genToWei("1", "1234567890123456789"), TypeError);
});

test("escrow writes require development mode and explicit opt-in", () => {
  assert.equal(isEscrowWriteEnabled("production", "true"), false);
  assert.equal(isEscrowWriteEnabled("production", undefined), false);
  assert.equal(isEscrowWriteEnabled("development", undefined), false);
  assert.equal(isEscrowWriteEnabled("development", "false"), false);
  assert.equal(isEscrowWriteEnabled("development", "true"), true);
  assert.equal(isEscrowWriteEnabled("preview", "true"), false);
});

test("every workbench contract write is blocked outside explicit development opt-in", () => {
  const source = readFileSync(new URL("../components/contract-workbench.tsx", import.meta.url), "utf8");
  const methods = [...source.matchAll(/write\("([a-z_]+)"/g)].map((match) => match[1]);
  assert.ok(methods.length > 0);
  for (const method of methods) {
    assert.ok(CONTRACT_WRITE_METHODS.includes(method), "unlisted contract write: " + method);
    assert.equal(isContractWriteAllowed("production", "true", method), false, method + " in production");
    assert.equal(isContractWriteAllowed("preview", "true", method), false, method + " in preview");
    assert.equal(isContractWriteAllowed("development", undefined, method), false, method + " without opt-in");
    assert.equal(isContractWriteAllowed("development", "true", method), true, method + " with opt-in");
  }
  assert.equal(isContractWriteAllowed("development", "true", "unrecognized_method"), false);
});

test("funding and withdrawal stay locked when the paired Vault disables custody", () => {
  for (const method of ["fund_offer", "withdraw_credit", "record_transfer_delivery_claim"]) {
    assert.equal(isCustodyWriteAllowed(false, method), false, method);
    assert.equal(isCustodyWriteAllowed(true, method), true, method);
  }
  assert.equal(isCustodyWriteAllowed(false, "register_program"), true);
});

test("an unresolved exact transaction cannot be submitted again", () => {
  const pending = {
    hash: `0x${"1".repeat(64)}`,
    account: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    method: "fund_offer",
    args: ["7"],
    value: "101",
    contractAddress: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    chainId: 61999,
  };
  assert.equal(isDuplicatePendingWrite(pending, { ...pending, account: pending.account.toUpperCase() }), true);
  assert.equal(isDuplicatePendingWrite(pending, { ...pending, args: ["8"] }), false);
  assert.equal(isDuplicatePendingWrite(pending, { ...pending, account: "0xcccccccccccccccccccccccccccccccccccccccc" }), false);
  assert.equal(isDuplicatePendingWrite(pending, { ...pending, value: "102" }), false);
  assert.equal(isDuplicatePendingWrite(pending, { ...pending, chainId: 1 }), false);
});
