import Link from "next/link";
import { ContractUnavailable, Eyebrow, Notice } from "@/components/content";
import { ProgramList } from "@/components/registry-browser";

export default function Home() {
  return <>
    <div className="home-status"><ContractUnavailable /></div>
    <section className="hero">
      <div className="hero-copy">
        <Eyebrow>PUBLICATION HISTORY · RULEBOOK REVIEW</Eyebrow>
        <h1>Rules can change.<br /><em>Promises need a record.</em></h1>
        <p>Revigate binds participant acknowledgments to reviewed rulebook versions and records whether later signed revisions materially changed those rules.</p>
        <div className="hero-actions"><Link className="button-primary" href="/publish">Open Publisher Studio <span>↗</span></Link><Link className="text-link" href="/about">How the record works <span>→</span></Link></div>
      </div>
      <div className="hero-card">
        <div className="hero-card-top"><span>PROTOCOL BLUEPRINT</span><span className="record-icon">RV</span></div>
        <div className="record-line"><span className="record-index">01</span><div><b>Reviewed rulebook</b><small>Fixed source and epoch binding</small></div><span className="record-check">○</span></div>
        <div className="record-line"><span className="record-index">02</span><div><b>Participant acknowledgment</b><small>Wallet · exact terms · frozen digest</small></div><span className="record-check">○</span></div>
        <div className="record-line"><span className="record-index">03</span><div><b>Revision assessment</b><small>Material · nonmaterial · inconclusive</small></div><span className="record-lock">⌑</span></div>
        <div className="card-foot"><span>CUSTODY MODEL</span><span>Native GEN · release gated</span></div>
      </div>
      <div className="hero-stamp">A PUBLIC RECORD<br />FOR PARTICIPATION</div>
    </section>
    <section className="trust-strip"><div><strong>01</strong><span>Immutable source<br />at a signed commit</span></div><div><strong>02</strong><span>Independent semantic<br />review by GenLayer</span></div><div><strong>03</strong><span>Version-specific<br />wallet acknowledgment</span></div></section>
    <section className="section-block"><div className="section-heading"><div><Eyebrow>THE READING ROOM</Eyebrow><h2>Latest reviewed programs</h2></div><Link href="/my-rules" className="text-link">Open acknowledgments →</Link></div><ProgramList /></section>
    <section className="explain-grid"><div><span className="step-no">I</span><h3>A rulebook gets a version.</h3><p>A publisher registers a fixed Markdown file at a signed GitHub commit. Future submissions are reviewed against that exact source.</p></div><div><span className="step-no">II</span><h3>A person acknowledges it.</h3><p>The wallet acknowledgment records the exact reviewed epoch, commit and document digest.</p></div><div><span className="step-no">III</span><h3>Changes remain visible.</h3><p>Validators classify later authenticated revisions as material, nonmaterial or inconclusive and preserve the history.</p></div></section>
    <div className="fine-print"><Notice>Revigate records wallet actions and public source versions. This public deployment keeps financial writes locked; never send GEN to the Registry address.</Notice></div>
  </>;
}
