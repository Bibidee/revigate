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
import { REVIGATE_WALLET_SESSION_EVENT } from "@/lib/wallet-session.mjs";
import type { Eip1193Provider, Hash, PendingTransaction, RevigateConfig } from "@/lib/genlayer";

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
const WEI_PER_GEN = 1_000_000_000_000_000_000n;
function parseGen(value: unknown, label: string): bigint {
  const text = String(value).trim();
  if (!/^\d+(\.\d{1,18})?$/.test(text)) throw new Error(`${label} must be a non-negative GEN amount with at most 18 decimals.`);
  const [whole, fraction = ""] = text.split(".");
  return BigInt(whole) * WEI_PER_GEN + BigInt(fraction.padEnd(18, "0"));
}
function formatGen(value: unknown): string {
  let amount: bigint;
  try { amount = BigInt(String(value ?? "0")); } catch { return "0"; }
  const whole = amount / WEI_PER_GEN;
  const fraction = (amount % WEI_PER_GEN).toString().padStart(18, "0").replace(/0+$/, "");
  return `${whole}${fraction ? `.${fraction}` : ""}`;
}
function toUnixSeconds(value: string, label: string, fallback: bigint): bigint {
  if (!value.trim()) return fallback;
  if (/^\d+$/.test(value.trim())) return BigInt(value.trim());
  const timestamp = Math.floor(new Date(value).getTime() / 1000);
  if (!Number.isFinite(timestamp) || timestamp <= 0) throw new Error(`${label} must be a valid future date.`);
  return BigInt(timestamp);
}
function pretty(value: unknown) {
  return JSON.stringify(value, (_key, item: unknown) => typeof item === "bigint" ? item.toString() : item, 2);
}

