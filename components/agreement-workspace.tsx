"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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

type RecordValue = Record<string, unknown>;

const WEI_PER_GEN = 1_000_000_000_000_000_000n;
const CONTRACT_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_REVIGATE_CONTRACT || process.env.NEXT_PUBLIC_REVIGATE_REGISTRY);

function asRecord(value: unknown): RecordValue | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : null;
}

function asRows(value: unknown): RecordValue[] {
  const record = asRecord(value);
  return record && Array.isArray(record.items)
    ? record.items.filter((item): item is RecordValue => Boolean(asRecord(item)))
    : [];
}

function integer(value: unknown): bigint {
  try { return BigInt(String(value ?? "0")); } catch { return 0n; }
}

function formatGen(value: unknown, empty = "0") {
  const amount = integer(value);
  const whole = amount / WEI_PER_GEN;
  const fraction = (amount % WEI_PER_GEN).toString().padStart(18, "0").replace(/0+$/, "");
  return `${whole}${fraction ? `.${fraction.slice(0, 6)}` : ""}` || empty;
}

function parseGen(value: string): bigint {
  const text = value.trim();
  if (!/^\d+(\.\d{1,18})?$/.test(text)) throw new Error("Enter a valid GEN amount with up to 18 decimals.");
  const [whole, fraction = ""] = text.split(".");
  return BigInt(whole) * WEI_PER_GEN + BigInt(fraction.padEnd(18, "0"));
}

