"use client";

import { useEffect, useState } from "react";
import {
  forgetPendingTransaction,
  getConfiguredRegistryAddress,
  loadPendingTransactions,
  observeTransaction,
  readRevigate,
  savePendingTransaction,
  submitRevigateWrite,
  verifyRevigateDeployment,
} from "@/lib/genlayer";
import type { Eip1193Provider, Hash, PendingTransaction } from "@/lib/genlayer";

const contractConfigured = Boolean(process.env.NEXT_PUBLIC_REVIGATE_CONTRACT || process.env.NEXT_PUBLIC_REVIGATE_REGISTRY);
type WorkbenchMode = "publisher" | "participant";
type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : null;
}
function asInteger(value: unknown, label: string): bigint {
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) throw new Error(`${label} must be a whole, non-negative integer.`);
  return BigInt(text);
}
function pretty(value: unknown) {
  return JSON.stringify(value, (_key, item: unknown) => typeof item === "bigint" ? item.toString() : item, 2);
}

export function ContractWorkbench({ mode, initialProgramId = "", initialReviewId = "" }: { mode: WorkbenchMode; initialProgramId?: string; initialReviewId?: string }) {
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState<Eip1193Provider>();
  const [chainId, setChainId] = useState("");
  const [verified, setVerified] = useState(false);
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [programId, setProgramId] = useState(initialProgramId);
  const [reviewId, setReviewId] = useState(initialReviewId);
  const [programDetails, setProgramDetails] = useState<RecordValue | null>(null);
  const [pending, setPending] = useState<PendingTransaction[]>([]);
  const [lastHash, setLastHash] = useState<Hash | "">("");
  const [lastAccount, setLastAccount] = useState("");
  const [form, setForm] = useState({
    repo: "", rulebookPath: "rules/program.md", manifestPath: ".revigate/publisher.json",
    branch: "main", baselineSha: "", candidateSha: "",
  });

  useEffect(() => {
    queueMicrotask(() => setPending(loadPendingTransactions()));
    const wallet = typeof window === "undefined" ? undefined : window.ethereum;
    if (!wallet) return;
    queueMicrotask(() => setProvider(wallet));
    const refresh = (value: unknown) => setAccount(Array.isArray(value) && typeof value[0] === "string" ? value[0] : "");
    const refreshChain = (value: unknown) => setChainId(typeof value === "string" ? value : "");
    wallet.request({ method: "eth_accounts" }).then(refresh).catch(() => setAccount(""));
    wallet.request({ method: "eth_chainId" }).then(refreshChain).catch(() => setChainId(""));
    wallet.on?.("accountsChanged", refresh); wallet.on?.("chainChanged", refreshChain);
    return () => { wallet.removeListener?.("accountsChanged", refresh); wallet.removeListener?.("chainChanged", refreshChain); };
  }, []);

  useEffect(() => {
    if (!contractConfigured) return;
    verifyRevigateDeployment().then(() => setVerified(true)).catch((error: unknown) => {
      setVerified(false); setOutput(error instanceof Error ? error.message : "The configured Registry could not be verified.");
    });
  }, []);

  function update(name: keyof typeof form, value: string) { setForm((current) => ({ ...current, [name]: value })); }
  function runAction(action: () => Promise<unknown>) {
    void action().catch((error: unknown) => setOutput(error instanceof Error ? error.message : "Action failed."));
  }
  async function write(method: string, args: (string | bigint | number | boolean)[]) {
    if (!provider || !account) { setOutput("Connect a wallet with the header button before signing."); return; }
    if (!verified) { setOutput("The configured noncustodial Registry has not passed the identity check."); return; }
    if (Number.parseInt(chainId || "0", 16) !== 61999) { setOutput("Switch the wallet to GenLayer Studionet (chain 61999) before signing."); return; }
    setBusy(true); setOutput(`Waiting for wallet approval: ${method}`);
    try {
      const hash = await submitRevigateWrite({ provider, account, functionName: method, args, value: 0n });
      setLastHash(hash); setLastAccount(account);
      setOutput(`Transaction submitted. Hash: ${hash}\nThe hash is saved locally. Check this same hash; do not resubmit while it is pending.`);
      try {
        const contractAddress = getConfiguredRegistryAddress();
        if (!contractAddress) throw new Error("The contract address is not configured.");
        savePendingTransaction({ hash, account, method, args: args.map((arg) => typeof arg === "bigint" ? arg.toString() : arg) as (string | number | boolean)[], value: "0", submittedAt: Date.now(), contractAddress, chainId: 61999 });
        setPending(loadPendingTransactions());
      } catch { setOutput(`Transaction submitted. Copy this hash for recovery: ${hash}`); }
    } catch (error) { setOutput(error instanceof Error ? error.message : "The wallet rejected the request before a transaction hash was returned."); }
    finally { setBusy(false); }
  }
  async function checkTransaction(hash: Hash, expectedAccount?: string) {
    setBusy(true); setOutput(`Checking the existing transaction ${hash}. No new transaction will be submitted.`);
    try {
      const observed = await observeTransaction(hash, 10, expectedAccount);
      if (observed.state === "finalized-success") { forgetPendingTransaction(hash); setPending(loadPendingTransactions()); setOutput(`FINALIZED · execution succeeded\n${pretty(observed.transaction)}`); }
      else if (observed.state === "finalized-error") { forgetPendingTransaction(hash); setPending(loadPendingTransactions()); setOutput(`FINALIZED · execution failed. No state change is assumed.\n${pretty(observed.transaction)}`); }
      else if (observed.state === "undetermined") setOutput(`UNDETERMINED · keep this hash and do not resubmit.\n${pretty(observed.transaction)}`);
      else if (observed.state === "cancelled") { forgetPendingTransaction(hash); setPending(loadPendingTransactions()); setOutput(`Transaction was cancelled.\n${pretty(observed.transaction)}`); }
      else if (observed.state === "sender-mismatch") setOutput(`Sender mismatch. No success or state change is assumed.\n${pretty(observed.transaction)}`);
      else if (observed.state === "finalized-execution-unknown") setOutput(`FINALIZED · execution result unavailable. Confirm Registry state separately.\n${pretty(observed.transaction)}`);
      else setOutput(`Still processing. The original hash remains saved; check this same hash again later.\n${pretty(observed.transaction ?? {})}`);
    } catch (error) { setOutput(`Could not read the existing hash. It is still saved; do not resubmit. ${error instanceof Error ? error.message : "RPC error"}`); }
    finally { setBusy(false); }
  }
  async function loadProgram(id: string) {
    const result = await readRevigate("get_program", [asInteger(id, "Program ID")]);
    const record = asRecord(result); setProgramDetails(record && Object.keys(record).length ? record : null);
    setOutput(record && Object.keys(record).length ? pretty(record) : "No program exists with this ID.");
  }
  async function loadProgramSafely() {
    if (!programId.trim()) { setOutput("Enter a program ID."); return; }
    setBusy(true); try { await loadProgram(programId); } catch (error) { setOutput(error instanceof Error ? error.message : "Program read failed."); } finally { setBusy(false); }
  }

  return <section className="contract-workbench">
    <div className="workbench-heading"><div><span className="panel-number">STUDIONET · {mode === "publisher" ? "PUBLISHER" : "PARTICIPANT"}</span><h2>Registry actions</h2></div><span className="wallet-context">{account ? `${account.slice(0, 6)}…${account.slice(-4)}` : "Wallet not connected"}</span></div>
    <p className="workbench-copy">Revigate is noncustodial. Writes use the connected wallet on GenLayer Studionet and always send zero native GEN value.</p>
    <p className="safety-copy"><strong>Native GEN custody is removed.</strong> There are no offers, funding, credits, refunds, withdrawals or financial agreements in this release. Never send funds to the Registry address; unsolicited network transfers are not application credit.</p>
    {!contractConfigured && <p className="safety-copy">Actions are locked because no verified deployment address is configured.</p>}
    {contractConfigured && !verified && <p className="safety-copy">Actions are locked until the configured noncustodial source-attested deployment is verified.</p>}
    <fieldset className="workbench-actions" disabled={!contractConfigured || !verified}>
      {mode === "publisher" ? <>
        <div className="action-group"><h3>Register and verify a rulebook</h3><div className="action-grid">
          <label>GitHub owner/repository<input value={form.repo} onChange={(event) => update("repo", event.target.value)} placeholder="owner/repository" /></label>
          <label>Rulebook path<input value={form.rulebookPath} onChange={(event) => update("rulebookPath", event.target.value)} /></label>
          <label>Publisher manifest path<input value={form.manifestPath} onChange={(event) => update("manifestPath", event.target.value)} /></label>
          <label>Branch<input value={form.branch} onChange={(event) => update("branch", event.target.value)} /></label>
          <label>Signed baseline commit SHA<input value={form.baselineSha} onChange={(event) => update("baselineSha", event.target.value)} placeholder="40 hex characters" /></label>
        </div><button disabled={busy} onClick={() => runAction(() => write("register_program", [form.repo, form.rulebookPath, form.manifestPath, form.branch, form.baselineSha]))}>Register program</button>
        <div className="action-inline"><label>Program ID<input inputMode="numeric" value={programId} onChange={(event) => setProgramId(event.target.value)} /></label><button disabled={busy || !programId} onClick={() => runAction(() => write("verify_program", [asInteger(programId, "Program ID")]))}>Verify source</button><button disabled={busy || !programId} onClick={() => runAction(() => loadProgramSafely())}>Read program</button></div></div>
        <div className="action-group"><h3>Request a rulebook review</h3><div className="action-inline"><label>Candidate commit SHA<input value={form.candidateSha} onChange={(event) => update("candidateSha", event.target.value)} placeholder="40 hex characters" /></label><button disabled={busy || !programId} onClick={() => runAction(() => write("request_revision", [asInteger(programId, "Program ID"), form.candidateSha]))}>Request review</button></div><div className="action-inline"><label>Review ID<input inputMode="numeric" value={reviewId} onChange={(event) => setReviewId(event.target.value)} /></label><button disabled={busy || !reviewId} onClick={() => runAction(() => write("assess_revision", [asInteger(reviewId, "Review ID")]))}>Assess revision</button><button disabled={busy || !reviewId} onClick={() => runAction(() => write("expire_revision_request", [asInteger(reviewId, "Review ID")]))}>Expire after deadline</button></div></div>
      </> : <div className="action-group"><h3>Rulebook acknowledgments</h3><div className="action-inline"><label>Program ID<input inputMode="numeric" value={programId} onChange={(event) => { setProgramId(event.target.value); setProgramDetails(null); }} /></label><button disabled={busy || !programId} onClick={() => runAction(() => loadProgramSafely())}>Read program</button></div>{programDetails && <div className="offer-summary"><b>{String(programDetails.status)} · epoch {String(programDetails.epoch)}</b><span>Reviewed commit: {String(programDetails.active_sha)}</span><span>Rulebook digest: {String(programDetails.document_digest)}</span></div>}{programDetails?.status === "VERIFIED" && <div className="action-buttons"><button disabled={busy} onClick={() => runAction(() => write("acknowledge_rules", [asInteger(programId, "Program ID"), asInteger(programDetails.epoch, "Program epoch"), String(programDetails.active_sha), String(programDetails.document_digest)]))}>Acknowledge current rules</button><button disabled={busy} onClick={() => runAction(() => write("reaffirm_rules", [asInteger(programId, "Program ID"), asInteger(programDetails.epoch, "Program epoch"), String(programDetails.active_sha), String(programDetails.document_digest)]))}>Reaffirm current rules</button></div>}</div>}
    </fieldset>
    <div className="action-group transaction-group"><h3>Transaction status</h3>{lastHash && <button disabled={busy} onClick={() => void checkTransaction(lastHash, lastAccount)}>Check current hash</button>}{pending.map((item) => <button className="pending-hash" key={item.hash} disabled={busy} onClick={() => void checkTransaction(item.hash, item.account)}>{item.method} · {item.hash.slice(0, 12)}… · resume status</button>)}<pre className="result-console" aria-live="polite">{output || "Registry reads and zero-value transaction evidence will appear here."}</pre></div>
  </section>;
}
