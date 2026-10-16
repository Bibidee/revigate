export function makeWriteRequest({ address, functionName, args, value = 0n }) {
  if (typeof value !== "bigint" || value < 0n) throw new Error("Attached native value must be a non-negative bigint.");
  return { address, functionName, args, value };
}
