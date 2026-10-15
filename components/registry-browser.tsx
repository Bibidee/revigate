"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readRevigate } from "@/lib/genlayer";
import { normalizeRulebookSource, parseRulebookClauses, sha256Hex, validateRevisionSourceIdentity } from "@/lib/rulebook-source.mjs";

type Row = Record<string, unknown>;
const rows = (value: unknown) => value && typeof value === "object" && Array.isArray((value as Row).items) ? (value as { items: Row[] }).items : [];
const COMMIT_SHA = /^[0-9a-f]{40}$/i;
const SOURCE_DIGEST = /^[0-9a-f]{64}$/i;
async function source(program: Row, sha: string, expectedDigest: string) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(String(program.repo))
      || !/^[A-Za-z0-9_./-]+\.md$/.test(String(program.rulebook_path))
      || !COMMIT_SHA.test(sha) || !SOURCE_DIGEST.test(expectedDigest)) {
    throw new Error("Authenticated source identity or digest is incomplete.");
  }
  const response = await fetch(`https://raw.githubusercontent.com/${program.repo}/${sha}/${program.rulebook_path}`);
  if (!response.ok) throw new Error(`Authenticated source returned HTTP ${response.status}.`);
  const text = normalizeRulebookSource(await response.text());
  const digest = await sha256Hex(text);
  if (digest !== expectedDigest.toLowerCase()) throw new Error("Fetched source does not match the canonical Registry digest.");
  return text;
}

