import Link from "next/link";
import { ContractUnavailable, Eyebrow, Notice } from "@/components/content";

export default function Home() {
  return <>
    <div className="home-status"><ContractUnavailable /></div>
    <section className="hero">
      <div className="hero-copy">
        <Eyebrow>PUBLICATION HISTORY · PARTICIPANT RIGHTS</Eyebrow>
        <h1>Rules can change.<br /><em>Promises need a record.</em></h1>
        <p>Revigate is designed to bind participation to a reviewed rulebook version and protect accepted GEN entitlements on their original terms.</p>
        <div className="hero-actions"><Link className="button-primary" href="/publish">Open Publisher Studio <span>↗</span></Link><Link className="text-link" href="/about">How the record works <span>→</span></Link></div>
      </div>
      <div className="hero-card">
        <div className="hero-card-top"><span>PROTOCOL BLUEPRINT</span><span className="record-icon">RV</span></div>
        <div className="record-line"><span className="record-index">01</span><div><b>Reviewed rulebook</b><small>Fixed source and epoch binding</small></div><span className="record-check">○</span></div>
        <div className="record-line"><span className="record-index">02</span><div><b>Participant acknowledgment</b><small>Wallet · exact terms · frozen digest</small></div><span className="record-check">○</span></div>
        <div className="record-line"><span className="record-index">03</span><div><b>Protected entitlement</b><small>Separate funding and acceptance</small></div><span className="record-lock">⌑</span></div>
        <div className="card-foot"><span>IMPLEMENTATION STATUS</span><span>Contract not deployed</span></div>
      </div>
      <div className="hero-stamp">A PUBLIC RECORD<br />FOR PARTICIPATION</div>
    </section>
    <section className="trust-strip"><div><strong>01</strong><span>Immutable source<br />at a signed commit</span></div><div><strong>02</strong><span>Independent semantic<br />review by GenLayer</span></div><div><strong>03</strong><span>Participant entitlement<br />fixed at acceptance</span></div></section>
    <section className="section-block"><div className="section-heading"><div><Eyebrow>THE READING ROOM</Eyebrow><h2>Latest reviewed programs</h2></div><Link href="/agreements" className="text-link">Browse agreements →</Link></div><div className="empty-state"><div className="empty-symbol">—</div><h3>No live programs yet</h3><p>Program records will appear after the audited contract is deployed and verified.</p></div></section>
    <section className="explain-grid"><div><span className="step-no">I</span><h3>A rulebook gets a version.</h3><p>A publisher registers a fixed Markdown file at a signed GitHub commit. Future submissions are reviewed against that exact source.</p></div><div><span className="step-no">II</span><h3>A person accepts a record.</h3><p>The participant signs the reviewed version and exact offer terms. The accepted amount and maturity are immutable.</p></div><div><span className="step-no">III</span><h3>A material change has a consequence.</h3><p>Validators assess meaning. Material changes refresh the program epoch and may open a pre-agreed exit. Maturity remains protected.</p></div></section>
    <div className="fine-print"><Notice>Revigate records wallet actions and public source versions. It does not establish legal identity or automate rights outside the protocol.</Notice></div>
  </>;
}
