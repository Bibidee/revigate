import { ContractUnavailable, PageIntro } from "@/components/content";

export default function AgreementsPage() {
  return <div className="page-wrap">
    <PageIntro eyebrow="AGREEMENTS" title="Financial agreements removed." intro="The active Revigate release is a noncustodial Registry. It records reviewed rulebooks and acknowledgments without accepting or distributing GEN." />
    <ContractUnavailable />
    <p className="safety-copy">No offers, funding, refunds, exits, maturity payouts or withdrawals are available. Use <a href="/my-rules">My rules</a> for acknowledgments.</p>
  </div>;
}
