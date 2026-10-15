const text = (value) => value === undefined || value === null ? "" : String(value);
const lower = (value) => text(value).toLowerCase();
const number = (value) => Number(text(value));
const records = (value) => Array.isArray(value) ? value.filter((item) => item && typeof item === "object") : [];
const sameId = (left, right) => text(left) === text(right);

function exactVersion(record, args) {
  return record && text(record.epoch) === text(args?.[1])
    && lower(record.sha) === lower(args?.[2]) && lower(record.digest) === lower(args?.[3]);
}

/**
 * Reconcile a finalized Registry transaction with a state transition that was
 * observed after this hash was submitted. A matching historical record is not
 * sufficient: every successful result below requires a pre-state transition
 * or a newly-created record identity.
 */
export function reconcileCanonicalTransaction(item, before, after) {
  const args = item?.args ?? [];
  const method = item?.method;

  if (method === "register_program") {
    const beforeIds = new Set(records(before?.programs).map((record) => text(record.id)));
    const created = records(after?.programs).filter((record) => !beforeIds.has(text(record.id))
      && lower(record.publisher) === lower(item.account)
      && lower(record.repo) === lower(args[0])
      && text(record.rulebook_path) === text(args[1])
      && text(record.manifest_path) === text(args[2])
      && text(record.branch) === text(args[3])
      && lower(record.baseline_sha) === lower(args[4]));
    if (created.length === 1) return { verified: true, value: created[0] };
    return { verified: false, reason: created.length ? "more than one new matching program appeared" : "no uniquely attributable program was created" };
  }

  if (method === "verify_program") {
    const previous = before?.program;
    const current = after?.program;
    if (text(previous?.status) === "PROPOSED" && text(current?.status) === "VERIFIED"
        && lower(current?.active_sha) === lower(current?.baseline_sha)
        && text(current?.document_digest).length === 64) return { verified: true, value: current };
    return { verified: false, reason: "the submitted program did not transition from PROPOSED to VERIFIED" };
  }

  if (method === "request_revision") {
    const previousProgram = before?.program;
    const currentProgram = after?.program;
    const beforeIds = new Set(records(before?.reviews).map((record) => text(record.id)));
    const created = records(after?.reviews).filter((record) => !beforeIds.has(text(record.id))
      && sameId(record.program_id, args[0])
      && lower(record.candidate_sha) === lower(args[1])
      && text(record.status) === "PENDING");
    if (text(previousProgram?.pending_review) === "0" && number(currentProgram?.pending_review) > 0
        && created.length === 1 && sameId(currentProgram?.pending_review, created[0].id)) {
      return { verified: true, value: created[0] };
    }
    return { verified: false, reason: "no uniquely attributable pending review was created" };
  }

  if (method === "assess_revision" || method === "expire_revision_request") {
    const previous = before?.review;
    const current = after?.review;
    const expectedStatus = method === "expire_revision_request" ? "EXPIRED" : "";
    const assessed = method === "assess_revision" && ["MATERIAL", "NONMATERIAL", "INCONCLUSIVE"].includes(text(current?.status));
    if (text(previous?.status) === "PENDING" && sameId(current?.id, args[0])
        && ((expectedStatus && text(current?.status) === expectedStatus) || assessed)
        && number(current?.decided_at) > number(previous?.decided_at)) {
      return { verified: true, value: current };
    }
    return { verified: false, reason: "the review did not transition from PENDING for this transaction" };
  }

  if (method === "acknowledge_rules" || method === "reaffirm_rules") {
    const previous = records(before?.acknowledgments);
    const previousIds = new Set(previous.map((record) => text(record.index)));
    const created = records(after?.acknowledgments).filter((record) => !previousIds.has(text(record.index))
      && exactVersion(record, args));
    if (created.length === 1) return { verified: true, value: created[0] };
    return { verified: false, reason: "no new acknowledgment record was created; a historical or idempotent match is not proof" };
  }

  return { verified: false, reason: "no transaction-specific reconciliation rule exists" };
}

export function transactionStateLabel(state) {
  return ({
    pending: "PENDING",
    undetermined: "UNDETERMINED",
    cancelled: "CANCELED",
    "finalized-success": "FINALIZED_SUCCESS",
    "finalized-error": "FINALIZED_ERROR",
    "finalized-execution-unknown": "FINALIZED_EXECUTION_UNKNOWN",
    "rpc-unavailable": "RPC_UNAVAILABLE",
    "sender-unverified": "SENDER_UNVERIFIED",
    "sender-mismatch": "SENDER_MISMATCH",
    "contract-unverified": "CONTRACT_UNVERIFIED",
    "contract-mismatch": "CONTRACT_MISMATCH",
  })[state] ?? String(state).toUpperCase();
}
