"use client";

import { useEffect, useState } from "react";
import { getConfiguredRegistryAddress, observeTransaction, readRevigate,
  submitRevigateWrite, verifyRevigateDeployment, type Eip1193Provider } from "@/lib/genlayer";

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
  const [form, setForm] = useState({ repo: "", rulebookPath: "rules/program.md",
    manifestPath: ".revigate/publisher.json", branch: "main", baselineSha: "", candidateSha: "" });

  useEffect(() => {
    const wallet = window.ethereum as Eip1193Provider | undefined;
    if (!wallet) return;
    queueMicrotask(() => setProvider(wallet));
    const refresh = async () => {
      const [accounts, chain] = await Promise.all([wallet.request({ method: "eth_accounts" }), wallet.request({ method: "eth_chainId" })]);
      setAccount(Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : "");
      setChainId(typeof chain === "string" ? chain : "");
    };
    void refresh();
    const changed = () => void refresh();
    wallet.on?.("accountsChanged", changed); wallet.on?.("chainChanged", changed);
    return () => { wallet.removeListener?.("accountsChanged", changed); wallet.removeListener?.("chainChanged", changed); };
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
  const write = async (method: string, args: unknown[]) => {
    if (!provider || !account || !verified) throw new Error("Connect a wallet and verify the Registry before signing.");
    const registry = getConfiguredRegistryAddress();
    if (!registry) throw new Error("The Registry is not configured.");
    const hash = await submitRevigateWrite({ provider, account, functionName: method, args: args as never[] });
    setOutput(`Submitted ${hash}\nWaiting for protocol finality…`);
    setOutput(`${hash}\n${pretty(await observeTransaction(hash, 10, account, registry))}`);
  };
  const enabled = verified && Boolean(provider && account) && Number.parseInt(chainId || "0", 16) === 61999;

  return <section className="contract-workbench">
    <div className="workbench-head"><div><span className="panel-number">STUDIONET · NON-CUSTODIAL REGISTRY</span><h2>Rulebook actions</h2></div><span className={verified ? "status-chip status-verified" : "status-chip"}>{verified ? "Registry verified" : "Registry locked"}</span></div>
    <p className="safety-copy">Revigate does not accept, hold, allocate, refund, or transfer funds.</p>
    {mode === "publisher" && <>
      <div className="action-group"><h3>Register authenticated source</h3><div className="form-grid">
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
      {program && <><pre className="output-panel">{pretty(program)}</pre><div className="button-row"><button disabled={busy || !enabled} onClick={() => run(() => write("acknowledge_rules", [asInteger(programId, "Program ID"), BigInt(String(program.epoch)), String(program.active_sha), String(program.document_digest)]))}>Acknowledge current version</button><button disabled={busy || !enabled} onClick={() => run(() => write("reaffirm_rules", [asInteger(programId, "Program ID"), BigInt(String(program.epoch)), String(program.active_sha), String(program.document_digest)]))}>Reaffirm current version</button></div></>}</div>}
    {output && <pre className="output-panel" aria-live="polite">{output}</pre>}
  </section>;
}
