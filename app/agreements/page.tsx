import { PageIntro } from "@/components/content";
import { AgreementsBrowser } from "@/components/agreements-browser";
import { ContractWorkbench } from "@/components/contract-workbench";

export default function AgreementsPage() {
  return <div className="page-wrap">
    <PageIntro eyebrow="AGREEMENTS" title="Canonical agreement records." intro="Read offers, frozen terms, deadlines, balances and claimable credits directly from the source-attested Registry. Writes remain gated by the deployment configuration and wallet session." />
    <AgreementsBrowser />
    <ContractWorkbench mode="participant" />
  </div>;
}
