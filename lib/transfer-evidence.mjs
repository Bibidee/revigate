const FINALIZED = "FINALIZED";
const SUCCESS = "FINISHED_WITH_RETURN";

function sameAddress(left, right) {
  return typeof left === "string" && typeof right === "string"
    && /^0x[0-9a-fA-F]{40}$/.test(left)
    && left.toLowerCase() === right.toLowerCase();
}

function exactInteger(value) {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 0 ? BigInt(value) : undefined;
  }
  if (typeof value === "string" && (/^\d+$/.test(value) || /^0x[0-9a-f]+$/i.test(value))) return BigInt(value);
  if (typeof value === "bigint" && value >= 0n) return value;
  return undefined;
}

/**
 * Classify only facts exposed by the read-only GenLayer transaction API.
 * A successful child result is not proof that the recipient's balance changed.
 * This result never changes the contract's UNKNOWN_DELIVERY state.
 */
export function classifyOutgoingTransfer({
  parentStatus,
  parentExecution,
  parentRecipient,
  expectedVault,
  expectedRecipient,
  expectedAmount,
  children,
}) {
  const amount = exactInteger(expectedAmount);
  if (!sameAddress(parentRecipient, expectedVault) || amount === undefined || !Array.isArray(children)) {
    return { status: "UNKNOWN", matchingChildren: [] };
  }

  const matchingChildren = children.filter((child) => {
    const hash = child?.hash ?? child?.txId;
    const requestedHash = child?.requestedHash;
    const from = child?.from_address ?? child?.sender;
    const to = child?.to_address ?? child?.recipient;
    const value = exactInteger(child?.value);
    return typeof hash === "string" && /^0x[0-9a-fA-F]{64}$/.test(hash)
      && (requestedHash === undefined || (typeof requestedHash === "string" && requestedHash.toLowerCase() === hash.toLowerCase()))
      && sameAddress(from, expectedVault)
      && sameAddress(to, expectedRecipient)
      && value === amount;
  });
  const uniqueChildren = [...new Map(matchingChildren.map((child) => [
    (child.hash ?? child.txId).toLowerCase(), child,
  ])).values()];
  const hashes = uniqueChildren.map((child) => child.hash ?? child.txId);
  if (parentStatus !== FINALIZED || parentExecution !== SUCCESS) {
    return { status: "UNKNOWN", matchingChildren: hashes };
  }
  const successful = uniqueChildren.filter((child) =>
    child.statusName === FINALIZED && child.txExecutionResultName === SUCCESS);
  if (successful.length > 1) return { status: "DUPLICATE_SUCCESSFUL_CHILDREN", matchingChildren: hashes };
  if (successful.length === 1) return { status: "CHILD_FINALIZED_SUCCESS", matchingChildren: hashes };
  const failed = uniqueChildren.filter((child) => child.statusName === FINALIZED
    && child.txExecutionResultName === "FINISHED_WITH_ERROR");
  if (failed.length > 0) return { status: "CHILD_FINALIZED_FAILURE", matchingChildren: hashes };
  if (uniqueChildren.some((child) => child.statusName === "UNDETERMINED")) {
    return { status: "CHILD_UNDETERMINED", matchingChildren: hashes };
  }
  if (uniqueChildren.some((child) => child.statusName === "CANCELED")) {
    return { status: "CHILD_CANCELLED", matchingChildren: hashes };
  }
  if (uniqueChildren.some((child) => child.statusName && child.statusName !== FINALIZED)) {
    return { status: "CHILD_PENDING", matchingChildren: hashes };
  }
  return { status: "UNKNOWN", matchingChildren: hashes };
}

/**
 * Compare independently read recipient balances. A matching delta is an
 * observed balance fact, not proof that this particular child caused it.
 */
export function classifyRecipientBalanceDelta({ before, after, expectedAmount }) {
  const start = exactInteger(before);
  const end = exactInteger(after);
  const amount = exactInteger(expectedAmount);
  if (start === undefined || end === undefined || amount === undefined || end < start) {
    return { status: "BALANCE_DELTA_UNKNOWN" };
  }
  return {
    status: end - start === amount ? "BALANCE_DELTA_MATCHED" : "BALANCE_DELTA_MISMATCHED",
    observedDelta: (end - start).toString(),
  };
}
