import { Notice, PageIntro } from "@/components/content";

export default function AboutPage() {
  return <div className="page-wrap">
    <PageIntro eyebrow="ABOUT THE PROTOCOL" title="Rules with a history." intro="Revigate combines authenticated rulebooks, GenLayer materiality consensus and a deploy-gated agreement ledger in one Intelligent Contract." />
    <div className="article">
      <h2>What the protocol is for</h2>
      <p>A publisher registers a signed public rulebook. Participants acknowledge reviewed versions. GenLayer validators assess whether a later authenticated revision changes substantive participation conditions.</p>
      <h2>What the record preserves</h2>
      <p>Each reviewed commit, document digest, epoch, acknowledgment, material event, offer term and settlement transition remains part of the program history.</p>
      <h2>Trust boundaries</h2>
      <p>GitHub signatures authenticate the published commit and manifest nomination. Wallet signatures authenticate actions. Materiality is a consensus result and may be inconclusive. The publisher submits revisions explicitly; branch changes are not monitored automatically.</p>
      <h2>Custody gate</h2>
      <p>The same source contains deterministic offer, credit and settlement mechanics, but production custody is locked. A test deployment must prove funded transitions and independently verified external delivery before public custody is enabled.</p>
      <Notice>Never send funds to an unverified or locked deployment. Unsolicited transfers and value sent through unsupported routes are not application credit.</Notice>
    </div>
  </div>;
}
