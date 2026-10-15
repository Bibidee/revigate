import { Notice, PageIntro } from "@/components/content";

export default function AboutPage() {
  return <div className="page-wrap">
    <PageIntro eyebrow="ABOUT THE PROTOCOL" title="Rules with a history." intro="Revigate asks whether a verified public rulebook materially changed after someone acknowledged it." />
    <div className="article">
      <h2>What the protocol is for</h2>
      <p>A publisher registers a public rulebook. A participant can acknowledge a reviewed version. GenLayer validators assess whether a later authenticated revision changes substantive participation conditions.</p>
      <h2>What the record preserves</h2>
      <p>Each reviewed commit, document digest, epoch, acknowledgment, material event and assessment remains part of the program history.</p>
      <h2>Trust boundaries</h2>
      <p>GitHub provides immutable commit-addressed source and signature metadata, but it does not prove an organization&apos;s legal identity. The publisher submits revisions explicitly; GitHub branch changes are not monitored automatically. Wallet signatures prove control of a key for that action.</p>
      <h2>Release-gated native GEN custody</h2>
      <p>The source-attested single contract contains native GEN offer, credit and withdrawal accounting. Funding and withdrawal actions remain release-gated until hosted payable-failure, rollback and recipient-delivery evidence passes.</p>
      <Notice>Do not send funds to Revigate while the custody gate is locked. A finalized parent or child transaction alone is not proof that a recipient received GEN.</Notice>
    </div>
  </div>;
}
