"use client";

import { useCallback, useEffect, useState } from "react";
import { readRevigate } from "@/lib/genlayer";
import { REVIGATE_WALLET_SESSION_EVENT } from "@/lib/wallet-session.mjs";

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : null;
}

function asRows(value: unknown): RecordValue[] {
  const record = asRecord(value);
  return record && Array.isArray(record.items) ? record.items.filter((item): item is RecordValue => Boolean(asRecord(item))) : [];
}

function integer(value: unknown): bigint {
  try { return BigInt(String(value ?? "0")); } catch { return 0n; }
}

function formatWei(value: unknown) {
  const wei = integer(value);
  const negative = wei < 0n;
  const absolute = negative ? -wei : wei;
  const whole = absolute / 1_000_000_000_000_000_000n;
  const fraction = (absolute % 1_000_000_000_000_000_000n).toString().padStart(18, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""} GEN (${value ?? "0"} wei)`;
}

function formatDate(value: unknown) {
  const timestamp = integer(value);
  if (timestamp === 0n) return "Not set";
  const date = new Date(Number(timestamp) * 1000);
  return Number.isNaN(date.getTime()) ? "Invalid timestamp" : date.toLocaleString();
}

function short(value: unknown) {
  const text = String(value ?? "");
  return text.length > 18 ? `${text.slice(0, 10)}…${text.slice(-6)}` : text;
}

function actionFor(offer: RecordValue) {
  const state = String(offer.state ?? "UNKNOWN");
  if (state === "OFFERED_UNFUNDED") return "Publisher funding route is available only on an explicitly enabled test deployment.";
  if (state === "FUNDED_UNACCEPTED") return "Participant acceptance or the applicable unaccepted-offer refund can be prepared from canonical terms.";
  if (state === "ACCEPTED_LOCKED") return integer(offer.maturity) <= BigInt(Math.floor(Date.now() / 1000))
    ? "Maturity allocation is eligible; verify the existing transaction or prepare the one-time claim."
    : `Maturity claim becomes eligible after ${formatDate(offer.maturity)}.`;
  if (state === "MATERIAL_EXIT_ALLOCATED") return "Credits are allocated; withdrawal remains a separate, externally observed settlement step.";
  if (state === "REFUND_ALLOCATED") return "Refund credit is allocated; withdrawal remains a separate settlement step.";
  if (state === "MATURED_ALLOCATED") return "Participant credit is allocated; delivery remains pending until independently verifiable.";
  return "No action is available from this canonical state.";
}

export function AgreementsBrowser() {
  const [offers, setOffers] = useState<RecordValue[]>([]);
  const [ledger, setLedger] = useState<RecordValue | null>(null);
  const [credit, setCredit] = useState<bigint | null>(null);
  const [account, setAccount] = useState(() => typeof window !== "undefined" ? window.__revigateWalletSession?.account ?? "" : "");
  const [status, setStatus] = useState("Loading canonical agreements…");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (wallet = account) => {
    setBusy(true);
    try {
      const [page, totals] = await Promise.all([
        readRevigate("get_offer_page", [0n, 50n]),
        readRevigate("get_ledger_totals"),
      ]);
      const nextLedger = asRecord(totals);
      const nextCredit = wallet ? await readRevigate("get_wallet_credit", [wallet]) : 0n;
      setOffers(asRows(page));
      setLedger(nextLedger);
      setCredit(integer(nextCredit));
      setStatus("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Canonical agreements are unavailable.");
    } finally {
      setBusy(false);
    }
  }, [account]);

  useEffect(() => {
    const initial = typeof window !== "undefined" ? window.__revigateWalletSession : undefined;
    const nextAccount = initial?.account ?? "";
    queueMicrotask(() => { void load(nextAccount); });
    const onSession = (event: Event) => {
      const detail = (event as CustomEvent<{ account?: unknown }>).detail;
      const next = typeof detail?.account === "string" ? detail.account : "";
      setAccount(next);
      void load(next);
    };
    window.addEventListener(REVIGATE_WALLET_SESSION_EVENT, onSession);
    return () => window.removeEventListener(REVIGATE_WALLET_SESSION_EVENT, onSession);
  }, [load]);

  return <section className="agreements-browser" aria-label="Canonical agreements">
    <div className="agreements-toolbar"><div><span className="panel-number">CANONICAL REGISTRY READS</span><h2>Agreements and balances</h2></div><button type="button" onClick={() => void load()} disabled={busy}>{busy ? "Refreshing…" : "Refresh reads"}</button></div>
    {status ? <div className="notice notice-amber"><span className="notice-dot" />{status}</div> : <>
      <div className="ledger-summary" aria-label="Ledger totals">
        <div><span>Deposited</span><strong>{formatWei(ledger?.deposited)}</strong></div>
        <div><span>Held</span><strong>{formatWei(ledger?.held)}</strong></div>
        <div><span>Claimable credits</span><strong>{formatWei(credit ?? ledger?.credits)}</strong></div>
        <div><span>Dispatched</span><strong>{formatWei(ledger?.dispatched)}</strong></div>
      </div>
      <p className="safety-copy">{account ? `Connected wallet credit: ${formatWei(credit)}.` : "Connect a wallet to read its claimable credit."} Delivery is shown as pending until the supported runtime provides independent settlement evidence.</p>
      {offers.length === 0 ? <div className="empty-state"><h3>No canonical offers returned</h3><p>The Registry returned no offer records for this deployment.</p></div> : <div className="agreement-list">{offers.map((offer) => <article className="agreement-card" key={String(offer.id)}>
        <div className="agreement-card-heading"><div><span>OFFER {String(offer.id)} · PROGRAM {String(offer.program_id)}</span><h3>{String(offer.state)}</h3></div><span className="status-pill">EPOCH {String(offer.epoch)}</span></div>
        <dl className="record-grid"><dt>Principal</dt><dd>{formatWei(offer.amount)}</dd><dt>Held</dt><dd>{formatWei(offer.held)}</dd><dt>Publisher</dt><dd title={String(offer.publisher)}>{short(offer.publisher)}</dd><dt>Participant</dt><dd title={String(offer.participant)}>{short(offer.participant)}</dd><dt>Frozen source</dt><dd>{short(offer.sha)}</dd><dt>Terms digest</dt><dd>{short(offer.terms_digest)}</dd><dt>Funding deadline</dt><dd>{formatDate(offer.funding_deadline)}</dd><dt>Acceptance deadline</dt><dd>{formatDate(offer.acceptance_deadline)}</dd><dt>Maturity</dt><dd>{formatDate(offer.maturity)}</dd></dl>
        <p className="field-note">{actionFor(offer)}</p>
      </article>)}</div>}
    </>}
  </section>;
}
