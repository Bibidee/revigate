"use client";

import { useEffect, useRef, useState } from "react";
import { isContractWriteAllowed, isCustodyWriteAllowed, isDuplicatePendingWrite, isEscrowWriteEnabled } from "@/lib/economics.mjs";
import {
  forgetPendingTransaction,
  getConfiguredAddressForMethod,
  contractTargetForMethod,
  loadPendingTransactions,
  observeTransaction,
  observeOutgoingTransfer,
  readRevigate,
  savePendingTransaction,
  submitRevigateWrite,
  STUDIONET_CHAIN_ID,
  verifyRevigateDeployment,
} from "@/lib/genlayer";
import type { Eip1193Provider, Hash, PendingTransaction } from "@/lib/genlayer";
import { watchWallet, submitAndPersistHash } from "@/lib/wallet-session.mjs";

const contractConfigured = Boolean(process.env.NEXT_PUBLIC_REVIGATE_REGISTRY && process.env.NEXT_PUBLIC_REVIGATE_VAULT);
const escrowWritesEnabled = isEscrowWriteEnabled(process.env.NODE_ENV, process.env.NEXT_PUBLIC_REVIGATE_ESCROW_ENABLED);

type WorkbenchMode = "publisher" | "participant";
type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : null;
}

function asInteger(value: unknown, label: string): bigint {
  const stringValue = String(value).trim();
  if (!/^\d+$/.test(stringValue)) throw new Error(`${label} must be a whole, non-negative integer.`);
  return BigInt(stringValue);
}

function pretty(value: unknown) {
  return JSON.stringify(value, (_key, item: unknown) => typeof item === "bigint" ? item.toString() : item, 2);
}

function readArg(args: PendingTransaction["args"], index: number, label: string): bigint {
  if (!args || args[index] === undefined) throw new Error(`Saved ${label} is unavailable; keep the transaction hash for manual review.`);
  return asInteger(args[index], label);
}

function sameInteger(left: unknown, right: bigint | number | string) {
  try { return BigInt(String(left)) === BigInt(right); } catch { return false; }
}

function pageItems(result: unknown): RecordValue[] {
  const page = asRecord(result);
  return Array.isArray(page?.items) ? page.items.map(asRecord).filter((item): item is RecordValue => Boolean(item)) : [];
}

