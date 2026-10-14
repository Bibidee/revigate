"use client";

import { useEffect, useRef, useState } from "react";
import { forgetPendingTransaction, getConfiguredRegistryAddress, loadPendingTransactions,
  observeTransaction, readRevigate, savePendingTransaction, submitRevigateWrite,
  verifyRevigateDeployment, type Eip1193Provider, type Hash, type PendingTransaction } from "@/lib/genlayer";
import { isDuplicatePendingWrite } from "@/lib/pending-storage.mjs";
import { submitAndPersistHash, watchWallet } from "@/lib/wallet-session.mjs";

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
  const [form, setForm] = useState({ repo: "", rulebookPath: "rules/program.md",
    manifestPath: ".revigate/publisher.json", branch: "main", baselineSha: "", candidateSha: "" });

  useEffect(() => {
    const wallet = window.ethereum as Eip1193Provider | undefined;
    if (!wallet) return;
    queueMicrotask(() => setProvider(wallet));
    const session = watchWallet(wallet, (state) => {
      walletIdentity.current = `${state.account.toLowerCase()}|${state.chainId.toLowerCase()}`;
      setAccount(state.account); setChainId(state.chainId);
    });
    queueMicrotask(() => setPending(loadPendingTransactions()));
    return () => session.stop();
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
  const verifyCanonical = async (item: PendingTransaction) => {
    const first = item.args?.[0];
    if (item.method === "verify_program") {
      const state = asRecord(await readRevigate("get_program", [BigInt(String(first))]));
      if (!state || state.status !== "VERIFIED" || !state.active_sha || !state.document_digest) {
        throw new Error("Finalized verification has no matching verified program state.");
      }
      return state;
    }
    if (["acknowledge_rules", "reaffirm_rules"].includes(item.method)) {
      const state = asRecord(await readRevigate("get_acknowledgment", [BigInt(String(first)), item.account]));
      if (!state || !Object.keys(state).length) throw new Error("Finalized execution has no matching canonical Registry state.");
      if (String(state.epoch) !== String(item.args?.[1]) || state.sha !== String(item.args?.[2]).toLowerCase()
          || state.digest !== String(item.args?.[3])) throw new Error("Canonical acknowledgment does not match the submitted rule version.");
      return state;
    }
    if (item.method === "request_revision") {
      const page = asRecord(await readRevigate("get_review_page", [0n, 50n]));
      const review = Array.isArray(page?.items) ? page.items.map(asRecord).find((entry) => entry
        && String(entry.program_id) === String(first) && entry.candidate_sha === String(item.args?.[1]).toLowerCase()) : undefined;
      if (!review) throw new Error("Finalized revision request has no matching canonical review.");
      return review;
    }
    if (["assess_revision", "expire_revision_request"].includes(item.method)) {
      const review = asRecord(await readRevigate("get_review", [BigInt(String(first))]));
      if (!review || review.status === "PENDING") throw new Error("Finalized execution has no matching decided review state.");
      return review;
    }
    if (item.method === "register_program") {
      const page = asRecord(await readRevigate("get_program_page", [0n, 50n]));
      const program = Array.isArray(page?.items) ? page.items.map(asRecord).find((entry) => entry
        && String(entry.publisher).toLowerCase() === item.account.toLowerCase()
        && entry.repo === String(item.args?.[0]).toLowerCase()
        && entry.rulebook_path === item.args?.[1] && entry.manifest_path === item.args?.[2]
        && entry.branch === item.args?.[3] && entry.baseline_sha === String(item.args?.[4]).toLowerCase()) : undefined;
      if (!program) throw new Error("Finalized registration has no matching canonical program.");
      return program;
    }
    throw new Error("This Registry action has no canonical readback rule.");
  };
  const checkPending = async (item: PendingTransaction) => {
    const observed = await observeTransaction(item.hash, 10, item.account, item.contractAddress);
    if (observed.state === "finalized-success") {
      const canonical = await verifyCanonical(item);
      forgetPendingTransaction(item.hash); setPending(loadPendingTransactions());
      setOutput(`${item.hash}\nFINALIZED · execution succeeded · canonical state verified\n${pretty(canonical)}`);
    } else {
      setOutput(`${item.hash}\n${pretty(observed)}\nNo retry was submitted.`);
    }
  };
  const write = async (method: string, args: unknown[]) => {
    if (!provider || !account || !verified) throw new Error("Connect a wallet and verify the Registry before signing.");
    const registry = getConfiguredRegistryAddress();
    if (!registry) throw new Error("The Registry is not configured.");
    const savedArgs = args.map((arg) => typeof arg === "bigint" ? arg.toString() : arg) as (string | number | boolean)[];
    const candidate = { account, method, args: savedArgs };
    if (isDuplicatePendingWrite(pending, candidate)) throw new Error("This exact Registry action already has a pending hash. Check it instead of submitting again.");
    const identity = walletIdentity.current;
    const result = await submitAndPersistHash(
      () => submitRevigateWrite({ provider, account, functionName: method, args: args as never[] }),
      (hash): PendingTransaction => ({ hash: hash as Hash, account, method, args: savedArgs,
        value: "0", submittedAt: Date.now(), contractAddress: registry, chainId: 61999 }), savePendingTransaction);
    const item = result.pending;
    setPending((current) => [item, ...current.filter((entry) => entry.hash !== item.hash)]);
    if (!result.persisted) {
      setOutput(`Submitted ${item.hash}\nBrowser storage failed. Keep this hash and do not resubmit.`);
      return;
    }
    if (identity !== walletIdentity.current) { setOutput(`Wallet changed after submission. Recover using ${item.hash}.`); return; }
    setOutput(`Submitted ${item.hash}\nWaiting for protocol finality. Do not resubmit.`);
    await checkPending(item);
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
