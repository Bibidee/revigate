import { CalldataAddress } from "genlayer-js/types";

const ADDRESS_ARGUMENTS = new Map([
  ["get_acknowledgment", [1]],
  ["get_wallet_credit", [0]],
  ["get_wallet_offer_page", [0]],
  ["register_offer", [1]],
]);

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

export function encodeAddressArguments(functionName, args) {
  const addressIndexes = ADDRESS_ARGUMENTS.get(functionName);
  if (!addressIndexes) return args;

  return args.map((argument, index) => {
    if (!addressIndexes.includes(index)) return argument;
    if (argument instanceof CalldataAddress) return argument;
    if (typeof argument !== "string" || !ADDRESS_PATTERN.test(argument)) {
      throw new Error(`Argument ${index + 1} for ${functionName} must be a valid 20-byte address.`);
    }

    const addressBytes = Uint8Array.from(
      argument.slice(2).match(/.{2}/g),
      (byte) => Number.parseInt(byte, 16),
    );
    return new CalldataAddress(addressBytes);
  });
}
