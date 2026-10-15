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
  const stringValue = String(value).trim();
  if (!/^\d+$/.test(stringValue)) throw new Error(`${label} must be a whole, non-negative integer.`);
  return BigInt(stringValue);
}

function pretty(value: unknown) {
  return JSON.stringify(value, (_key, item: unknown) => typeof item === "bigint" ? item.toString() : item, 2);
}

export function ContractWorkbench({ mode, initialOfferId = "", initialProgramId = "", initialReviewId = "" }: { mode: WorkbenchMode; initialOfferId?: string; initialProgramId?: string; initialReviewId?: string }) {
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState<Eip1193Provider>();
  const [chainId, setChainId] = useState("");
  const [verified, setVerified] = useState(false);
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [programId, setProgramId] = useState(initialProgramId);
  const [programDetails, setProgramDetails] = useState<RecordValue | null>(null);
  const [reviewId, setReviewId] = useState(initialReviewId);
  const [offerId, setOfferId] = useState(initialOfferId);
  const [offer, setOffer] = useState<RecordValue | null>(null);
  const [walletOffers, setWalletOffers] = useState<RecordValue[]>([]);
  const [pending, setPending] = useState<PendingTransaction[]>([]);
  const [lastHash, setLastHash] = useState<Hash | "">("");
  const [lastAccount, setLastAccount] = useState("");
  const [form, setForm] = useState({
    repo: "",
    rulebookPath: "rules/program.md",
    manifestPath: ".revigate/publisher.json",
    branch: "main",
    baselineSha: "",
    candidateSha: "",
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
    const refresh = (value: unknown) => setAccount(Array.isArray(value) && typeof value[0] === "string" ? value[0] : "");
    const refreshChain = (value: unknown) => setChainId(typeof value === "string" ? value : "");
    wallet.request({ method: "eth_accounts" }).then(refresh).catch(() => setAccount(""));
    wallet.request({ method: "eth_chainId" }).then(refreshChain).catch(() => setChainId(""));
    wallet.on?.("accountsChanged", refresh);
    wallet.on?.("chainChanged", refreshChain);
    return () => { wallet.removeListener?.("accountsChanged", refresh); wallet.removeListener?.("chainChanged", refreshChain); };
  }, []);

  useEffect(() => {
    if (!contractConfigured) return;
    verifyRevigateDeployment().then(() => setVerified(true)).catch((error: unknown) => {
      setVerified(false);
      setOutput(error instanceof Error ? error.message : "The configured contract could not be verified.");
    });
  }, []);

  function update(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function runAction(action: () => Promise<unknown>) {
    try {
      void action().catch((error: unknown) => setOutput(error instanceof Error ? error.message : "Action failed."));
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "Check the form values and try again.");
    }
  }

  async function write(method: string, args: (string | bigint | number | boolean)[], value = 0n) {
    if (!provider || !account) { setOutput("Connect a wallet with the header button before signing."); return; }
    if (!verified) { setOutput("The configured single-contract deployment has not passed the identity check."); return; }
    if (Number.parseInt(chainId || "0", 16) !== 61999) { setOutput("Switch the wallet to GenLayer Studionet (chain 61999) before signing."); return; }
    setBusy(true);
    setOutput(`Waiting for wallet approval: ${method}`);
    try {
      const hash = await submitRevigateWrite({ provider, account, functionName: method, args, value });
      setLastHash(hash);
      setLastAccount(account);
      setOutput(`Transaction submitted. Hash: ${hash}\nThe hash is saved locally. Check its status here; do not submit the action again while it is pending.`);
      try {
        const contractAddress = getConfiguredRegistryAddress();
        if (!contractAddress) throw new Error("The contract address is not configured.");
        savePendingTransaction({ hash, account, method,
          args: args.map((arg) => typeof arg === "bigint" ? arg.toString() : arg) as (string | number | boolean)[],
          value: value.toString(), submittedAt: Date.now(), contractAddress, chainId: 61999 });
        setPending(loadPendingTransactions());
      } catch {
        setOutput(`Transaction submitted, but this browser could not save the recovery pointer. Copy this hash now and check only this hash: ${hash}`);
      }
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "The wallet rejected the request before a transaction hash was returned.");
    } finally {
      setBusy(false);
    }
  }

  async function checkTransaction(hash: Hash, expectedAccount?: string) {
    setBusy(true);
    setOutput(`Checking the existing transaction ${hash}. No new transaction will be submitted.`);
    try {
      const observed = await observeTransaction(hash, 10, expectedAccount);
      if (observed.state === "finalized-success") {
        forgetPendingTransaction(hash);
        setPending(loadPendingTransactions());
        setOutput(`FINALIZED · execution succeeded\n${pretty(observed.transaction)}`);
        if (offerId) await loadOffer(offerId, false);
      } else if (observed.state === "finalized-error") {
        forgetPendingTransaction(hash);
        setPending(loadPendingTransactions());
        setOutput(`FINALIZED · execution failed. No state change is assumed.\n${pretty(observed.transaction)}`);
      } else if (observed.state === "undetermined") {
        setOutput(`UNDETERMINED · do not assume a product verdict, balance change, or success. Keep this hash and do not resubmit.\n${pretty(observed.transaction)}`);
      } else if (observed.state === "cancelled") {
        forgetPendingTransaction(hash);
        setPending(loadPendingTransactions());
        setOutput(`Transaction was cancelled.\n${pretty(observed.transaction)}`);
      } else if (observed.state === "sender-mismatch") {
        setOutput(`The transaction sender does not match the wallet that initiated this action. No success or state change is assumed.\n${pretty(observed.transaction)}`);
      } else {
        setOutput(`Still processing. The original hash remains saved; check this same hash again later.\n${pretty(observed.transaction ?? {})}`);
      }
    } catch (error) {
      setOutput(`Could not read the existing hash. It is still saved; do not resubmit. ${error instanceof Error ? error.message : "RPC error"}`);
    } finally {
      setBusy(false);
    }
  }

  async function read(method: string, args: (string | bigint | number | boolean)[]) {
    setBusy(true);
    try {
      const result = await readRevigate(method, args);
      setOutput(pretty(result));
      return result;
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "Contract read failed.");
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  async function loadOffer(id: string, show = true) {
    const result = await readRevigate("get_offer", [asInteger(id, "Offer ID")]);
    const record = asRecord(result);
    setOffer(record && Object.keys(record).length ? record : null);
    if (show) setOutput(record && Object.keys(record).length ? pretty(record) : "No offer exists with this ID.");
    return record;
  }

  async function loadProgram(id: string, show = true) {
    const result = await readRevigate("get_program", [asInteger(id, "Program ID")]);
    const record = asRecord(result);
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
    setBusy(true);
    try {
      const result = asRecord(await readRevigate("get_wallet_offer_page", [account, 0n, 20n]));
      const items = Array.isArray(result?.items) ? result.items.map(asRecord).filter((item): item is RecordValue => Boolean(item)) : [];
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
  const unaccepted = offer?.state === "FUNDED_UNACCEPTED";
  const accepted = offer?.state === "ACCEPTED_LOCKED";
  const closure = asRecord(offer?.closure);

  return <section className="contract-workbench">
    <div className="workbench-heading">
      <div><span className="panel-number">{mode === "publisher" ? "STUDIONET · PUBLISHER" : "STUDIONET · PARTICIPANT"}</span><h2>Contract actions</h2></div>
      <span className="wallet-context">{account ? `${account.slice(0, 6)}…${account.slice(-4)}` : "Wallet not connected"}</span>
    </div>
    <p className="workbench-copy">Every write uses the connected wallet through GenLayerJS on chain 61999. The console shows the transaction hash before checking finality, and resumes status checks by that same hash.</p>

    {!contractConfigured && <p className="safety-copy">Actions are locked because no verified deployment address is configured.</p>}
    {contractConfigured && !verified && <p className="safety-copy">Actions are locked until the configured source-attested deployment is verified.</p>}
    <fieldset className="workbench-actions" disabled={!contractConfigured || !verified}>
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
        <button disabled={busy} onClick={() => runAction(() => write("register_program", [form.repo, form.rulebookPath, form.manifestPath, form.branch, form.baselineSha]))}>Register program</button>
        <div className="action-inline"><label>Program ID<input inputMode="numeric" value={programId} onChange={(event) => setProgramId(event.target.value)} /></label>
          <button disabled={busy || !programId} onClick={() => runAction(() => write("verify_program", [asInteger(programId, "Program ID")]))}>Verify source</button>
          <button disabled={busy || !programId} onClick={() => runAction(() => loadProgramSafely())}>Read program</button>
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
        <h3>Issue a funded participant offer</h3>
        <div className="action-grid">
          <label>Designated participant wallet<input value={form.participant} onChange={(event) => update("participant", event.target.value)} placeholder="0x…" /></label>
          <label>Amount in wei<input inputMode="numeric" value={form.amount} onChange={(event) => update("amount", event.target.value)} /></label>
          <label>Funding deadline · Unix seconds<input inputMode="numeric" value={form.fundingDeadline} onChange={(event) => update("fundingDeadline", event.target.value)} /></label>
          <label>Acceptance deadline · Unix seconds<input inputMode="numeric" value={form.acceptanceDeadline} onChange={(event) => update("acceptanceDeadline", event.target.value)} /></label>
          <label>Maturity · Unix seconds<input inputMode="numeric" value={form.maturity} onChange={(event) => update("maturity", event.target.value)} /></label>
          <label>Participant material exit · basis points<input inputMode="numeric" value={form.exitBps} onChange={(event) => update("exitBps", event.target.value)} /></label>
          <label>Fixed exit window · seconds<input inputMode="numeric" value={form.exitWindow} onChange={(event) => update("exitWindow", event.target.value)} /></label>
        </div>
        <button disabled={busy || !programId} onClick={() => runAction(() => write("create_offer", [
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
        {walletOffers.length > 0 && <div className="offer-list">{walletOffers.map((item) => <button className="offer-list-item" key={String(item.id)} disabled={busy} onClick={() => { setOfferId(String(item.id)); runAction(() => loadOffer(String(item.id))); }}>{`Offer ${String(item.id)} · ${String(item.state)} · ${String(item.amount)} wei`}</button>)}</div>}
        <div className="action-inline"><label>Offer ID<input inputMode="numeric" value={offerId} onChange={(event) => { setOfferId(event.target.value); setOffer(null); }} /></label>
          <button disabled={busy || !offerId} onClick={() => void loadOfferSafely()}>Read offer</button>
        </div>
        {offer && <div className="offer-summary"><b>{String(offer.state)}</b><span>Amount: {String(offer.amount)} wei</span><span>Publisher: {String(offer.publisher)}</span><span>Participant: {String(offer.participant)}</span><span>Maturity: {String(offer.maturity)}</span></div>}
        {offer && isPublisher && offer.state === "OFFERED_UNFUNDED" && <button disabled={busy} onClick={() => runAction(() => write("fund_offer", [asInteger(offerId, "Offer ID")], asInteger(offer.amount, "Offer amount")))}>Fund exact offer amount</button>}
        {offer && isParticipant && unaccepted && <div className="action-buttons">
          <button disabled={busy} onClick={() => runAction(() => write("accept_offer", [asInteger(offerId, "Offer ID"), String(offer.terms_digest), asInteger(offer.epoch, "Offer epoch"), String(offer.sha)]))}>Accept frozen terms</button>
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
          <p className="workbench-copy">Publisher: {String(closure.amount_a)} wei · Participant: {String(closure.amount_b)} wei</p>
          {account && String(closure.proposer).toLowerCase() !== account.toLowerCase() && <button disabled={busy} onClick={() => runAction(() => write("approve_closure", [asInteger(offerId, "Offer ID"), String(closure.digest)]))}>Approve exact closure</button>}
          {(isPublisher || isParticipant) && <button disabled={busy} onClick={() => runAction(() => write("cancel_closure", [asInteger(offerId, "Offer ID")]))}>Cancel pending closure</button>}
          <button disabled={busy} onClick={() => runAction(() => write("expire_closure", [asInteger(offerId, "Offer ID")]))}>Expire after deadline</button>
        </div>}
      </div>
      <div className="action-group">
        <h3>Read wallet credit</h3>
        {account ? <button disabled={busy} onClick={() => runAction(() => read("get_wallet_credit", [account]))}>Check connected wallet credit</button> : <p>Connect a wallet to check its canonical credit balance.</p>}
        <p className="safety-copy">Credit withdrawal stays disabled until outgoing transfer delivery and recovery pass the required live proof.</p>
      </div>
    </>}
    </fieldset>

    <div className="action-group transaction-group">
      <h3>Transaction status</h3>
      {lastHash && <button disabled={busy} onClick={() => void checkTransaction(lastHash, lastAccount)}>Check current hash</button>}
      {pending.map((item) => <button className="pending-hash" key={item.hash} disabled={busy} onClick={() => void checkTransaction(item.hash, item.account)}>{item.method} · {item.hash.slice(0, 12)}… · resume status</button>)}
      <pre className="result-console" aria-live="polite">{output || "Contract reads and transaction evidence will appear here."}</pre>
    </div>
  </section>;
}
