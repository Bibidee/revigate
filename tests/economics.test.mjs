import test from "node:test";
import assert from "node:assert/strict";
import { exitAllocation, genToWei, GEN } from "../lib/economics.mjs";

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