function formatDate(value: unknown) {
  const timestamp = integer(value);
  if (timestamp === 0n) return "Not set";
  const date = new Date(Number(timestamp) * 1000);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function toUnixSeconds(value: string, fallback: number) {
  if (!value.trim()) return BigInt(fallback);
  const timestamp = Math.floor(new Date(value).getTime() / 1000);
  if (!Number.isFinite(timestamp) || timestamp <= 0) throw new Error("Enter a valid date and time.");
  return BigInt(timestamp);
}

function currentUnixSeconds() { return Math.floor(Date.now() / 1000); }
function currentTimeMs() { return Date.now(); }

function short(value: unknown) {
  const text = String(value ?? "");
  return text.length > 18 ? `${text.slice(0, 8)}…${text.slice(-6)}` : text || "—";
}

function labelForState(value: unknown) {
  return String(value ?? "UNKNOWN").replaceAll("_", " ").toLowerCase().replace(/(^| )\S/g, (letter) => letter.toUpperCase());
}

function stateTone(value: unknown) {
  const state = String(value ?? "");
  if (["ACCEPTED_LOCKED", "MATURED_ALLOCATED", "MATERIAL_EXIT_ALLOCATED", "REFUND_ALLOCATED"].includes(state)) return "is-positive";
  if (["FUNDED_UNACCEPTED"].includes(state)) return "is-progress";
  if (["OFFERED_UNFUNDED"].includes(state)) return "is-open";
  return "is-muted";
}

type CreateForm = {
  programId: string;
  participant: string;
  amount: string;
  fundingDeadline: string;
  acceptanceDeadline: string;
  maturity: string;
  exitBps: string;
  exitWindow: string;
};

const initialCreateForm: CreateForm = {
  programId: "",
  participant: "",
  amount: "",
  fundingDeadline: "",
  acceptanceDeadline: "",
  maturity: "",
  exitBps: "0",
  exitWindow: "3600",
};

function ActionButton({ children, onClick, disabled = false, secondary = false }: Readonly<{ children: React.ReactNode; onClick: () => void; disabled?: boolean; secondary?: boolean }>) {
  return <button type="button" className={secondary ? "agreement-button agreement-button-secondary" : "agreement-button"} onClick={onClick} disabled={disabled}>{children}</button>;
}

export function AgreementWorkspace() {
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState<Eip1193Provider>();
  const [chainId, setChainId] = useState("");
  const [verified, setVerified] = useState(false);
  const [config, setConfig] = useState<RevigateConfig | null>(null);
  const [offers, setOffers] = useState<RecordValue[]>([]);
  const [ledger, setLedger] = useState<RecordValue | null>(null);
  const [credit, setCredit] = useState<bigint | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(initialCreateForm);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pending, setPending] = useState<PendingTransaction[]>([]);
  const [lastHash, setLastHash] = useState<Hash | "">("");
  const [lastMethod, setLastMethod] = useState("");
  const [status, setStatus] = useState("Loading agreements…");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [technicalOpen, setTechnicalOpen] = useState(false);
  const [clock, setClock] = useState(0);

  const refresh = useCallback(async (wallet = account) => {
    setBusy(true);
    try {
      const [page, totals] = await Promise.all([
        readRevigate("get_offer_page", [0n, 50n]),
        readRevigate("get_ledger_totals"),
      ]);
      const rows = asRows(page);
      const walletCredit = wallet ? await readRevigate("get_wallet_credit", [wallet]) : 0n;
      setOffers(rows);
      setLedger(asRecord(totals));
      setCredit(integer(walletCredit));
      setSelectedId((current) => current && rows.some((row) => String(row.id) === current) ? current : String(rows[0]?.id ?? ""));
      setStatus("");
    } catch (readError) {
      setStatus(readError instanceof Error ? readError.message : "Canonical agreements are unavailable.");
    } finally {
      setBusy(false);
    }
  }, [account]);

  useEffect(() => {
    queueMicrotask(() => {
      setPending(loadPendingTransactions());
      const session = typeof window === "undefined" ? undefined : window.__revigateWalletSession;
      if (session) { setAccount(session.account); setChainId(session.chainId); }
    });
    const wallet = typeof window === "undefined" ? undefined : window.ethereum;
    if (wallet) queueMicrotask(() => setProvider(wallet));
    const onSession = (event: Event) => {
      const detail = (event as CustomEvent<{ account?: unknown; chainId?: unknown }>).detail;
      setAccount(typeof detail?.account === "string" ? detail.account : "");
      setChainId(typeof detail?.chainId === "string" ? detail.chainId : "");
    };
    window.addEventListener(REVIGATE_WALLET_SESSION_EVENT, onSession);
    return () => window.removeEventListener(REVIGATE_WALLET_SESSION_EVENT, onSession);
  }, []);

  useEffect(() => {
    queueMicrotask(() => setClock(currentUnixSeconds()));
    const timer = window.setInterval(() => setClock(currentUnixSeconds()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!CONTRACT_CONFIGURED) { queueMicrotask(() => setStatus("A source-attested contract is not configured.")); return; }
    verifyRevigateDeployment().then(({ registryConfig }) => {
      setConfig(registryConfig);
      setVerified(true);
    }).catch((verifyError: unknown) => {
      setVerified(false);
      setStatus(verifyError instanceof Error ? verifyError.message : "The configured contract could not be verified.");
    });
  }, []);

  useEffect(() => { queueMicrotask(() => void refresh()); }, [refresh]);

  const selected = useMemo(() => offers.find((offer) => String(offer.id) === selectedId) ?? null, [offers, selectedId]);
  const filteredOffers = useMemo(() => offers.filter((offer) => {
    const state = String(offer.state ?? "UNKNOWN");
    const query = search.trim().toLowerCase();
    const matchesFilter = filter === "ALL" || state === filter;
    const matchesSearch = !query || [offer.id, offer.program_id, offer.publisher, offer.participant, offer.terms_digest].some((value) => String(value ?? "").toLowerCase().includes(query));
    return matchesFilter && matchesSearch;
  }), [filter, offers, search]);

  const activeAccount = account.toLowerCase();
  const publisher = String(selected?.publisher ?? "").toLowerCase();
  const participant = String(selected?.participant ?? "").toLowerCase();
  const selectedState = String(selected?.state ?? "");
  const maturity = integer(selected?.maturity);
  const matured = clock > 0 && maturity > 0n && maturity <= BigInt(clock);
  const canFund = Boolean(selected && selectedState === "OFFERED_UNFUNDED" && activeAccount && activeAccount === publisher);
  const canAccept = Boolean(selected && selectedState === "FUNDED_UNACCEPTED" && activeAccount && activeAccount === participant);
  const canRefund = Boolean(selected && ["OFFERED_UNFUNDED", "FUNDED_UNACCEPTED"].includes(selectedState) && activeAccount && activeAccount === publisher);
  const canReaffirm = Boolean(selected && selectedState === "ACCEPTED_LOCKED" && activeAccount && activeAccount === participant);
  const canMature = Boolean(canReaffirm && matured);
  const canWithdraw = Boolean(account && credit !== null && integer(credit) > 0n);
  const chainCorrect = Number.parseInt(chainId || "0", 16) === 61999;
  const actionsLocked = !provider || !account || !verified || !chainCorrect || !config?.custody_enabled || !config?.public_custody;

  function updateCreate(name: keyof CreateForm, value: string) {
    setCreateForm((current) => ({ ...current, [name]: value }));
  }

  async function inspect(hash: Hash, method = "transaction") {
    setBusy(true);
    try {
      const contract = getConfiguredRegistryAddress();
      const observed = await observeTransaction(hash, 4, account, contract);
      if (observed.state === "finalized-success") {
        forgetPendingTransaction(hash);
        setPending(loadPendingTransactions());
        setStatus(`${method} completed. Canonical agreement state refreshed.`);
        await refresh();
      } else if (observed.state === "finalized-error") {
        forgetPendingTransaction(hash);
        setPending(loadPendingTransactions());
        setError(`${method} failed after finalization. No state change is assumed.`);
      } else if (observed.state === "sender-mismatch" || observed.state === "contract-mismatch") {
        setError("The transaction identity did not match this wallet and contract. No state change is assumed.");
      } else {
        setStatus(`${method} is still unresolved. Keep the same transaction hash and do not resubmit.`);
      }
    } catch (inspectError) {
      setError(inspectError instanceof Error ? inspectError.message : "The existing transaction could not be read.");
    } finally {
      setBusy(false);
    }
  }

  async function write(method: string, args: (string | bigint | number | boolean)[], value = 0n): Promise<boolean> {
    if (!provider || !account) { setError("Connect a wallet before signing."); return false; }
    if (!verified) { setError("The configured contract has not passed its identity check."); return false; }
    if (!chainCorrect) { setError("Switch the wallet to GenLayer Studionet (chain 61999) before signing."); return false; }
    setBusy(true); setError(""); setStatus(`Waiting for wallet approval · ${method}`);
    try {
      const hash = await submitRevigateWrite({ provider, account, functionName: method, args, value });
      setLastHash(hash); setLastMethod(method);
      const contract = getConfiguredRegistryAddress();
      if (contract) {
        savePendingTransaction({ hash, account, method, args: args.map((arg) => typeof arg === "bigint" ? arg.toString() : arg) as (string | number | boolean)[], value: value.toString(), submittedAt: currentTimeMs(), contractAddress: contract, chainId: 61999 });
        setPending(loadPendingTransactions());
      }
      setStatus(`${method} submitted. Waiting for Studionet finality.`);
      await inspect(hash, method);
      return true;
    } catch (writeError) {
      setError(writeError instanceof Error ? writeError.message : "The wallet rejected the transaction.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createAgreement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const now = currentUnixSeconds();
      const submitted = await write("create_offer", [
        BigInt(createForm.programId),
        createForm.participant,
        parseGen(createForm.amount),
        toUnixSeconds(createForm.fundingDeadline, now + 3600),
        toUnixSeconds(createForm.acceptanceDeadline, now + 7200),
        toUnixSeconds(createForm.maturity, now + 86400),
        BigInt(createForm.exitBps || "0"),
        BigInt(createForm.exitWindow || "3600"),
      ]);
      if (!submitted) return;
      setShowCreate(false);
      setCreateForm(initialCreateForm);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Agreement could not be created.");
    }
  }

  function selectedAction(label: string, method: string, args: (string | bigint | number | boolean)[] = [], value = 0n, disabled = false) {
    return <ActionButton onClick={() => void write(method, args, value)} disabled={busy || actionsLocked || !selected || disabled}>{label}</ActionButton>;
  }

  async function withdraw() {
    try {
      const amount = parseGen(withdrawAmount);
      if (amount <= 0n || (credit !== null && amount > credit)) throw new Error("Enter an amount within your claimable GEN balance.");
      const submitted = await write("withdraw_credit", [amount]);
      if (!submitted) return;
      setWithdrawAmount("");
    } catch (withdrawError) {
      setError(withdrawError instanceof Error ? withdrawError.message : "Withdrawal could not be submitted.");
    }
  }

  const lockedReason = !account ? "Connect your wallet to take an action." : !chainCorrect ? "Switch to Studionet 61999 to continue." : !verified ? "The contract identity is still being verified." : "This action is unavailable for the selected agreement.";

  return <section className="agreement-workspace" aria-label="Agreements workspace">
    <div className="workspace-toolbar">
      <div><span className="panel-number">AGREEMENTS</span><h2>Your agreements</h2><p>Browse canonical records, then choose the next valid action.</p></div>
      <ActionButton onClick={() => setShowCreate(true)} disabled={busy || actionsLocked}>Create agreement <span aria-hidden="true">↗</span></ActionButton>
    </div>

    <div className="testnet-note"><span className="notice-dot" /><span>Studionet testnet. Use test GEN. Settlement is experimental.</span><Link href="/about">About the risks</Link></div>

    <div className="wallet-summary" aria-label="Wallet balances">
      <div><span>Wallet</span><strong>{account ? short(account) : "Not connected"}</strong><small>{chainCorrect ? "Studionet 61999" : account ? "Wrong network" : "Connect to personalize"}</small></div>
      <div><span>Claimable GEN</span><strong>{formatGen(credit)}</strong><small>From the canonical credit ledger</small></div>
      <div><span>Held in agreements</span><strong>{formatGen(ledger?.held)}</strong><small>Current contract read</small></div>
      <div><span>Contract balance</span><strong>{formatGen(ledger?.contract_balance ?? ledger?.deposited)}</strong><small>Read from the registry</small></div>
    </div>

    {showCreate && <div className="create-agreement-card">
      <div className="detail-heading"><div><span className="panel-number">NEW AGREEMENT</span><h3>Create an agreement</h3></div><button type="button" className="quiet-button" onClick={() => setShowCreate(false)}>Close</button></div>
      <form className="agreement-form" onSubmit={(event) => void createAgreement(event)}>
        <label>Program ID<input inputMode="numeric" required value={createForm.programId} onChange={(event) => updateCreate("programId", event.target.value)} placeholder="Verified program" /></label>
        <label>Participant wallet<input required value={createForm.participant} onChange={(event) => updateCreate("participant", event.target.value)} placeholder="0x…" /></label>
        <label>Principal (GEN)<input required inputMode="decimal" value={createForm.amount} onChange={(event) => updateCreate("amount", event.target.value)} placeholder="1.5" /></label>
        <label>Funding deadline<input type="datetime-local" value={createForm.fundingDeadline} onChange={(event) => updateCreate("fundingDeadline", event.target.value)} /></label>
        <label>Acceptance deadline<input type="datetime-local" value={createForm.acceptanceDeadline} onChange={(event) => updateCreate("acceptanceDeadline", event.target.value)} /></label>
        <label>Maturity date<input type="datetime-local" value={createForm.maturity} onChange={(event) => updateCreate("maturity", event.target.value)} /></label>
        <label>Material exit share (bps)<input inputMode="numeric" value={createForm.exitBps} onChange={(event) => updateCreate("exitBps", event.target.value)} /></label>
        <label>Exit window (seconds)<input inputMode="numeric" value={createForm.exitWindow} onChange={(event) => updateCreate("exitWindow", event.target.value)} /></label>
        <div className="form-actions"><ActionButton onClick={() => setShowCreate(false)} secondary>Cancel</ActionButton><button className="agreement-button" type="submit" disabled={busy || actionsLocked}>Create and sign</button></div>
      </form>
    </div>}

    <div className="agreement-browser-layout">
      <div className="agreement-catalog">
        <div className="catalog-toolbar"><div><span className="panel-number">CANONICAL RECORDS</span><h3>Browse agreements</h3></div><button type="button" className="quiet-button" onClick={() => void refresh()} disabled={busy}>{busy ? "Refreshing…" : "Refresh"}</button></div>
        <div className="catalog-filters"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID, wallet or digest" aria-label="Search agreements" /><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter agreements"><option value="ALL">All states</option>{["OFFERED_UNFUNDED", "FUNDED_UNACCEPTED", "ACCEPTED_LOCKED", "MATERIAL_EXIT_ALLOCATED", "REFUND_ALLOCATED", "MATURED_ALLOCATED"].map((state) => <option key={state} value={state}>{labelForState(state)}</option>)}</select></div>
        {status && <div className="notice notice-amber"><span className="notice-dot" />{status}</div>}
        {!status && filteredOffers.length === 0 && <div className="catalog-empty"><span>—</span><strong>No agreements found</strong><p>Try another search or create the first agreement.</p></div>}
        <div className="agreement-card-list">{filteredOffers.map((offer) => <button type="button" key={String(offer.id)} className={`agreement-list-card ${selectedId === String(offer.id) ? "is-selected" : ""}`} onClick={() => setSelectedId(String(offer.id))}>
          <span className="agreement-card-top"><span>AGREEMENT {String(offer.id)}</span><em className={stateTone(offer.state)}>{labelForState(offer.state)}</em></span>
          <strong>{formatGen(offer.amount)} GEN</strong>
          <span className="agreement-card-meta">Participant {short(offer.participant)} · maturity {formatDate(offer.maturity)}</span>
        </button>)}</div>
      </div>

      <aside className="agreement-detail" aria-live="polite">
        {!selected ? <div className="detail-empty"><span>+</span><h3>Select an agreement</h3><p>Choose a record to see its terms and available actions.</p></div> : <>
          <div className="detail-heading"><div><span className="panel-number">AGREEMENT {String(selected.id)}</span><h3>{labelForState(selected.state)}</h3></div><span className={`state-badge ${stateTone(selected.state)}`}>{labelForState(selected.state)}</span></div>
          <div className="detail-amount"><span>Principal</span><strong>{formatGen(selected.amount)} <small>GEN</small></strong><span>Held {formatGen(selected.held)} GEN</span></div>
          <dl className="detail-facts"><div><dt>Publisher</dt><dd title={String(selected.publisher)}>{short(selected.publisher)}</dd></div><div><dt>Participant</dt><dd title={String(selected.participant)}>{short(selected.participant)}</dd></div><div><dt>Funding deadline</dt><dd>{formatDate(selected.funding_deadline)}</dd></div><div><dt>Acceptance deadline</dt><dd>{formatDate(selected.acceptance_deadline)}</dd></div><div><dt>Maturity</dt><dd>{formatDate(selected.maturity)}</dd></div><div><dt>Rule epoch</dt><dd>{String(selected.epoch ?? "—")}</dd></div></dl>
          <div className="detail-actions"><span className="panel-number">NEXT VALID ACTION</span>{actionsLocked && <p className="action-hint">{lockedReason}</p>}{!actionsLocked && !canFund && !canAccept && !canRefund && !canReaffirm && !canWithdraw && <p className="action-hint">No action is available for this wallet in the current state.</p>}{canFund && selected && selected.amount !== undefined && selected.id !== undefined && selectedAction("Fund agreement", "fund_offer", [integer(selected.id)], integer(selected.amount))}{canAccept && selected && selectedAction("Accept agreement", "accept_offer", [integer(selected.id), String(selected.terms_digest ?? ""), integer(selected.epoch), String(selected.sha ?? "")], 0n, !selected.terms_digest)}{canAccept && selected && selectedAction("Decline agreement", "decline_offer", [integer(selected.id)])}{canRefund && selected && selectedAction("Refund unaccepted agreement", "cancel_unaccepted_offer", [integer(selected.id)], 0n, selectedState === "OFFERED_UNFUNDED")}{canReaffirm && selected && selectedAction("Reaffirm current rules", "reaffirm_offer_rules", [integer(selected.id), integer(selected.epoch), String(selected.sha ?? ""), String(selected.document_digest ?? "")], 0n)}{canReaffirm && selected && selectedAction("Exercise material exit", "exercise_material_exit", [integer(selected.id)])}{canMature && selected && selectedAction("Allocate maturity claim", "allocate_matured_claim", [integer(selected.id)])}{canWithdraw && <div className="withdraw-row"><label>Withdraw claimable GEN<input inputMode="decimal" value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} placeholder={formatGen(credit ?? 0n)} /></label><ActionButton onClick={() => void withdraw()} disabled={busy || actionsLocked}>Withdraw</ActionButton></div>}</div>
          <details className="advanced-details" open={technicalOpen} onToggle={(event) => setTechnicalOpen((event.currentTarget as HTMLDetailsElement).open)}><summary>Details</summary><dl className="detail-facts detail-facts-technical"><div><dt>Program</dt><dd>{String(selected.program_id ?? "—")}</dd></div><div><dt>Source commit</dt><dd title={String(selected.sha)}>{short(selected.sha)}</dd></div><div><dt>Terms digest</dt><dd title={String(selected.terms_digest)}>{short(selected.terms_digest)}</dd></div><div><dt>Contract</dt><dd title={getConfiguredRegistryAddress() ?? ""}>{short(getConfiguredRegistryAddress())}</dd></div></dl></details>
        </>}
      </aside>
    </div>

    <section className="transaction-history"><div className="catalog-toolbar"><div><span className="panel-number">ACTIVITY</span><h3>Transaction history</h3></div><span className="history-caption">Only your current wallet session</span></div>{lastHash && <div className="history-row"><span className="history-dot is-current" /><div><strong>{lastMethod || "Transaction"}</strong><small>{lastHash.slice(0, 12)}…{lastHash.slice(-6)}</small></div><button type="button" className="quiet-button" onClick={() => void inspect(lastHash, lastMethod || "Transaction")} disabled={busy}>Check status</button></div>}{pending.map((item) => <div className="history-row" key={item.hash}><span className="history-dot" /><div><strong>{item.method}</strong><small>{item.hash.slice(0, 12)}…{item.hash.slice(-6)} · pending</small></div><button type="button" className="quiet-button" onClick={() => void inspect(item.hash, item.method)} disabled={busy}>Resume</button></div>)}{!lastHash && pending.length === 0 && <p className="history-empty">Completed actions will appear here with their transaction hash.</p>}<details className="advanced-details"><summary>Technical transaction details</summary><p className="history-caption">Hashes are kept for recovery. An unresolved or failed transaction must never be replayed automatically.</p></details></section>
    {(error || status) && <div className={error ? "workspace-feedback is-error" : "workspace-feedback"} role={error ? "alert" : "status"}>{error || status}<button type="button" aria-label="Dismiss" onClick={() => { setError(""); if (!busy) setStatus(""); }}>×</button></div>}
  </section>;
}