export function ProgramList() {
  const [items, setItems] = useState<Row[]>([]); const [cursor, setCursor] = useState(0n);
  const [status, setStatus] = useState("Loading canonical programs…");
  const load = async (before = 0n) => {
    try { const page = await readRevigate("get_program_page", [before, 20n]) as Row; setItems((old) => before ? [...old, ...rows(page)] : rows(page)); setCursor(BigInt(String(page.next_cursor ?? 0))); setStatus(""); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Programs are unavailable."); }
  };
  useEffect(() => {
    let current = true;
    void readRevigate("get_program_page", [0n, 20n]).then((value) => {
      if (!current) return;
      const page = value as Row;
      setItems(rows(page));
      setCursor(BigInt(String(page.next_cursor ?? 0)));
      setStatus("");
    }).catch((error: unknown) => {
      if (current) setStatus(error instanceof Error ? error.message : "Programs are unavailable.");
    });
    return () => { current = false; };
  }, []);
  if (status) return <div className="empty-state"><p>{status}</p></div>;
  if (!items.length) return <div className="empty-state"><h3>No reviewed programs yet</h3><p>The Registry returned an empty canonical page.</p></div>;
  return <div className="program-list">{items.map((item) => <Link className="program-card" href={`/program/${String(item.id)}`} key={String(item.id)}><span>PROGRAM {String(item.id)} · EPOCH {String(item.epoch)}</span><strong>{String(item.repo)}</strong><small>{String(item.active_sha || item.baseline_sha)}</small><em>{String(item.status)}</em></Link>)}{cursor > 0n && <button onClick={() => void load(cursor)}>Load older programs</button>}</div>;
}

export function ProgramRecord({ programId }: { programId: string }) {
  const [program, setProgram] = useState<Row>(); const [text, setText] = useState(""); const [events, setEvents] = useState<Row[]>([]); const [error, setError] = useState("");
  useEffect(() => { void (async () => { try { const record = await readRevigate("get_program", [BigInt(programId)]) as Row; setProgram(record); if (record.active_sha) setText(await source(record, String(record.active_sha), String(record.document_digest))); setEvents(rows(await readRevigate("get_material_event_page", [BigInt(programId), 0n, 50n]))); } catch (e) { setError(e instanceof Error ? e.message : "Program unavailable."); } })(); }, [programId]);
  if (error) return <div className="notice notice-amber">{error}</div>; if (!program) return <div className="empty-state"><p>Loading canonical program…</p></div>;
  return <><article className="program-sheet"><div className="sheet-heading"><div><span>AUTHENTICATED SOURCE</span><strong>{String(program.repo)}</strong></div><span className="status-pill">{String(program.status)}</span></div><dl className="record-grid"><dt>Commit</dt><dd>{String(program.active_sha)}</dd><dt>Digest</dt><dd>{String(program.document_digest)}</dd><dt>Epoch</dt><dd>{String(program.epoch)}</dd><dt>Publisher</dt><dd>{String(program.publisher)}</dd></dl><pre className="rulebook-source">{text || "No active verified source."}</pre></article><section className="program-sheet"><h2>Material history</h2>{events.length ? events.map((event) => <p key={String(event.index)}>Epoch {String(event.epoch)} · {String(event.at)}</p>) : <p>No material revisions recorded.</p>}</section></>;
}

export function RevisionRecord({ programId, reviewId }: { programId: string; reviewId: string }) {
  const [data, setData] = useState<{ review: Row; before: Record<string, unknown>; after: Record<string, unknown>; candidateAuthenticated: boolean }>(); const [error, setError] = useState("");
  useEffect(() => { void (async () => { try {
    const [program, review] = await Promise.all([readRevigate("get_program", [BigInt(programId)]), readRevigate("get_review", [BigInt(reviewId)])]) as [Row, Row];
    const { candidateDigest, candidateAuthenticated } = validateRevisionSourceIdentity(programId, review);
    const beforeText = await source(program, String(review.base_sha), String(review.base_digest));
    const afterText = candidateDigest ? await source(program, String(review.candidate_sha), candidateDigest) : "";
    setData({ review, before: parseRulebookClauses(beforeText), after: afterText ? parseRulebookClauses(afterText) : {}, candidateAuthenticated });
  } catch (e) { setError(e instanceof Error ? e.message : "Revision unavailable."); } })(); }, [programId, reviewId]);
  if (error) return <div className="notice notice-amber">{error}</div>; if (!data) return <div className="empty-state"><p>Loading authenticated revision evidence…</p></div>;
  const ids = [...new Set([...Object.keys(data.before), ...Object.keys(data.after)])];
  return <><div className="notice">Outcome: {String(data.review.status)} · base {String(data.review.base_sha)} · candidate {String(data.review.candidate_sha)}</div>{!data.candidateAuthenticated && <div className="notice notice-amber">Candidate source UNVERIFIED. The Registry did not provide an authenticated candidate digest for this INCONCLUSIVE review, so candidate text is not rendered as trusted evidence.</div>}<div className="compare-grid">{ids.map((id) => <div className="program-sheet" key={id}><strong>{id}</strong><h3>Before</h3><pre>{JSON.stringify(data.before[id], null, 2)}</pre>{data.candidateAuthenticated ? <><h3>After</h3><pre>{JSON.stringify(data.after[id], null, 2)}</pre></> : <><h3>After</h3><p className="notice notice-amber">UNVERIFIED candidate source withheld.</p></>}</div>)}</div></>;
}

export function AcknowledgmentHistory() {
  const [programId, setProgramId] = useState(""); const [wallet, setWallet] = useState(""); const [items, setItems] = useState<Row[]>([]); const [error, setError] = useState("");
  useEffect(() => { void window.ethereum?.request({ method: "eth_accounts" }).then((accounts: unknown) => { if (Array.isArray(accounts) && typeof accounts[0] === "string") setWallet(accounts[0]); }); }, []);
  const load = async () => { try { setItems(rows(await readRevigate("get_acknowledgment_page", [BigInt(programId), wallet, 0n, 50n]))); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "History unavailable."); } };
  return <section className="program-sheet"><div className="action-inline"><label>Program ID<input value={programId} onChange={(e) => setProgramId(e.target.value)} /></label><label>Wallet<input value={wallet} onChange={(e) => setWallet(e.target.value)} /></label><button onClick={() => void load()}>Load history</button></div>{error && <p>{error}</p>}{items.map((item) => <p key={String(item.index)}>Epoch {String(item.epoch)} · {String(item.sha)} · {String(item.digest)}</p>)}</section>;
}