export function ContractWorkbench({ mode, initialProgramId = "", initialReviewId = "" }: { mode: WorkbenchMode; initialProgramId?: string; initialReviewId?: string }) {
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState<Eip1193Provider>();
  const [chainId, setChainId] = useState("");
  const [verified, setVerified] = useState(false);
  const [deploymentConfig, setDeploymentConfig] = useState<RevigateConfig | null>(null);
  const [walletCredit, setWalletCredit] = useState<bigint | null>(null);
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [programId, setProgramId] = useState(initialProgramId);
  const [reviewId, setReviewId] = useState(initialReviewId);
  const [programDetails, setProgramDetails] = useState<RecordValue | null>(null);
  const [offerDetails, setOfferDetails] = useState<RecordValue | null>(null);
  const [pending, setPending] = useState<PendingTransaction[]>([]);
  const [lastHash, setLastHash] = useState<Hash | "">("");
  const [lastAccount, setLastAccount] = useState("");
  const [form, setForm] = useState({
    repo: "", rulebookPath: "rules/program.md", manifestPath: ".revigate/publisher.json",
    branch: "main", baselineSha: "", candidateSha: "", participant: "", amount: "",
    fundingDeadline: "", acceptanceDeadline: "", maturity: "", exitBps: "0",
    exitWindow: "3600", offerId: "", termsDigest: "", expectedEpoch: "",
    expectedSha: "", withdrawAmount: "", transferId: "",
  });

  useEffect(() => {
    queueMicrotask(() => setPending(loadPendingTransactions()));
    const wallet = typeof window === "undefined" ? undefined : window.ethereum;
    if (!wallet) return;
    queueMicrotask(() => setProvider(wallet));
    const applySession = (detail: unknown) => {
      const state = detail && typeof detail === "object" ? detail as { account?: unknown; chainId?: unknown } : {};
      setAccount(typeof state.account === "string" ? state.account : "");
      setChainId(typeof state.chainId === "string" ? state.chainId : "");
    };
    applySession(window.__revigateWalletSession);
    const onSession = (event: Event) => applySession((event as CustomEvent).detail);
    window.addEventListener(REVIGATE_WALLET_SESSION_EVENT, onSession);
    return () => window.removeEventListener(REVIGATE_WALLET_SESSION_EVENT, onSession);
  }, []);

  useEffect(() => {
    if (!contractConfigured) return;
    verifyRevigateDeployment().then(({ registryConfig }) => {
      setDeploymentConfig(registryConfig); setVerified(true);
    }).catch((error: unknown) => {
      setDeploymentConfig(null); setVerified(false); setOutput(error instanceof Error ? error.message : "The configured Registry could not be verified.");
    });
  }, []);

  function update(name: keyof typeof form, value: string) { setForm((current) => ({ ...current, [name]: value })); }
  function runAction(action: () => Promise<unknown>) {
    void action().catch((error: unknown) => setOutput(error instanceof Error ? error.message : "Action failed."));
  }
  async function write(method: string, args: (string | bigint | number | boolean)[], value = 0n) {
    if (!provider || !account) { setOutput("Connect a wallet with the header button before signing."); return; }
    if (!verified) { setOutput("The configured Revigate deployment has not passed the identity check."); return; }
    if (Number.parseInt(chainId || "0", 16) !== 61999) { setOutput("Switch the wallet to GenLayer Studionet (chain 61999) before signing."); return; }
    setBusy(true); setOutput(`Waiting for wallet approval: ${method}`);
    try {
      const hash = await submitRevigateWrite({ provider, account, functionName: method, args, value });
      setLastHash(hash); setLastAccount(account);
      setOutput(`Transaction submitted. Hash: ${hash}\nWaiting for Studionet finality. Do not resubmit this hash while it is pending.`);
      const contractAddress = getConfiguredRegistryAddress();
      try {
        if (!contractAddress) throw new Error("The contract address is not configured.");
        savePendingTransaction({ hash, account, method, args: args.map((arg) => typeof arg === "bigint" ? arg.toString() : arg) as (string | number | boolean)[], value: value.toString(), submittedAt: Date.now(), contractAddress, chainId: 61999 });
        setPending(loadPendingTransactions());
      } catch { setOutput(`Transaction submitted. Copy this hash for recovery: ${hash}`); }
      if (contractAddress) {
        const observed = await observeTransaction(hash, 10, account, contractAddress);
        if (observed.state === "finalized-success") {
          forgetPendingTransaction(hash); setPending(loadPendingTransactions());
          setOutput(`FINALIZED · execution succeeded\n${pretty(observed.transaction)}\n\nRefresh canonical state before taking the next action.`);
          if (form.offerId) { try { await loadOfferSafely(); } catch { /* the receipt remains the source of truth */ } }
          try { const credit = await readRevigate("get_wallet_credit", [account]); setWalletCredit(BigInt(String(credit ?? "0"))); } catch { /* keep the receipt visible */ }
        } else if (observed.state === "finalized-error") {
          forgetPendingTransaction(hash); setPending(loadPendingTransactions());
          setOutput(`FINALIZED · execution failed. No state change is assumed.\n${pretty(observed.transaction)}`);
        } else if (observed.state === "undetermined" || observed.state === "rpc-unavailable" || observed.state === "finalized-execution-unknown") {
          setOutput(`The submitted hash remains unresolved. Keep it and do not resubmit.\n${pretty(observed)}`);
        } else {
          setOutput(`The transaction is still pending. Keep this hash and check it again later.\n${pretty(observed.transaction ?? {})}`);
        }
      }
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
  async function loadOfferSafely() {
    if (!form.offerId.trim()) { setOutput("Enter an offer ID."); return; }
    setBusy(true); try {
      const record = asRecord(await readRevigate("get_offer", [asInteger(form.offerId, "Offer ID")]));
      setOfferDetails(record && Object.keys(record).length ? record : null);
      if (!record || !Object.keys(record).length) { setOutput("No offer exists with this ID."); return; }
      setForm((current) => ({ ...current,
        offerId: String(record.id ?? current.offerId),
        participant: String(record.participant ?? current.participant),
        amount: formatGen(record.amount),
        termsDigest: String(record.terms_digest ?? current.termsDigest),
        expectedEpoch: String(record.epoch ?? current.expectedEpoch),
        expectedSha: String(record.sha ?? current.expectedSha),
      }));
      if (record.program_id !== undefined) setProgramId(String(record.program_id));
      if (account) {
        const credit = await readRevigate("get_wallet_credit", [account]);
        setWalletCredit(BigInt(String(credit ?? "0")));
      }
      setOutput(pretty(record));
    } catch (error) { setOutput(error instanceof Error ? error.message : "Offer read failed."); }
    finally { setBusy(false); }
  }
  async function loadLedgerSafely() {
    setBusy(true); try { setOutput(pretty(await readRevigate("get_ledger_totals"))); }
    catch (error) { setOutput(error instanceof Error ? error.message : "Ledger read failed."); }
    finally { setBusy(false); }
  }
  async function loadCreditSafely() {
    if (!account) { setWalletCredit(null); setOutput("Connect a wallet before reading its claimable credit."); return; }
    setBusy(true);
    try {
      const credit = await readRevigate("get_wallet_credit", [account]);
      setWalletCredit(BigInt(String(credit ?? "0")));
      setOutput(`Claimable credit: ${formatGen(credit)} GEN`);
    } catch (error) { setOutput(error instanceof Error ? error.message : "Credit read failed."); }
    finally { setBusy(false); }
  }
  const custodyEnabled = deploymentConfig?.custody_enabled === true;
  const publicCustody = deploymentConfig?.public_custody === true;
  const offerTimes = () => {
    const now = Math.floor(Date.now() / 1000);
    return {
      funding: toUnixSeconds(form.fundingDeadline, "Funding deadline", BigInt(now + 3600)),
      acceptance: toUnixSeconds(form.acceptanceDeadline, "Acceptance deadline", BigInt(now + 7200)),
      maturity: toUnixSeconds(form.maturity, "Maturity", BigInt(now + 86400)),
    };
  };
  const offerState = String(offerDetails?.state ?? "");
  const offerPublisher = String(offerDetails?.publisher ?? "").toLowerCase();
  const offerParticipant = String(offerDetails?.participant ?? "").toLowerCase();
  const activeAccount = account.toLowerCase();
  const hasLoadedOffer = Boolean(offerDetails && form.offerId);
  const canFund = hasLoadedOffer && offerState === "OFFERED_UNFUNDED" && activeAccount === offerPublisher;
  const canAccept = hasLoadedOffer && offerState === "FUNDED_UNACCEPTED" && activeAccount === offerParticipant;
  const canDecline = canAccept;
  const canCancel = hasLoadedOffer && ["OFFERED_UNFUNDED", "FUNDED_UNACCEPTED"].includes(offerState) && activeAccount === offerPublisher;
  const canReaffirm = hasLoadedOffer && offerState === "ACCEPTED_LOCKED" && activeAccount === offerParticipant;
  const canMaterialExit = canReaffirm;
  const maturity = BigInt(String(offerDetails?.maturity ?? "0"));
  const canMature = hasLoadedOffer && offerState === "ACCEPTED_LOCKED" && maturity > 0n && BigInt(Math.floor(Date.now() / 1000)) >= maturity;
  const withdrawWei = form.withdrawAmount ? (() => { try { return parseGen(form.withdrawAmount, "Withdraw amount"); } catch { return 0n; } })() : 0n;
  const canWithdraw = Boolean(account && walletCredit !== null && withdrawWei > 0n && walletCredit >= withdrawWei);

  return <section className="contract-workbench">
    <div className="workbench-heading"><div><span className="panel-number">STUDIONET · {mode === "publisher" ? "PUBLISHER" : "PARTICIPANT"}</span><h2>Registry actions</h2></div><span className="wallet-context">{account ? `${account.slice(0, 6)}…${account.slice(-4)}` : "Wallet not connected"}</span></div>
    <p className="workbench-copy">Revigate combines authenticated rulebooks, materiality consensus and a gated funded agreement ledger in one source-attested Intelligent Contract.</p>
    <p className="safety-copy"><strong>Studionet testnet notice.</strong> Native GEN escrow and external settlement are experimental. Use only disposable testnet funds. The supported funding route records a claim before ordinary validation, but unsolicited value, no-calldata transfers and failed external delivery are never treated as application credit.</p>
    {!contractConfigured && <p className="safety-copy">Actions are locked because no verified deployment address is configured.</p>}
    {contractConfigured && !verified && <p className="safety-copy">Actions are locked until the configured source-attested deployment is verified.</p>}
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
    <section className="action-group financial-actions" aria-label="Funded agreement controls">
      <h3>Funded agreement ledger</h3>
      {!custodyEnabled && <p className="safety-copy">Funding is unavailable because this verified deployment has custody disabled.</p>}
      {custodyEnabled && !publicCustody && <p className="safety-copy">This deployment can exercise custody for testing, but public financial controls are disabled.</p>}
      <fieldset disabled={!contractConfigured || !verified || !custodyEnabled || !publicCustody} className="workbench-actions">
        <div className="action-grid">
          <label>Participant wallet<input value={form.participant} onChange={(event) => update("participant", event.target.value)} placeholder="0x…" /></label>
          <label>Principal (GEN)<input inputMode="decimal" value={form.amount} onChange={(event) => update("amount", event.target.value)} placeholder="0.000001" /></label>
          <label>Funding deadline<input type="datetime-local" value={form.fundingDeadline} onChange={(event) => update("fundingDeadline", event.target.value)} /></label>
          <label>Acceptance deadline<input type="datetime-local" value={form.acceptanceDeadline} onChange={(event) => update("acceptanceDeadline", event.target.value)} /></label>
          <label>Maturity date<input type="datetime-local" value={form.maturity} onChange={(event) => update("maturity", event.target.value)} /></label>
          <label>Material exit share (bps)<input inputMode="numeric" value={form.exitBps} onChange={(event) => update("exitBps", event.target.value)} /></label>
          <label>Exit window (seconds)<input inputMode="numeric" value={form.exitWindow} onChange={(event) => update("exitWindow", event.target.value)} /></label>
          <label>Offer ID<input inputMode="numeric" value={form.offerId} onChange={(event) => update("offerId", event.target.value)} /></label>
          <label>Terms digest<input value={form.termsDigest} onChange={(event) => update("termsDigest", event.target.value)} /></label>
          <label>Frozen rule epoch<input inputMode="numeric" value={form.expectedEpoch} onChange={(event) => update("expectedEpoch", event.target.value)} /></label>
          <label>Frozen rule SHA<input value={form.expectedSha} onChange={(event) => update("expectedSha", event.target.value)} /></label>
          <label>Withdraw amount (GEN)<input inputMode="decimal" value={form.withdrawAmount} onChange={(event) => update("withdrawAmount", event.target.value)} placeholder="0.000001" /></label>
          <label>Transfer ID<input inputMode="numeric" value={form.transferId} onChange={(event) => update("transferId", event.target.value)} /></label>
        </div>
        {offerDetails && <div className="offer-summary" aria-live="polite"><b>Offer {String(offerDetails.id)} · {String(offerDetails.state)}</b><span>Frozen terms: epoch {String(offerDetails.epoch)} · SHA {String(offerDetails.sha)}</span><span>Terms digest: {String(offerDetails.terms_digest)}</span><span>Held: {formatGen(offerDetails.held)} GEN · maturity: {new Date(Number(offerDetails.maturity ?? 0) * 1000).toLocaleString()}</span></div>}
        <div className="action-buttons">
          <button disabled={busy || !programId || !form.participant || !form.amount} onClick={() => runAction(async () => { const times = offerTimes(); await write("create_offer", [asInteger(programId, "Program ID"), form.participant, parseGen(form.amount, "Principal"), times.funding, times.acceptance, times.maturity, asInteger(form.exitBps, "Exit share"), asInteger(form.exitWindow, "Exit window")]); })}>Create offer</button>
          <button disabled={busy || !form.offerId} onClick={() => runAction(loadOfferSafely)}>Read offer</button>
          <button disabled={busy || !canFund || !form.amount} onClick={() => runAction(() => write("fund_offer", [asInteger(form.offerId, "Offer ID")], parseGen(form.amount, "Principal")))}>Fund offer</button>
          <button disabled={busy || !canAccept || !form.termsDigest || !form.expectedEpoch || !form.expectedSha} onClick={() => runAction(() => write("accept_offer", [asInteger(form.offerId, "Offer ID"), form.termsDigest, asInteger(form.expectedEpoch, "Frozen rule epoch"), form.expectedSha]))}>Accept offer</button>
          <button disabled={busy || !canDecline} onClick={() => runAction(() => write("decline_offer", [asInteger(form.offerId, "Offer ID")]))}>Decline offer</button>
          <button disabled={busy || !canCancel} onClick={() => runAction(() => write("cancel_unaccepted_offer", [asInteger(form.offerId, "Offer ID")]))}>Refund unaccepted offer</button>
          <button disabled={busy || !canReaffirm || !form.expectedEpoch || !form.expectedSha} onClick={() => runAction(() => write("reaffirm_offer_rules", [asInteger(form.offerId, "Offer ID"), asInteger(form.expectedEpoch, "Current rule epoch"), form.expectedSha, String(offerDetails?.document_digest ?? "")]))}>Reaffirm current rules</button>
          <button disabled={busy || !canMaterialExit} onClick={() => runAction(() => write("exercise_material_exit", [asInteger(form.offerId, "Offer ID")]))}>Material exit</button>
          <button disabled={busy || !canMature} onClick={() => runAction(() => write("allocate_matured_claim", [asInteger(form.offerId, "Offer ID")]))}>Maturity payout</button>
          <button disabled={busy || !canWithdraw} onClick={() => runAction(() => write("withdraw_credit", [withdrawWei]))}>Withdraw credit</button>
          <button disabled={busy || !form.transferId} onClick={() => runAction(() => write("record_transfer_delivery_claim", [asInteger(form.transferId, "Transfer ID"), "recipient balance-delta evidence"] ))}>Record delivery evidence</button>
          <button disabled={busy} onClick={() => runAction(loadCreditSafely)}>Read my credit</button><button disabled={busy} onClick={() => runAction(loadLedgerSafely)}>Read ledger</button>
        </div>
      </fieldset>
    </section>
    <div className="action-group transaction-group"><h3>Transaction status</h3>{lastHash && <button disabled={busy} onClick={() => void checkTransaction(lastHash, lastAccount)}>Check current hash</button>}{pending.map((item) => <button className="pending-hash" key={item.hash} disabled={busy} onClick={() => void checkTransaction(item.hash, item.account)}>{item.method} · {item.hash.slice(0, 12)}… · resume status</button>)}<pre className="result-console" aria-live="polite">{output || "Registry reads and zero-value transaction evidence will appear here."}</pre></div>
  </section>;
}
