export const GEN = 10n ** 18n;
export const BASIS_POINTS = 10_000n;

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
