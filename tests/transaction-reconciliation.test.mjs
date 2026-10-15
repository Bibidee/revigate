import assert from "node:assert/strict";
import test from "node:test";
import { reconcileCanonicalTransaction, transactionStateLabel } from "../lib/transaction-reconciliation.mjs";

const account = `0x${"a".repeat(40)}`;
const registry = `0x${"b".repeat(40)}`;
const sha = "1".repeat(40);
const digest = "2".repeat(64);
const item = (method, args, preState = {}) => ({ hash: `0x${"c".repeat(64)}`, account, contractAddress: registry, method, args, preState });
const program = (id, extra = {}) => ({ id, publisher: account, repo: "bibidee/rulebook", rulebook_path: "rules/program.md", manifest_path: ".revigate/publisher.json", branch: "main", baseline_sha: sha, ...extra });

test("registration requires a newly created unique program identity", () => {
  const before = { programs: [program("1")] };
  const after = { programs: [program("2"), ...before.programs] };
  assert.equal(reconcileCanonicalTransaction(item("register_program", ["bibidee/rulebook", "rules/program.md", ".revigate/publisher.json", "main", sha]), before, after).verified, true);
  assert.equal(reconcileCanonicalTransaction(item("register_program", ["bibidee/rulebook", "rules/program.md", ".revigate/publisher.json", "main", sha]), before, before).verified, false);
});

test("verification requires a PROPOSED to VERIFIED transition", () => {
  const before = { program: program("1", { status: "PROPOSED" }) };
  const after = { program: program("1", { status: "VERIFIED", active_sha: sha, document_digest: digest }) };
  assert.equal(reconcileCanonicalTransaction(item("verify_program", ["1"]), before, after).verified, true);
  assert.equal(reconcileCanonicalTransaction(item("verify_program", ["1"]), { program: after.program }, after).verified, false);
});

test("revision request requires a new review and pending binding", () => {
  const before = { program: program("1", { pending_review: "0" }), reviews: [] };
  const review = { id: "4", program_id: "1", candidate_sha: sha, status: "PENDING" };
  const after = { program: program("1", { pending_review: "4" }), reviews: [review] };
  assert.equal(reconcileCanonicalTransaction(item("request_revision", ["1", sha]), before, after).verified, true);
  assert.equal(reconcileCanonicalTransaction(item("request_revision", ["1", sha]), before, { ...after, reviews: [{ ...review, id: "3" }] }).verified, false);
});

test("assessment and expiration require a review transition from pending", () => {
  const before = { review: { id: "4", status: "PENDING", decided_at: "0" } };
  assert.equal(reconcileCanonicalTransaction(item("assess_revision", ["4"]), before, { review: { id: "4", status: "MATERIAL", decided_at: "9" } }).verified, true);
  assert.equal(reconcileCanonicalTransaction(item("assess_revision", ["4"]), { review: { id: "4", status: "MATERIAL", decided_at: "9" } }, { review: { id: "4", status: "MATERIAL", decided_at: "9" } }).verified, false);
  assert.equal(reconcileCanonicalTransaction(item("expire_revision_request", ["4"]), before, { review: { id: "4", status: "EXPIRED", decided_at: "9" } }).verified, true);
});

test("acknowledgment replay with matching historical state is unverified", () => {
  const args = ["1", "3", sha, digest];
  const ack = { index: "1", epoch: "3", sha, digest };
  assert.equal(reconcileCanonicalTransaction(item("acknowledge_rules", args), { acknowledgments: [] }, { acknowledgments: [ack] }).verified, true);
  assert.equal(reconcileCanonicalTransaction(item("acknowledge_rules", args), { acknowledgments: [ack] }, { acknowledgments: [ack] }).verified, false);
  assert.equal(reconcileCanonicalTransaction(item("reaffirm_rules", args), { acknowledgments: [ack] }, { acknowledgments: [{ ...ack, index: "2" }, ack] }).verified, true);
});

test("state labels keep unknown, delayed, cancellation and RPC absence distinct", () => {
  assert.equal(transactionStateLabel("pending"), "PENDING");
  assert.equal(transactionStateLabel("finalized-execution-unknown"), "FINALIZED_EXECUTION_UNKNOWN");
  assert.equal(transactionStateLabel("undetermined"), "UNDETERMINED");
  assert.equal(transactionStateLabel("cancelled"), "CANCELED");
  assert.equal(transactionStateLabel("rpc-unavailable"), "RPC_UNAVAILABLE");
});

test("wallet, registry and chain scoping remain part of pending identity", () => {
  const pending = item("verify_program", ["1"]);
  assert.equal(pending.account, account);
  assert.equal(pending.contractAddress, registry);
  assert.equal(pending.preState && typeof pending.preState, "object");
});