async function canonicalReadback(item: PendingTransaction): Promise<{ kind: "verified" | "unavailable"; detail: string; offer?: RecordValue; program?: RecordValue; review?: RecordValue }> {
  const args = item.args;
  const method = item.method;
  const offerById = async (idIndex = 0) => {
    const result = asRecord(await readRevigate("get_offer", [readArg(args, idIndex, "offer ID")]));
    if (!result || !Object.keys(result).length) throw new Error("The offer is not present in canonical contract state.");
    return result;
  };
  const programById = async (idIndex = 0) => {
    const result = asRecord(await readRevigate("get_program", [readArg(args, idIndex, "program ID")]));
    if (!result || !Object.keys(result).length) throw new Error("The program is not present in canonical contract state.");
    return result;
  };
  const requireOffer = (offer: RecordValue, predicate: boolean, label: string) => {
    if (!predicate) throw new Error(`Canonical offer readback does not match ${label}.`);
    return { kind: "verified" as const, detail: `${label}\n${pretty(offer)}`, offer };
  };

  if (["fund_offer", "accept_offer", "decline_offer", "cancel_unaccepted_offer", "expire_unaccepted_offer", "exercise_material_exit", "allocate_matured_claim", "propose_closure", "approve_closure", "cancel_closure", "expire_closure"].includes(method)) {
    const offer = await offerById();
    const amount = BigInt(String(offer.principal ?? offer.amount));
    if (method === "fund_offer") {
      return requireOffer(offer, offer.state === "FUNDED_UNACCEPTED" && sameInteger(offer.held, amount) && sameInteger(item.value, amount), "funded offer amount and state");
    }
    if (method === "accept_offer") {
      return requireOffer(offer, offer.state === "ACCEPTED_LOCKED" && offer.accepted === true
        && offer.agreement_id === args?.[1] && sameInteger(offer.epoch, readArg(args, 2, "offer epoch"))
        && String(offer.sha).toLowerCase() === String(args?.[3]).toLowerCase(), "accepted frozen terms, epoch, and commit");
    }
    if (method === "decline_offer") {
      return requireOffer(offer, offer.state === "REFUND_ALLOCATED" && sameInteger(offer.allocated_publisher, amount) && sameInteger(offer.allocated_participant, 0), "participant decline refund allocation");
    }
    if (method === "cancel_unaccepted_offer") {
      return requireOffer(offer, offer.state === "CANCELLED_UNFUNDED" || (offer.state === "REFUND_ALLOCATED" && sameInteger(offer.allocated_publisher, amount) && sameInteger(offer.allocated_participant, 0)), "publisher cancellation/refund");
    }
    if (method === "expire_unaccepted_offer") {
      return requireOffer(offer, offer.state === "EXPIRED_UNFUNDED" || (offer.state === "REFUND_ALLOCATED" && sameInteger(offer.allocated_publisher, amount) && sameInteger(offer.allocated_participant, 0)), "expired-offer refund");
    }
    if (method === "exercise_material_exit") {
      const participantShare = (amount * BigInt(String(offer.exit_bps))) / 10000n;
      const publisherShare = amount - participantShare;
      return requireOffer(offer, offer.state === "MATERIAL_EXIT_ALLOCATED" && sameInteger(offer.held, 0)
        && sameInteger(offer.allocated_publisher, publisherShare) && sameInteger(offer.allocated_participant, participantShare), "original early-exit split");
    }
    if (method === "allocate_matured_claim") {
      return requireOffer(offer, offer.state === "MATURED_ALLOCATED" && sameInteger(offer.held, 0)
        && sameInteger(offer.allocated_participant, amount), "full original maturity entitlement");
    }
    if (method === "propose_closure") {
      const closure = asRecord(offer.closure);
      return requireOffer(offer, offer.state === "ACCEPTED_LOCKED" && closure !== null
        && sameInteger(closure.publisher_amount, readArg(args, 1, "publisher share"))
        && sameInteger(closure.participant_amount, readArg(args, 2, "participant share"))
        && sameInteger(closure.expires_at, readArg(args, 3, "closure expiry")), "pending mutual-closure shares and deadline");
    }
    if (method === "approve_closure") {
      return requireOffer(offer, offer.state === "MUTUAL_CLOSURE_ALLOCATED" && sameInteger(offer.held, 0)
        && sameInteger(BigInt(String(offer.allocated_publisher)) + BigInt(String(offer.allocated_participant)), amount), "mutual closure allocation");
    }
    if (method === "cancel_closure" || method === "expire_closure") {
      return requireOffer(offer, offer.state === "ACCEPTED_LOCKED" && offer.closure === null, "cleared mutual-closure proposal");
    }
  }

  if (method === "verify_program") {
    const program = await programById();
    const vaultSnapshot = asRecord(await readRevigate("get_program", [readArg(args, 0, "program ID")], "vault"));
    if (!vaultSnapshot || !sameInteger(vaultSnapshot.epoch, String(program.epoch))
        || String(vaultSnapshot.sha).toLowerCase() !== String(program.active_sha).toLowerCase()
        || String(vaultSnapshot.document_digest) !== String(program.document_digest)) {
      throw new Error("Registry verification finalized, but the paired Vault snapshot is not synchronized. Keep the hash and reconcile the child message before continuing.");
    }
    return program.status === "VERIFIED" && String(program.active_sha).toLowerCase() === String(program.baseline_sha).toLowerCase()
      && /^[0-9a-f]{64}$/i.test(String(program.document_digest))
      ? { kind: "verified", detail: `Verified baseline program and paired Vault snapshot\n${pretty(program)}\nVault snapshot:\n${pretty(vaultSnapshot)}`, program }
      : (() => { throw new Error("Canonical program readback does not match verified baseline state."); })();
  }
  if (method === "request_revision") {
    const [programId, candidateSha] = [readArg(args, 0, "program ID"), String(args?.[1] ?? "").toLowerCase()];
    const matches = pageItems(await readRevigate("get_review_page", [0n, 50n]))
      .filter((record) => sameInteger(record.program_id, programId) && String(record.candidate_sha).toLowerCase() === candidateSha && record.status === "PENDING");
    if (matches.length !== 1) throw new Error("Canonical review readback is missing or ambiguous; keep the transaction hash.");
    return { kind: "verified", detail: `Pending revision request\n${pretty(matches[0])}`, review: matches[0] };
  }
  if (method === "assess_revision" || method === "expire_revision_request") {
    const review = asRecord(await readRevigate("get_review", [readArg(args, 0, "review ID")]));
    const validStatus = method === "expire_revision_request" ? review?.status === "EXPIRED"
      : ["MATERIAL", "NONMATERIAL", "INCONCLUSIVE"].includes(String(review?.status));
    if (!review || !validStatus) throw new Error("Canonical review readback does not match a finalized review outcome.");
    const outcome = asRecord(review.result);
    if (method === "assess_revision" && (!outcome || outcome.outcome !== review.status
      || String(outcome.candidate_sha).toLowerCase() !== String(review.candidate_sha).toLowerCase())) {
      throw new Error("Canonical review result and stored evidence do not match.");
    }
    if (method === "assess_revision" && ["MATERIAL", "NONMATERIAL"].includes(String(review.status))) {
      const reviewProgramId = asInteger(String(review.program_id), "Program ID");
      const program = asRecord(await readRevigate("get_program", [reviewProgramId]));
      const vaultSnapshot = asRecord(await readRevigate("get_program", [reviewProgramId], "vault"));
      if (!program || !vaultSnapshot || !sameInteger(program.epoch, String(vaultSnapshot.epoch))
          || String(program.active_sha).toLowerCase() !== String(vaultSnapshot.sha).toLowerCase()
          || String(program.document_digest) !== String(vaultSnapshot.document_digest)) {
        throw new Error("The Registry review finalized, but Vault propagation is not synchronized. Keep the hash and reconcile before acting on the changed version.");
      }
    }
    return { kind: "verified", detail: `Canonical review outcome\n${pretty(review)}`, review };
  }
  if (method === "reconcile_vault_program") {
    const programId = readArg(args, 0, "program ID");
    const materialEpoch = readArg(args, 1, "material epoch");
    if (materialEpoch === 0n) {
      const [programResult, snapshotResult] = await Promise.all([
        readRevigate("get_program", [programId]),
        readRevigate("get_program", [programId], "vault"),
      ]);
      const program = asRecord(programResult);
      const snapshot = asRecord(snapshotResult);
      if (!program || !snapshot || !sameInteger(program.epoch, String(snapshot.epoch))
          || String(program.active_sha).toLowerCase() !== String(snapshot.sha).toLowerCase()
          || String(program.document_digest) !== String(snapshot.document_digest)) {
        throw new Error("The latest Registry snapshot has not reached Vault yet. Keep the hash and recheck the same message.");
      }
      return { kind: "verified", detail: `Current Registry/Vault snapshot reconciled at epoch ${String(program.epoch)}.` };
    }
    const event = asRecord(await readRevigate("get_material_event", [programId, materialEpoch], "vault"));
    if (!event || !sameInteger(event.epoch, materialEpoch)) throw new Error("The requested material event is not present in Vault yet.");
    return { kind: "verified", detail: `Vault material event ${materialEpoch} recorded at ${String(event.at)}.` };
  }
  if (method === "register_offer") {
    const matches = pageItems(await readRevigate("get_offer_page", [0n, 50n])).filter((offer) =>
      String(offer.publisher).toLowerCase() === item.account.toLowerCase()
      && String(offer.participant).toLowerCase() === String(args?.[1]).toLowerCase()
      && sameInteger(offer.program_id, readArg(args, 0, "program ID"))
      && sameInteger(offer.principal, readArg(args, 2, "amount"))
      && sameInteger(offer.funding_deadline, readArg(args, 3, "funding deadline"))
      && sameInteger(offer.acceptance_deadline, readArg(args, 4, "acceptance deadline"))
      && sameInteger(offer.maturity, readArg(args, 5, "maturity"))
      && sameInteger(offer.exit_bps, readArg(args, 6, "exit basis points"))
      && sameInteger(offer.exit_window, readArg(args, 7, "exit window")));
    if (matches.length !== 1 || !/^[0-9a-f]{64}$/i.test(String(matches[0]?.agreement_id))) {
      throw new Error("Canonical offer readback is missing or ambiguous; keep the transaction hash.");
    }
    return { kind: "verified", detail: `New offer and frozen agreement identity\n${pretty(matches[0])}`, offer: matches[0] };
  }
  if (method === "register_program") {
    const matches = pageItems(await readRevigate("get_program_page", [0n, 50n])).filter((program) =>
      String(program.publisher).toLowerCase() === item.account.toLowerCase()
      && String(program.repo).toLowerCase() === String(args?.[0]).toLowerCase()
      && program.rulebook_path === args?.[1] && program.manifest_path === args?.[2]
      && program.branch === args?.[3]
      && String(program.baseline_sha).toLowerCase() === String(args?.[4]).toLowerCase());
    if (matches.length !== 1) throw new Error("Canonical program proposal is missing or ambiguous; keep the transaction hash.");
    return { kind: "verified", detail: `Proposed program\n${pretty(matches[0])}`, program: matches[0] };
  }
  if (method === "acknowledge_rules" || method === "reaffirm_rules") {
    const ack = asRecord(await readRevigate("get_acknowledgment", [
      readArg(args, 0, "program ID"), item.account,
    ]));
    if (!ack || !sameInteger(ack.epoch, readArg(args, 1, "program epoch"))
        || String(ack.sha).toLowerCase() !== String(args?.[2]).toLowerCase()
        || String(ack.digest) !== String(args?.[3])) {
      throw new Error("Canonical Registry acknowledgment readback did not match the signed version.");
    }
    return { kind: "verified", detail: `Participant acknowledgment\n${pretty(ack)}` };
  }
  if (method === "reaffirm_offer_rules") {
    const offer = asRecord(await readRevigate("get_offer", [readArg(args, 0, "offer ID")]));
    if (!offer || !sameInteger(offer.ack_epoch, readArg(args, 1, "program epoch"))) {
      throw new Error("Vault acknowledgment epoch did not update to the reaffirmed rules.");
    }
    return { kind: "verified", detail: `Accepted offer acknowledgment updated\n${pretty(offer)}`, offer };
  }
  if (method === "withdraw_credit") {
    return { kind: "unavailable", detail: "The transfer may still have unknown delivery. Do not resend; verify the recipient's independent balance and reconcile the same transfer." };
  }
  return { kind: "unavailable", detail: "No exact action-specific canonical readback is implemented for this method." };
}

