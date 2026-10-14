export const GEN = 10n ** 18n;
export const BASIS_POINTS = 10_000n;

export function isEscrowWriteEnabled(environment, explicitOptIn) {
  return environment === "development" && explicitOptIn === "true";
}

export const CONTRACT_WRITE_METHODS = Object.freeze([
  "register_program",
  "verify_program",
  "expire_unverified_program",
  "acknowledge_rules",
  "register_offer",
  "fund_offer",
  "accept_offer",
  "decline_offer",
  "cancel_unaccepted_offer",
  "expire_unaccepted_offer",
  "request_revision",
  "assess_revision",
  "expire_revision_request",
  "reconcile_vault_program",
  "reaffirm_rules",
  "reaffirm_offer_rules",
  "exercise_material_exit",
  "allocate_matured_claim",
  "withdraw_credit",
  "record_transfer_delivery_claim",
  "reconcile_transfer_unknown",
  "propose_closure",
  "approve_closure",
  "cancel_closure",
  "expire_closure",
]);

export const CUSTODY_REQUIRED_METHODS = Object.freeze([
  "fund_offer",
  "withdraw_credit",
  "record_transfer_delivery_claim",
]);

export function isCustodyWriteAllowed(custodyEnabled, method) {
  return !CUSTODY_REQUIRED_METHODS.includes(method) || custodyEnabled === true;
}

export function isContractWriteAllowed(environment, explicitOptIn, method) {
  return CONTRACT_WRITE_METHODS.includes(method)
    && isEscrowWriteEnabled(environment, explicitOptIn);
}

export function isDuplicatePendingWrite(pending, candidate) {
  if (!pending || !candidate || !Array.isArray(pending.args) || !Array.isArray(candidate.args)) return false;
  const sameAddress = (left, right) => typeof left === "string" && typeof right === "string"
    && left.toLowerCase() === right.toLowerCase();
  return sameAddress(pending.account, candidate.account)
    && pending.method === candidate.method
    && sameAddress(pending.contractAddress, candidate.contractAddress)
    && pending.chainId === candidate.chainId
    && String(pending.value) === String(candidate.value)
    && JSON.stringify(pending.args) === JSON.stringify(candidate.args);
}

export function exitAllocation(amount, exitBps) {
  if (amount <= 0n) throw new RangeError("amount must be positive");
  if (exitBps < 0n || exitBps > BASIS_POINTS) throw new RangeError("exit basis points out of range");
  const participant = amount * exitBps / BASIS_POINTS;
  return { publisher: amount - participant, participant };
}

export function genToWei(whole, fraction = "") {
  if (!/^\d+$/.test(whole) || !/^\d{0,18}$/.test(fraction)) throw new TypeError("GEN amount must have up to 18 decimal places");
  return BigInt(whole) * GEN + BigInt((fraction + "0".repeat(18)).slice(0, 18));
}
