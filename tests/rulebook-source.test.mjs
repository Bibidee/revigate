import assert from "node:assert/strict";
import test from "node:test";
import { webcrypto } from "node:crypto";
import { normalizeRulebookSource, parseRulebookClauses, sha256Hex } from "../lib/rulebook-source.mjs";

test("authenticated source normalization matches Registry newline, BOM, and NFC rules", async () => {
  const source = "## R-01: Cafe\r\nCafe\u0301 access.\r\n\r\n## R-02: Benefit\rBenefit.\r";
  const normalized = normalizeRulebookSource(source);
  assert.equal(normalized, "## R-01: Cafe\nCafé access.\n\n## R-02: Benefit\nBenefit.\n");
  assert.equal(await sha256Hex(source, webcrypto), await sha256Hex(normalized, webcrypto));
  assert.throws(() => normalizeRulebookSource("\uFEFF" + source), /encoding is not canonical/);
});

test("revision comparison parses bounded clause identifiers and rejects duplicates", () => {
  const source = "## R-01: Eligibility\nAdults qualify.\n\n## R-02: Benefit\nAccess is granted.\n";
  assert.deepEqual(parseRulebookClauses(source), {
    "R-01": { title: "Eligibility", body: "Adults qualify." },
    "R-02": { title: "Benefit", body: "Access is granted." },
  });
  assert.throws(() => parseRulebookClauses(source.replace("R-02", "R-01")), /structure is invalid/);
});
