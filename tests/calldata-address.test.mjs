import assert from "node:assert/strict";
import test from "node:test";
import { CalldataAddress } from "genlayer-js/types";
import { encodeAddressArguments } from "../lib/calldata-address.mjs";

const WALLET = "0x1234567890abcdef1234567890abcdef12345678";

test("encodes the participant argument to register_offer as an address", () => {
  const args = encodeAddressArguments("register_offer", [1n, WALLET, 10n]);
  assert.ok(args[1] instanceof CalldataAddress);
  assert.deepEqual([...args[1].bytes], [...Buffer.from(WALLET.slice(2), "hex")]);
  assert.equal(args[0], 1n);
  assert.equal(args[2], 10n);
});

test("encodes wallet-index and acknowledgment reads as addresses", () => {
  const offerPage = encodeAddressArguments("get_wallet_offer_page", [WALLET, 0n, 20n]);
  const acknowledgment = encodeAddressArguments("get_acknowledgment", [1n, WALLET]);
  const credit = encodeAddressArguments("get_wallet_credit", [WALLET]);
  assert.ok(offerPage[0] instanceof CalldataAddress);
  assert.ok(acknowledgment[1] instanceof CalldataAddress);
  assert.ok(credit[0] instanceof CalldataAddress);
});

test("rejects malformed values for address-typed arguments", () => {
  assert.throws(
    () => encodeAddressArguments("register_offer", [1n, "not-an-address", 10n]),
    /valid 20-byte address/,
  );
});

test("leaves non-address arguments and unrelated methods unchanged", () => {
  const args = [1n, WALLET, 10n];
  const encoded = encodeAddressArguments("register_offer", args);
  assert.equal(encoded[0], args[0]);
  assert.equal(encoded[2], args[2]);
  assert.equal(encodeAddressArguments("get_program", args), args);
});
