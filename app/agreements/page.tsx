import { ContractUnavailable, PageIntro } from "@/components/content";

export default function AgreementsPage() {
  return <div className="page-wrap">
    <PageIntro eyebrow="AGREEMENTS" title="Gated financial agreements." intro="The single Revigate contract contains the offer ledger, but agreement actions are enabled only after a source-attested custody-enabled deployment is verified." />
    <ContractUnavailable />
    <p className="safety-copy">The current public deployment remains locked. Do not send GEN to the Registry address. A disposable Studionet test has completed funded acceptance, material exit and refund evidence; maturity payout and independent transfer delivery proof remain open.</p>
  </div>;
}