export function ContractWorkbench({ mode, initialOfferId = "", initialProgramId = "", initialReviewId = "" }: { mode: WorkbenchMode; initialOfferId?: string; initialProgramId?: string; initialReviewId?: string }) {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState("");
  const [deploymentVerified, setDeploymentVerified] = useState(false);
  const [provider, setProvider] = useState<Eip1193Provider>();
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [programId, setProgramId] = useState(initialProgramId);
  const [programDetails, setProgramDetails] = useState<RecordValue | null>(null);
  const [reviewId, setReviewId] = useState(initialReviewId);
  const [offerId, setOfferId] = useState(initialOfferId);
  const [offer, setOffer] = useState<RecordValue | null>(null);
  const [walletOffers, setWalletOffers] = useState<RecordValue[]>([]);
  const [pending, setPending] = useState<PendingTransaction[]>([]);
  const actionLock = useRef(false);
  const walletIdentity = useRef("");
  const currentAccount = useRef("");
  const currentChain = useRef("");
  const identityEpoch = useRef(0);
  const [lastTransaction, setLastTransaction] = useState<PendingTransaction | null>(null);
  const [form, setForm] = useState({
    repo: "",
    rulebookPath: "rules/program.md",
    manifestPath: ".revigate/publisher.json",
    branch: "main",
    baselineSha: "",
    candidateSha: "",
    reconcileMaterialEpoch: "0",
    participant: "",
    amount: "",
    fundingDeadline: "",
    acceptanceDeadline: "",
    maturity: "",
    exitBps: "0",
    exitWindow: "604800",
    closurePublisherShare: "",
    closureParticipantShare: "",
    closureExpiry: "",
  });

  useEffect(() => {
    queueMicrotask(() => setPending(loadPendingTransactions()));
    const wallet = typeof window === "undefined" ? undefined : window.ethereum;
    if (!wallet) return;
    queueMicrotask(() => setProvider(wallet));
    const resetWalletBoundState = () => {
      identityEpoch.current += 1;
      setProgramDetails(null);
      setOffer(null);
      setWalletOffers([]);
      setOutput("Wallet or network changed. Reload canonical contract records before taking another action.");
    };
    const session = watchWallet(wallet, (next) => {
      if (next.account.toLowerCase() !== currentAccount.current.toLowerCase()
          || next.chainId.toLowerCase() !== currentChain.current.toLowerCase()) resetWalletBoundState();
      currentAccount.current = next.account;
      currentChain.current = next.chainId;
      walletIdentity.current = `${next.account.toLowerCase()}|${next.chainId.toLowerCase()}`;
      setAccount(next.account);
      setChainId(next.chainId);
    });
    return () => {
      session.stop();
    };
  }, []);

  useEffect(() => {
    let active = true;
    verifyRevigateDeployment()
      .then(() => { if (active) setDeploymentVerified(true); })
      .catch(() => { if (active) setDeploymentVerified(false); });
    return () => { active = false; };
  }, []);

  function update(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function runAction(action: () => Promise<unknown>) {
    if (actionLock.current) return;
    actionLock.current = true;
    try {
      void action()
        .catch((error: unknown) => setOutput(error instanceof Error ? error.message : "Action failed."))
        .finally(() => { actionLock.current = false; });
    } catch (error) {
      actionLock.current = false;
      setOutput(error instanceof Error ? error.message : "Check the form values and try again.");
    }
  }

  async function write(method: string, args: (string | bigint | number | boolean)[], value = 0n) {
    if (!isContractWriteAllowed(process.env.NODE_ENV, process.env.NEXT_PUBLIC_REVIGATE_ESCROW_ENABLED, method)) {
      setOutput("All contract writes are locked in this build until release certification. No transaction was submitted.");
      return;
    }
    if (!provider || !account) { setOutput("Connect a wallet with the header button before signing."); return; }
    if (!deploymentVerified) { setOutput("The configured contract identity has not been verified. No transaction was submitted."); return; }
    const { vaultConfig } = await verifyRevigateDeployment();
    if (!isCustodyWriteAllowed(vaultConfig.custody_enabled, method)) {
      setOutput("This paired Vault has custody disabled. Funding and withdrawals are locked; no transaction was submitted.");
      return;
    }
    if (!chainId || Number.parseInt(chainId, 16) !== STUDIONET_CHAIN_ID) { setOutput("Switch the connected wallet to GenLayer Studionet (61999). No transaction was submitted."); return; }
    const target = contractTargetForMethod(method);
    const contractAddress = getConfiguredAddressForMethod(method);
    const candidate = {
      account,
      method,
      args: args.map((arg) => typeof arg === "bigint" ? arg.toString() : arg),
      value: value.toString(),
      contractAddress,
      chainId: STUDIONET_CHAIN_ID,
    };
    const recorded = [...loadPendingTransactions(), ...pending, ...(lastTransaction ? [lastTransaction] : [])]
      .find((item) => isDuplicatePendingWrite(item, candidate));
    if (recorded) {
      setOutput(`This exact call already has a saved transaction hash: ${recorded.hash}. Check that hash; no second transaction was submitted.`);
      return;
    }
    const startingIdentity = `${account.toLowerCase()}|${chainId.toLowerCase()}`;
    setBusy(true);
    setOutput(`Waiting for wallet approval: ${method}`);
    try {
      const savedArgs = args.map((arg) => typeof arg === "bigint" ? arg.toString() : arg);
      const result = await submitAndPersistHash(
        () => submitRevigateWrite({ provider, account, functionName: method, target, args, value }),
        (hash): PendingTransaction => ({
          hash: hash as Hash, account, method, submittedAt: Date.now(), args: savedArgs,
          value: value.toString(), contractAddress, chainId: STUDIONET_CHAIN_ID,
        }),
        savePendingTransaction,
      );
      const pendingItem = result.pending;
      const hash = pendingItem.hash;
      setLastTransaction(pendingItem);
      if (result.persisted) {
        setPending(loadPendingTransactions());
      } else {
        setPending((current) => [pendingItem, ...current.filter((item) => item.hash !== pendingItem.hash)].slice(0, 20));
        setOutput(`Transaction submitted, but this browser could not save the recovery pointer. Copy this hash now and check only this hash: ${hash}`);
        return;
      }
      if (walletIdentity.current === startingIdentity) {
        setOutput(`Transaction submitted to ${contractAddress} on Studionet (61999). Hash: ${hash}\nThe exact call arguments and hash are saved locally. Check this hash; do not submit the action again while it is pending.`);
      } else {
        setOutput(`Transaction submitted before the wallet changed. The hash and call data are saved for recovery: ${hash}`);
      }
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "The wallet rejected the request before a transaction hash was returned.");
    } finally {
      setBusy(false);
    }
  }

  async function checkTransaction(item: PendingTransaction) {
    const { hash } = item;
    if (item.chainId && item.chainId !== STUDIONET_CHAIN_ID) {
      setOutput("This saved transaction belongs to a different chain. It was not checked or resubmitted.");
      return;
    }
    if (actionLock.current) return;
    actionLock.current = true;
    const version = identityEpoch.current;
    const report = (message: string) => { if (identityEpoch.current === version) setOutput(message); };
    setBusy(true);
    report(`Checking the existing transaction ${hash}. No new transaction will be submitted.`);
    try {
      const currentAddress = getConfiguredAddressForMethod(item.method);
      if (item.contractAddress && item.contractAddress.toLowerCase() !== currentAddress?.toLowerCase()) {
        report("This saved transaction targets a different Registry or Vault address. It was not treated as a Revigate result.");
        return;
      }
      const observed = await observeTransaction(hash, 10, item.account, item.contractAddress ?? currentAddress);
      if (observed.state === "finalized-success" || observed.state === "finalized-execution-unknown") {
        if (item.method === "withdraw_credit") {
          const vault = item.contractAddress ?? currentAddress;
          if (!vault) throw new Error("The withdrawal target is unavailable; keep the original hash.");
          const delivery = await observeOutgoingTransfer({
            parentHash: hash,
            vault,
            recipient: item.account,
            amount: readArg(item.args, 0, "withdrawal amount"),
          });
          const explanations: Record<string, string> = {
            CHILD_FINALIZED_SUCCESS: "One child transaction finalized successfully with the expected sender, recipient, and amount. This proves child execution only, not recipient balance credit; contract storage remains UNKNOWN_DELIVERY.",
            DUPLICATE_SUCCESSFUL_CHILDREN: "More than one matching successful child was found. Treat this as a possible duplicate payout and preserve every hash.",
            CHILD_FINALIZED_FAILURE: "A matching child finalized with execution failure, but that does not prove the recipient received zero or authorize a retry.",
            CHILD_PENDING: "A matching child exists but is not finalized. Preserve its hash and check the same transaction later.",
            CHILD_UNDETERMINED: "The matching child outcome is undetermined. Preserve its hash; do not assume success, failure, or retry safety.",
            CHILD_CANCELLED: "The matching child was cancelled. This does not establish a safe replay; preserve the evidence and reconcile explicitly.",
            UNKNOWN: "No matching child identity and exact transfer were proven. Missing, delayed, or mismatched RPC data is not evidence of non-delivery.",
          };
          const parentExecution = observed.state === "finalized-success"
            ? "Parent execution succeeded."
            : "The parent finalized, but its execution result was not provided by the RPC.";
          report(`FINALIZED · ${parentExecution} Child execution status: ${delivery.status}. ${explanations[delivery.status]}\nParent: ${hash}\nChild IDs reported by the parent: ${delivery.childHashes.join(", ") || "none returned"}\nExact sender/recipient/amount child matches: ${delivery.matchingChildren.join(", ") || "none proven"}\nRecipient balance delta has not been checked. The on-chain transfer record is not changed and no retry was submitted.`);
          return;
        }
        if (observed.state === "finalized-execution-unknown") {
          report(`FINALIZED · the RPC omitted the execution result. No success, failure, or state change is assumed. Keep this hash and do not resubmit.\n${pretty(observed.transaction)}`);
          return;
        }
        try {
          const readback = await canonicalReadback(item);
          if (readback.kind === "verified") {
            forgetPendingTransaction(hash);
            setPending(loadPendingTransactions());
            setLastTransaction((current) => current?.hash === hash ? null : current);
            if (identityEpoch.current === version) {
              if (readback.offer) { setOffer(readback.offer); setOfferId(String(readback.offer.id)); }
              if (readback.program) { setProgramDetails(readback.program); setProgramId(String(readback.program.id)); }
              if (readback.review) setReviewId(String(readback.review.id));
            }
            report(`FINALIZED · execution succeeded · canonical readback verified\n${readback.detail}\nTransaction evidence:\n${pretty(observed.transaction)}`);
          } else {
            report(`FINALIZED · execution succeeded, but objective product state or recipient receipt is not verified. Keep this hash and do not resubmit.\n${readback.detail}\nTransaction evidence:\n${pretty(observed.transaction)}`);
          }
        } catch (error) {
          report(`FINALIZED · execution succeeded, but canonical state verification failed. Keep this hash and do not resubmit. ${error instanceof Error ? error.message : "Readback failed."}\n${pretty(observed.transaction)}`);
        }
      } else if (observed.state === "finalized-error") {
        report(`FINALIZED · execution failed. Canonical non-mutation has not been proven; keep this hash and do not resubmit.\n${pretty(observed.transaction)}`);
      } else if (observed.state === "undetermined") {
        report(`UNDETERMINED · do not assume a product verdict, balance change, or success. Keep this hash and do not resubmit.\n${pretty(observed.transaction)}`);
      } else if (observed.state === "cancelled") {
        forgetPendingTransaction(hash);
        setPending(loadPendingTransactions());
        setLastTransaction((current) => current?.hash === hash ? null : current);
        report(`Transaction was cancelled.\n${pretty(observed.transaction)}`);
      } else if (observed.state === "sender-mismatch") {
        report(`The transaction sender does not match the wallet that initiated this action. No success or state change is assumed.\n${pretty(observed.transaction)}`);
      } else if (observed.state === "sender-unverified") {
        report(`The RPC did not provide a verifiable transaction sender. No success is assumed; keep the hash.\n${pretty(observed.transaction)}`);
      } else if (observed.state === "contract-mismatch") {
        report(`The transaction target does not match the configured Revigate address. No success is assumed; keep the hash.\n${pretty(observed.transaction)}`);
      } else if (observed.state === "contract-unverified") {
        report(`The RPC did not provide a verifiable transaction target. No success is assumed; keep the hash.\n${pretty(observed.transaction)}`);
      } else {
        report(`Still processing. The original hash remains saved; check this same hash again later.\n${pretty(observed.transaction ?? {})}`);
      }
    } catch (error) {
      report(`Could not read the existing hash. It is still saved; do not resubmit. ${error instanceof Error ? error.message : "RPC error"}`);
    } finally {
      setBusy(false);
      actionLock.current = false;
    }
  }

  async function read(method: string, args: (string | bigint | number | boolean)[]) {
    const version = identityEpoch.current;
    setBusy(true);
    try {
      const result = await readRevigate(method, args);
      if (identityEpoch.current === version) setOutput(pretty(result));
      return result;
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "Contract read failed.");
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  async function loadOffer(id: string, show = true) {
    const version = identityEpoch.current;
    const result = await readRevigate("get_offer", [asInteger(id, "Offer ID")]);
    const record = asRecord(result);
    if (identityEpoch.current !== version) return null;
    setOffer(record && Object.keys(record).length ? record : null);
    if (show) setOutput(record && Object.keys(record).length ? pretty(record) : "No offer exists with this ID.");
    return record;
  }

  async function loadProgram(id: string, show = true) {
    const version = identityEpoch.current;
    const result = await readRevigate("get_program", [asInteger(id, "Program ID")]);
    const record = asRecord(result);
    if (identityEpoch.current !== version) return null;
    setProgramDetails(record && Object.keys(record).length ? record : null);
    if (show) setOutput(record && Object.keys(record).length ? pretty(record) : "No program exists with this ID.");
    return record;
  }

  async function loadOfferSafely() {
    if (!offerId.trim()) { setOutput("Enter an offer ID."); return; }
    setBusy(true);
    try { await loadOffer(offerId); }
    catch (error) { setOutput(error instanceof Error ? error.message : "Offer read failed."); }
    finally { setBusy(false); }
  }

  async function loadProgramSafely() {
    if (!programId.trim()) { setOutput("Enter a program ID."); return; }
    setBusy(true);
    try { await loadProgram(programId); }
    catch (error) { setOutput(error instanceof Error ? error.message : "Program read failed."); }
    finally { setBusy(false); }
  }

  async function loadMyOffers() {
    if (!account) { setOutput("Connect a wallet before loading its offers."); return; }
    const version = identityEpoch.current;
    setBusy(true);
    try {
      const result = asRecord(await readRevigate("get_wallet_offer_page", [account, 0n, 20n]));
      const items = Array.isArray(result?.items) ? result.items.map(asRecord).filter((item): item is RecordValue => Boolean(item)) : [];
      if (identityEpoch.current !== version) return;
      setWalletOffers(items);
      setOutput(`${items.length} offer(s) loaded for ${account}.`);
    } catch (error) { setOutput(error instanceof Error ? error.message : "Offer index read failed."); }
    finally { setBusy(false); }
  }

  async function reaffirmAcceptedOffer() {
    if (!offer) throw new Error("Read an offer first.");
    const program = asRecord(await readRevigate("get_program", [asInteger(offer.program_id, "Program ID")]));
    if (!program || program.status !== "VERIFIED") throw new Error("Current program rules are not verified.");
    await write("reaffirm_offer_rules", [asInteger(offerId, "Offer ID"), asInteger(program.epoch, "Program epoch"), String(program.active_sha), String(program.document_digest)]);
  }

  const isPublisher = Boolean(offer && account && String(offer.publisher).toLowerCase() === account.toLowerCase());
  const isParticipant = Boolean(offer && account && String(offer.participant).toLowerCase() === account.toLowerCase());
  const unaccepted = ["REGISTERED_UNFUNDED", "FUNDED_UNACCEPTED"].includes(String(offer?.state));
  const fundedUnaccepted = offer?.state === "FUNDED_UNACCEPTED";
  const accepted = offer?.state === "ACCEPTED_LOCKED";
  const closure = asRecord(offer?.closure);
  const correctNetwork = Boolean(chainId && Number.parseInt(chainId, 16) === STUDIONET_CHAIN_ID);
  const actionsEnabled = contractConfigured && deploymentVerified && Boolean(provider && account)
    && correctNetwork && escrowWritesEnabled;

  return <section className="contract-workbench">
    <div className="workbench-heading">
      <div><span className="panel-number">{mode === "publisher" ? "STUDIONET · PUBLISHER" : "STUDIONET · PARTICIPANT"}</span><h2>Contract actions</h2></div>
      <span className="wallet-context">{account ? `${account.slice(0, 6)}…${account.slice(-4)}` : "Wallet not connected"} · {correctNetwork ? "Studionet 61999" : "Wrong or unknown network"}</span>
    </div>
    <p className="workbench-copy">Every write uses the connected wallet through GenLayerJS on chain 61999. The console shows the transaction hash before checking finality, and resumes status checks by that same hash.</p>

    {!contractConfigured && <p className="safety-copy">Actions are locked because no deployment address is configured.</p>}
    {contractConfigured && !deploymentVerified && <p className="safety-copy">Actions are locked until the configured address returns the expected Revigate identity.</p>}
    {!escrowWritesEnabled && <p className="safety-copy">All contract actions are locked in production until release certification.</p>}
    {account && !correctNetwork && <p className="safety-copy">Actions are locked until the connected wallet is on Studionet chain 61999.</p>}
    {!account && <p className="safety-copy">Connect a wallet before reading account-specific records or signing.</p>}
    <fieldset className="workbench-actions" disabled={!actionsEnabled || busy}>
    {mode === "publisher" ? <>
      <div className="action-group">
        <h3>Register and verify a rulebook</h3>
        <div className="action-grid">
          <label>GitHub owner/repository<input value={form.repo} onChange={(event) => update("repo", event.target.value)} placeholder="owner/repository" /></label>
          <label>Rulebook path<input value={form.rulebookPath} onChange={(event) => update("rulebookPath", event.target.value)} /></label>
          <label>Publisher manifest path<input value={form.manifestPath} onChange={(event) => update("manifestPath", event.target.value)} /></label>
          <label>Branch<input value={form.branch} onChange={(event) => update("branch", event.target.value)} /></label>
          <label>Signed baseline commit SHA<input value={form.baselineSha} onChange={(event) => update("baselineSha", event.target.value)} placeholder="40 hex characters" /></label>
        </div>
        <button disabled={busy} onClick={() => runAction(() => write("register_program", [form.repo, form.rulebookPath, form.manifestPath, form.branch, form.baselineSha]))}>Propose program</button>
        <div className="action-inline"><label>Program ID<input inputMode="numeric" value={programId} onChange={(event) => setProgramId(event.target.value)} /></label>
          <button disabled={busy || !programId} onClick={() => runAction(() => write("verify_program", [asInteger(programId, "Program ID")]))}>Verify source</button>
          <button disabled={busy || !programId} onClick={() => runAction(() => loadProgramSafely())}>Read program</button>
        </div>
        <div className="action-inline"><label>Vault reconciliation epoch · 0 sends latest snapshot<input inputMode="numeric" value={form.reconcileMaterialEpoch} onChange={(event) => update("reconcileMaterialEpoch", event.target.value)} /></label>
          <button disabled={busy || !programId} onClick={() => runAction(() => write("reconcile_vault_program", [asInteger(programId, "Program ID"), asInteger(form.reconcileMaterialEpoch, "Material epoch")]))}>Reconcile Registry to Vault</button>
        </div>
      </div>

      <div className="action-group">
        <h3>Request a rulebook review</h3>
        <div className="action-inline"><label>Candidate commit SHA<input value={form.candidateSha} onChange={(event) => update("candidateSha", event.target.value)} placeholder="40 hex characters" /></label>
          <button disabled={busy || !programId} onClick={() => runAction(() => write("request_revision", [asInteger(programId, "Program ID"), form.candidateSha]))}>Request review</button>
        </div>
        <div className="action-inline"><label>Review ID<input inputMode="numeric" value={reviewId} onChange={(event) => setReviewId(event.target.value)} /></label>
          <button disabled={busy || !reviewId} onClick={() => runAction(() => write("assess_revision", [asInteger(reviewId, "Review ID")]))}>Assess revision</button>
          <button disabled={busy || !reviewId} onClick={() => runAction(() => write("expire_revision_request", [asInteger(reviewId, "Review ID")]))}>Expire after deadline</button>
        </div>
      </div>

      <div className="action-group">
        <h3>Register a participant offer</h3>
        <div className="action-grid">
          <label>Designated participant wallet<input value={form.participant} onChange={(event) => update("participant", event.target.value)} placeholder="0x…" /></label>
          <label>Amount in wei<input inputMode="numeric" value={form.amount} onChange={(event) => update("amount", event.target.value)} /></label>
          <label>Funding deadline · Unix seconds<input inputMode="numeric" value={form.fundingDeadline} onChange={(event) => update("fundingDeadline", event.target.value)} /></label>
          <label>Acceptance deadline · Unix seconds<input inputMode="numeric" value={form.acceptanceDeadline} onChange={(event) => update("acceptanceDeadline", event.target.value)} /></label>
          <label>Maturity · Unix seconds<input inputMode="numeric" value={form.maturity} onChange={(event) => update("maturity", event.target.value)} /></label>
          <label>Participant material exit · basis points<input inputMode="numeric" value={form.exitBps} onChange={(event) => update("exitBps", event.target.value)} /></label>
          <label>Fixed exit window · seconds<input inputMode="numeric" value={form.exitWindow} onChange={(event) => update("exitWindow", event.target.value)} /></label>
        </div>
        <button disabled={busy || !programId || !escrowWritesEnabled} onClick={() => runAction(() => write("register_offer", [
          asInteger(programId, "Program ID"), form.participant, asInteger(form.amount, "Amount"),
          asInteger(form.fundingDeadline, "Funding deadline"), asInteger(form.acceptanceDeadline, "Acceptance deadline"),
          asInteger(form.maturity, "Maturity"), asInteger(form.exitBps, "Exit share"), asInteger(form.exitWindow, "Exit window"),
        ]))}>Create offer</button>
      </div>
    </> : <>
      <div className="action-group">
        <h3>Rulebook acknowledgments</h3>
        <div className="action-inline"><label>Program ID<input inputMode="numeric" value={programId} onChange={(event) => { setProgramId(event.target.value); setProgramDetails(null); }} /></label>
          <button disabled={busy || !programId} onClick={() => runAction(() => loadProgramSafely())}>Read program</button>
        </div>
        {programDetails && <div className="offer-summary"><b>{String(programDetails.status)} · epoch {String(programDetails.epoch)}</b><span>Reviewed commit: {String(programDetails.active_sha)}</span><span>Rulebook digest: {String(programDetails.document_digest)}</span></div>}
        {programDetails?.status === "VERIFIED" && <div className="action-buttons">
          <button disabled={busy} onClick={() => runAction(() => write("acknowledge_rules", [asInteger(programId, "Program ID"), asInteger(programDetails.epoch, "Program epoch"), String(programDetails.active_sha), String(programDetails.document_digest)]))}>Acknowledge current rules</button>
          <button disabled={busy} onClick={() => runAction(() => write("reaffirm_rules", [asInteger(programId, "Program ID"), asInteger(programDetails.epoch, "Program epoch"), String(programDetails.active_sha), String(programDetails.document_digest)]))}>Reaffirm current rules</button>
        </div>}
      </div>
      <div className="action-group">
        <h3>Review an offer</h3>
        <button disabled={busy || !account} onClick={() => void loadMyOffers()}>Load my indexed offers</button>
        {walletOffers.length > 0 && <div className="offer-list">{walletOffers.map((item) => <button className="offer-list-item" key={String(item.id)} disabled={busy} onClick={() => { setOfferId(String(item.id)); runAction(() => loadOffer(String(item.id))); }}>{`Offer ${String(item.id)} · ${String(item.state)} · ${String(item.principal)} wei`}</button>)}</div>}
        <div className="action-inline"><label>Offer ID<input inputMode="numeric" value={offerId} onChange={(event) => { setOfferId(event.target.value); setOffer(null); }} /></label>
          <button disabled={busy || !offerId} onClick={() => void loadOfferSafely()}>Read offer</button>
        </div>
        {offer && <div className="offer-summary"><b>{String(offer.state)}</b><span>Principal: {String(offer.principal)} wei</span><span>Publisher: {String(offer.publisher)}</span><span>Participant: {String(offer.participant)}</span><span>Maturity: {String(offer.maturity)}</span><span>Agreement: {String(offer.agreement_id)}</span></div>}
        {offer && isPublisher && offer.state === "REGISTERED_UNFUNDED" && <button disabled={busy || !escrowWritesEnabled} onClick={() => runAction(() => write("fund_offer", [asInteger(offerId, "Offer ID")], asInteger(offer.principal, "Offer principal")))}>Fund exact offer principal</button>}
        {offer && isParticipant && fundedUnaccepted && <div className="action-buttons">
          <button disabled={busy} onClick={() => runAction(() => write("accept_offer", [asInteger(offerId, "Offer ID"), String(offer.agreement_id), asInteger(offer.epoch, "Offer epoch"), String(offer.sha)]))}>Accept frozen terms</button>
          <button disabled={busy} onClick={() => runAction(() => write("decline_offer", [asInteger(offerId, "Offer ID")]))}>Decline and allocate refund</button>
        </div>}
        {offer && isPublisher && unaccepted && <button disabled={busy} onClick={() => runAction(() => write("cancel_unaccepted_offer", [asInteger(offerId, "Offer ID")]))}>Cancel unaccepted offer</button>}
        {offer && unaccepted && <button disabled={busy} onClick={() => runAction(() => write("expire_unaccepted_offer", [asInteger(offerId, "Offer ID")]))}>Expire after deadline</button>}
        {offer && accepted && isParticipant && <button disabled={busy} onClick={() => runAction(() => write("exercise_material_exit", [asInteger(offerId, "Offer ID")]))}>Exercise valid material exit</button>}
        {offer && accepted && isParticipant && <button disabled={busy} onClick={() => runAction(() => reaffirmAcceptedOffer())}>Reaffirm offer under current rules</button>}
        {offer && accepted && <button disabled={busy} onClick={() => runAction(() => write("allocate_matured_claim", [asInteger(offerId, "Offer ID")]))}>Allocate matured claim</button>}
        {offer && accepted && !closure && <div className="action-group">
          <h3>Propose mutual closure</h3>
          <div className="action-grid">
            <label>Publisher allocation · wei<input inputMode="numeric" value={form.closurePublisherShare} onChange={(event) => update("closurePublisherShare", event.target.value)} /></label>
            <label>Participant allocation · wei<input inputMode="numeric" value={form.closureParticipantShare} onChange={(event) => update("closureParticipantShare", event.target.value)} /></label>
            <label>Proposal expiry · Unix seconds<input inputMode="numeric" value={form.closureExpiry} onChange={(event) => update("closureExpiry", event.target.value)} /></label>
          </div>
          <button disabled={busy || (!isPublisher && !isParticipant)} onClick={() => runAction(() => write("propose_closure", [asInteger(offerId, "Offer ID"), asInteger(form.closurePublisherShare, "Publisher allocation"), asInteger(form.closureParticipantShare, "Participant allocation"), asInteger(form.closureExpiry, "Closure expiry")]))}>Propose exact split</button>
        </div>}
        {offer && accepted && closure && <div className="action-group">
          <h3>Pending mutual closure</h3>
          <p className="workbench-copy">Digest: {String(closure.digest)} · expires {String(closure.expires_at)}</p>
          <p className="workbench-copy">Publisher: {String(closure.publisher_amount)} wei · Participant: {String(closure.participant_amount)} wei</p>
          {account && String(closure.proposer).toLowerCase() !== account.toLowerCase() && <button disabled={busy} onClick={() => runAction(() => write("approve_closure", [asInteger(offerId, "Offer ID"), String(closure.digest)]))}>Approve exact closure</button>}
          {(isPublisher || isParticipant) && <button disabled={busy} onClick={() => runAction(() => write("cancel_closure", [asInteger(offerId, "Offer ID")]))}>Cancel pending closure</button>}
          <button disabled={busy} onClick={() => runAction(() => write("expire_closure", [asInteger(offerId, "Offer ID")]))}>Expire after deadline</button>
        </div>}
      </div>
      <div className="action-group">
        <h3>Read contract credit</h3>
        {account ? <button disabled={busy} onClick={() => runAction(() => read("get_wallet_credit", [account]))}>Check connected wallet credit</button> : <p>Connect a wallet to check its canonical credit balance.</p>}
        <p className="safety-copy">This is a claim recorded inside the contract, not proof that GEN reached the wallet. Withdrawal stays disabled until delivery and failure recovery pass live verification.</p>
      </div>
    </>}
    </fieldset>

    <div className="action-group transaction-group">
      <h3>Transaction status</h3>
      {lastTransaction && <button disabled={busy} onClick={() => void checkTransaction(lastTransaction)}>Check current hash · {lastTransaction.hash.slice(0, 12)}…</button>}
      {pending.map((item) => <button className="pending-hash" key={item.hash} disabled={busy} onClick={() => void checkTransaction(item)}>{item.method} · {item.hash.slice(0, 12)}… · resume status</button>)}
      <pre className="result-console" aria-live="polite">{output || "Contract reads and transaction evidence will appear here."}</pre>
    </div>
  </section>;
}
