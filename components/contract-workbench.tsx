"use client";

import { useEffect, useRef, useState } from "react";
import { forgetPendingTransaction, getConfiguredRegistryAddress, loadPendingTransactions,
  observeTransaction, readRevigate, savePendingTransaction, submitRevigateWrite,
  verifyRevigateDeployment, type Eip1193Provider, type Hash, type PendingTransaction } from "@/lib/genlayer";
import { isDuplicatePendingWrite } from "@/lib/pending-storage.mjs";
import { isFinalizedForCanonical, submitAndPersistHash, watchWallet } from "@/lib/wallet-session.mjs";
import { reconcileCanonicalTransaction, transactionStateLabel } from "@/lib/transaction-reconciliation.mjs";

type RecordValue = Record<string, unknown>;
const asInteger = (value: string, label: string) => {
  if (!/^\d+$/.test(value)) throw new Error(`${label} must be a non-negative integer.`);
  return BigInt(value);
};
const asRecord = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : null;
const pretty = (value: unknown) => JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item, 2);

export function ContractWorkbench({ mode, initialProgramId = "", initialReviewId = "" }:
  { mode: "publisher" | "participant"; initialProgramId?: string; initialReviewId?: string }) {
  const [provider, setProvider] = useState<Eip1193Provider>();
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState("");
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState("");
  const [programId, setProgramId] = useState(initialProgramId);
  const [reviewId, setReviewId] = useState(initialReviewId);
  const [program, setProgram] = useState<RecordValue | null>(null);
  const [pending, setPending] = useState<PendingTransaction[]>([]);
  const walletIdentity = useRef("");
  const appDisconnected = useRef(false);
  const writeInFlight = useRef(false);
  const [form, setForm] = useState({ repo: "", rulebookPath: "rules/program.md",
    manifestPath: ".revigate/publisher.json", branch: "main", baselineSha: "", candidateSha: "" });

  useEffect(() => {
    const wallet = window.ethereum as Eip1193Provider | undefined;
    if (!wallet) return;
    queueMicrotask(() => setProvider(wallet));
    const session = watchWallet(wallet, (state) => {
      if (appDisconnected.current) return;
      walletIdentity.current = `${state.account.toLowerCase()}|${state.chainId.toLowerCase()}`;
      setAccount(state.account); setChainId(state.chainId);
    });
    const onAppDisconnect = () => {
      appDisconnected.current = true;
      session.clear();
      walletIdentity.current = "|";
      setAccount(""); setChainId("");
    };
    const onAppConnect = () => {
      appDisconnected.current = false;
      session.resume();
      void session.refresh();
    };
    window.addEventListener("revigate:wallet-disconnect", onAppDisconnect);
    window.addEventListener("revigate:wallet-connect", onAppConnect);
    queueMicrotask(() => setPending(loadPendingTransactions()));
    return () => {
      window.removeEventListener("revigate:wallet-disconnect", onAppDisconnect);
      window.removeEventListener("revigate:wallet-connect", onAppConnect);
      session.stop();
    };
  }, []);

  useEffect(() => {
    if (!getConfiguredRegistryAddress()) return;
    verifyRevigateDeployment().then(() => setVerified(true)).catch((error: unknown) => setOutput(error instanceof Error ? error.message : "Registry verification failed."));
  }, []);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const run = (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setOutput("");
    action().catch((error: unknown) => setOutput(error instanceof Error ? error.message : "Action failed.")).finally(() => setBusy(false));
  };
  const readProgram = async () => {
    const value = await readRevigate("get_program", [asInteger(programId, "Program ID")]);
    setProgram(asRecord(value)); setOutput(pretty(value));
  };
  const readPageItems = async (method: string, args: unknown[]) => {
    const value = asRecord(await readRevigate(method, args as never[]));
    return Array.isArray(value?.items) ? value.items.map(asRecord).filter((entry): entry is RecordValue => Boolean(entry)) : [];
  };
  const captureCanonicalStateForItem = async (item: PendingTransaction) => {
    const first = item.args?.[0];
    if (["acknowledge_rules", "reaffirm_rules"].includes(item.method)) {
      return { acknowledgments: await readPageItems("get_acknowledgment_page", [BigInt(String(first)), item.account, 0n, 50n]) };
    }
    if (item.method === "register_program") return { programs: await readPageItems("get_program_page", [0n, 50n]) };
    if (item.method === "verify_program") return { program: asRecord(await readRevigate("get_program", [BigInt(String(first))])) ?? {} };
    if (item.method === "request_revision") return {
      program: asRecord(await readRevigate("get_program", [BigInt(String(first))])) ?? {},
      reviews: await readPageItems("get_review_page", [0n, 50n]),
    };
    return { review: asRecord(await readRevigate("get_review", [BigInt(String(first))])) ?? {} };
  };
  const verifyCanonical = async (item: PendingTransaction) => {
    if (!item.preState) return { verified: false as const, reason: "the transaction has no captured pre-state; historical matches are not proof" };
    const after = await captureCanonicalStateForItem(item);
    return reconcileCanonicalTransaction(item, item.preState, after);
  };
  const checkPending = async (item: PendingTransaction) => {
    const observed = await observeTransaction(item.hash, 10, item.account, item.contractAddress);
    if (isFinalizedForCanonical(observed.state)) {
      let reconciliation;
      try {
        reconciliation = await verifyCanonical(item);
      } catch (error) {
        const detail = error instanceof Error ? error.message : "canonical readback failed";
        setOutput(`${item.hash}\nRPC_UNAVAILABLE\nCanonical state could not be read: ${detail}\nNo retry was submitted.`);
        return;
      }
      if (reconciliation.verified) {
        forgetPendingTransaction(item.hash); setPending(loadPendingTransactions());
        const execution = observed.state === "finalized-success" ? "execution succeeded" : "execution result not exposed by the RPC";
        setOutput(`${item.hash}\nFINALIZED · ${execution} · canonical state transition verified\n${pretty(reconciliation.value)}`);
      } else {
        setOutput(`${item.hash}\n${transactionStateLabel(observed.state)}\nCANONICAL_STATE_UNVERIFIED · ${reconciliation.reason}\nNo retry was submitted.`);
      }
      return;
    }
    setOutput(`${item.hash}\n${transactionStateLabel(observed.state)}\n${pretty(observed)}\nNo retry was submitted.`);
  };
  const write = async (method: string, args: unknown[]) => {
    if (writeInFlight.current) throw new Error("A Registry transaction is already being prepared or submitted.");
    writeInFlight.current = true;
    try {
    if (!provider || !account || !verified) throw new Error("Connect a wallet and verify the Registry before signing.");
    const registry = getConfiguredRegistryAddress();
    if (!registry) throw new Error("The Registry is not configured.");
    const savedArgs = args.map((arg) => typeof arg === "bigint" ? arg.toString() : arg) as (string | number | boolean)[];
    const candidate = { account, method, args: savedArgs };
    if (isDuplicatePendingWrite(pending, candidate)) throw new Error("This exact Registry action already has a pending hash. Check it instead of submitting again.");
    const preState = await (async () => {
      const first = args[0];
      if (method === "register_program") return { programs: await readPageItems("get_program_page", [0n, 50n]) };
      if (method === "verify_program") return { program: asRecord(await readRevigate("get_program", [BigInt(String(first))])) ?? {} };
      if (method === "request_revision") return {
        program: asRecord(await readRevigate("get_program", [BigInt(String(first))])) ?? {},
        reviews: await readPageItems("get_review_page", [0n, 50n]),
      };
      if (method === "assess_revision" || method === "expire_revision_request") return {
        review: asRecord(await readRevigate("get_review", [BigInt(String(first))])) ?? {},
      };
      if (method === "acknowledge_rules" || method === "reaffirm_rules") return {
        acknowledgments: await readPageItems("get_acknowledgment_page", [BigInt(String(first)), account, 0n, 50n]),
      };
      throw new Error("This Registry action has no canonical pre-state rule.");
    })();
    const identity = walletIdentity.current;
    const result = await submitAndPersistHash(
      () => submitRevigateWrite({ provider, account, functionName: method, args: args as never[] }),
      (hash): PendingTransaction => ({ hash: hash as Hash, account, method, args: savedArgs,
        value: "0", submittedAt: Date.now(), contractAddress: registry, chainId: 61999, preState }), savePendingTransaction);
    const item = result.pending;
    setPending((current) => [item, ...current.filter((entry) => entry.hash !== item.hash)]);
    if (!result.persisted) {
      setOutput(`Submitted ${item.hash}\nBrowser storage failed. Keep this hash and do not resubmit.`);
      return;
    }
    if (identity !== walletIdentity.current) { setOutput(`Wallet changed after submission. Recover using ${item.hash}.`); return; }
    setOutput(`Submitted ${item.hash}\nWaiting for protocol finality. Do not resubmit.`);
    await checkPending(item);
    } finally {
      writeInFlight.current = false;
    }
  };
  const enabled = verified && Boolean(provider && account) && Number.parseInt(chainId || "0", 16) === 61999;

  return <section className="contract-workbench">
    <div className="workbench-heading"><div><span className="panel-number">STUDIONET · NON-CUSTODIAL REGISTRY</span><h2>Rulebook actions</h2></div><span className="wallet-context">{verified ? "Registry verified" : "Registry locked"}</span></div>
    <p className="safety-copy">Revigate does not accept, hold, allocate, refund, or transfer funds.</p>
    {mode === "publisher" && <>
      <div className="action-group"><h3>Register authenticated source</h3><div className="action-grid">
        <label>GitHub repository<input value={form.repo} onChange={(e) => update("repo", e.target.value)} placeholder="owner/repository" /></label>
        <label>Rulebook path<input value={form.rulebookPath} onChange={(e) => update("rulebookPath", e.target.value)} /></label>
        <label>Publisher manifest path<input value={form.manifestPath} onChange={(e) => update("manifestPath", e.target.value)} /></label>
        <label>Branch<input value={form.branch} onChange={(e) => update("branch", e.target.value)} /></label>
        <label>Signed baseline commit SHA<input value={form.baselineSha} onChange={(e) => update("baselineSha", e.target.value)} /></label>
      </div><button disabled={busy || !enabled} onClick={() => run(() => write("register_program", [form.repo, form.rulebookPath, form.manifestPath, form.branch, form.baselineSha]))}>Propose program</button></div>
      <div className="action-group"><h3>Verify or revise</h3><label>Program ID<input inputMode="numeric" value={programId} onChange={(e) => setProgramId(e.target.value)} /></label>
        <div className="button-row"><button disabled={busy || !enabled || !programId} onClick={() => run(() => write("verify_program", [asInteger(programId, "Program ID")]))}>Verify source</button><button disabled={busy || !programId} onClick={() => run(readProgram)}>Read program</button></div>
        <label>Candidate signed commit SHA<input value={form.candidateSha} onChange={(e) => update("candidateSha", e.target.value)} /></label>
        <button disabled={busy || !enabled || !programId} onClick={() => run(() => write("request_revision", [asInteger(programId, "Program ID"), form.candidateSha]))}>Request revision review</button>
        <label>Review ID<input inputMode="numeric" value={reviewId} onChange={(e) => setReviewId(e.target.value)} /></label>
        <div className="button-row"><button disabled={busy || !enabled || !reviewId} onClick={() => run(() => write("assess_revision", [asInteger(reviewId, "Review ID")]))}>Assess revision</button><button disabled={busy || !reviewId} onClick={() => run(async () => setOutput(pretty(await readRevigate("get_review", [asInteger(reviewId, "Review ID")]))))}>Read review</button></div></div>
    </>}
    {mode === "participant" && <div className="action-group"><h3>Acknowledge a reviewed version</h3><label>Program ID<input inputMode="numeric" value={programId} onChange={(e) => setProgramId(e.target.value)} /></label><button disabled={busy || !programId} onClick={() => run(readProgram)}>Read current rules</button>
      {program && <><pre className="result-console">{pretty(program)}</pre><div className="button-row"><button disabled={busy || !enabled} onClick={() => run(() => write("acknowledge_rules", [asInteger(programId, "Program ID"), BigInt(String(program.epoch)), String(program.active_sha), String(program.document_digest)]))}>Acknowledge current version</button><button disabled={busy || !enabled} onClick={() => run(() => write("reaffirm_rules", [asInteger(programId, "Program ID"), BigInt(String(program.epoch)), String(program.active_sha), String(program.document_digest)]))}>Reaffirm current version</button></div></>}</div>}
    {pending.length > 0 && <div className="action-group transaction-group"><h3>Saved Registry transactions</h3>{pending.map((item) => <button className="pending-hash" key={item.hash} disabled={busy} onClick={() => run(() => checkPending(item))}>{item.method} · {item.hash}</button>)}</div>}
    {output && <pre className="result-console" aria-live="polite">{output}</pre>}
  </section>;
}
