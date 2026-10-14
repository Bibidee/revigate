import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { classifyOutgoingTransfer } from "../lib/transfer-evidence.mjs";

const [parentHash, vault, recipient, amountText] = process.argv.slice(2);
if (!/^0x[0-9a-fA-F]{64}$/.test(parentHash ?? "")
    || !/^0x[0-9a-fA-F]{40}$/.test(vault ?? "")
    || !/^0x[0-9a-fA-F]{40}$/.test(recipient ?? "")
    || !/^\d+$/.test(amountText ?? "")) {
  throw new Error("Provide a parent transaction hash, Vault address, recipient address, and decimal amount in wei.");
}
if (Number(studionet.id) !== 61999) throw new Error(`Expected Studionet chain 61999, got ${studionet.id}.`);

const client = createClient({ chain: studionet, endpoint: "https://studio.genlayer.com/api" });
const parent = await client.getTransaction({ hash: parentHash });
const childHashes = await client.getTriggeredTransactionIds({ hash: parentHash });
if (!parent || !Array.isArray(childHashes)) throw new Error("Studionet did not return the parent or its child transaction IDs.");
const getReceipt = async (hash) => {
  try {
    return await client.request({ method: "gen_getTransactionReceipt", params: [{ txId: hash }] });
  } catch (error) {
    return { receipt_unavailable: error instanceof Error ? error.message : String(error) };
  }
};
const [parentReceipt, ...childReceipts] = await Promise.all([parentHash, ...childHashes].map(getReceipt));
const children = await Promise.all(childHashes.map(async (requestedHash) => {
  const transaction = await client.getTransaction({ hash: requestedHash });
  return transaction ? { ...transaction, requestedHash } : { requestedHash };
}));
const evidence = classifyOutgoingTransfer({
  parentStatus: String(parent.statusName ?? ""),
  parentExecution: String(parent.txExecutionResultName ?? ""),
  parentRecipient: parent.to_address ?? parent.recipient,
  expectedVault: vault,
  expectedRecipient: recipient,
  expectedAmount: BigInt(amountText),
  children,
});
const recipientBalance = await client.request({ method: "eth_getBalance", params: [recipient, "latest"] });
console.log(JSON.stringify({
  network: "GenLayer Studionet",
  chain_id: 61999,
  parent_hash: parentHash,
  parent: {
    hash: parent.hash ?? parent.txId,
    status: parent.statusName,
    numeric_status: parent.status,
    result: parent.resultName,
    result_value: parent.result,
    raw_result_name: parent.result_name,
    execution: parent.txExecutionResultName,
    numeric_execution: parent.txExecutionResult,
    raw_execution_name: parent.tx_execution_result_name,
    raw_execution_value: parent.tx_execution_result,
    fields_returned: Object.keys(parent).sort(),
    recipient: parent.to_address ?? parent.recipient,
    receipt: parentReceipt,
  },
  child_hashes_from_parent: childHashes,
  children_returned: children.map((child) => ({
    requested_hash: child.requestedHash,
    hash: child.hash ?? child.txId,
    status: child.statusName,
    numeric_status: child.status,
    result: child.resultName,
    result_value: child.result,
    raw_result_name: child.result_name,
    execution: child.txExecutionResultName,
    numeric_execution: child.txExecutionResult,
    raw_execution_name: child.tx_execution_result_name,
    raw_execution_value: child.tx_execution_result,
    sender: child.from_address ?? child.sender,
    recipient: child.to_address ?? child.recipient,
    value: child.value,
    fields_returned: Object.keys(child).sort(),
    receipt: childReceipts[childHashes.indexOf(child.requestedHash)],
  })),
  child_evidence: evidence,
  current_recipient_balance_rpc: recipientBalance,
  balance_note: "This is a current balance read, not a before/after delta and not proof of this child's causal credit.",
  automatic_replay: false,
}, (_key, value) => typeof value === "bigint" ? value.toString() : value, 2));
