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
      <h2>Noncustodial by design</h2>
      <p>The source-attested Registry authenticates public rulebooks, revision materiality and wallet acknowledgments. It has no native-value entry point, offer ledger, credits, refunds or withdrawals.</p>
      <Notice>Never send funds to the Registry address. Unsolicited network transfers are not application credit and are not recoverable through Revigate.</Notice>
    </div>
  </div>;
}
