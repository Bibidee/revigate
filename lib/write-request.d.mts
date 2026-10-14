import type { Address, CalldataEncodable } from "genlayer-js/types";
export function makeWriteRequest(input: { address: Address; functionName: string; args: CalldataEncodable[]; value?: bigint }): {
  address: Address; functionName: string; args: CalldataEncodable[]; value: bigint;
};
