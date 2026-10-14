import type { CalldataEncodable } from "genlayer-js/types";

export function encodeAddressArguments(
  functionName: string,
  args: CalldataEncodable[],
): CalldataEncodable[];
