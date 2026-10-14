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
  if (typeof value === "string" && /^\d+$/.test(value)) return BigInt(value);
  if (typeof value === "bigint" && value >= 0n) return value;
  return undefined;
}

/**
 * Classify only facts exposed by the read-only GenLayer transaction API.
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
  if (parentStatus !== FINALIZED || parentExecution !== SUCCESS
      || !sameAddress(parentRecipient, expectedVault) || amount === undefined
      || !Array.isArray(children)) {
    return { status: "UNKNOWN", matchingChildren: [] };
  }

  const matchingChildren = children.filter((child) => {
    const hash = child?.hash ?? child?.txId;
    const from = child?.from_address ?? child?.sender;
    const to = child?.to_address ?? child?.recipient;
    const value = exactInteger(child?.value);
    return typeof hash === "string" && /^0x[0-9a-fA-F]{64}$/.test(hash)
      && sameAddress(from, expectedVault)
      && sameAddress(to, expectedRecipient)
      && value === amount;
  });
  const uniqueChildren = [...new Map(matchingChildren.map((child) => [
    (child.hash ?? child.txId).toLowerCase(), child,
  ])).values()];
  const hashes = uniqueChildren.map((child) => child.hash ?? child.txId);
  const successful = uniqueChildren.filter((child) =>
    child.statusName === FINALIZED && child.txExecutionResultName === SUCCESS);
  if (successful.length > 1) return { status: "DUPLICATE_DELIVERY_OBSERVED", matchingChildren: hashes };
  if (successful.length === 1) return { status: "DELIVERY_VERIFIED_BY_FINALIZED_CHILD", matchingChildren: hashes };
  const failed = uniqueChildren.filter((child) => child.statusName === FINALIZED
    && child.txExecutionResultName && child.txExecutionResultName !== SUCCESS);
  if (failed.length > 0) return { status: "CHILD_FAILED_DELIVERY_UNPROVEN", matchingChildren: hashes };
  return { status: "UNKNOWN", matchingChildren: hashes };
}
