import assert from "node:assert/strict";
import test from "node:test";
import { webcrypto } from "node:crypto";
import { normalizeRulebookSource, parseRulebookClauses, sha256Hex, validateRevisionSourceIdentity } from "../lib/rulebook-source.mjs";

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

test("revision source identity binds the requested program and requires decided candidate digests", () => {
  const review = { program_id: "7", base_sha: "a".repeat(40), candidate_sha: "b".repeat(40), base_digest: "c".repeat(64), status: "INCONCLUSIVE", result: {} };
  assert.deepEqual(validateRevisionSourceIdentity("7", review), { candidateDigest: "", candidateAuthenticated: false });
  assert.throws(() => validateRevisionSourceIdentity("8", review), /different program/);
  assert.throws(() => validateRevisionSourceIdentity("7", { ...review, status: "MATERIAL" }), /missing its authenticated candidate digest/);
  assert.throws(() => validateRevisionSourceIdentity("7", { ...review, base_digest: "bad" }), /complete authenticated source/);
  assert.deepEqual(validateRevisionSourceIdentity("7", { ...review, status: "NONMATERIAL", result: { candidate_digest: "d".repeat(64) } }), { candidateDigest: "d".repeat(64), candidateAuthenticated: true });
});
