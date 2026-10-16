import { PageIntro } from "@/components/content";
import { AgreementsBrowser } from "@/components/agreements-browser";
import { ContractWorkbench } from "@/components/contract-workbench";

export default function AgreementsPage() {
  return <div className="page-wrap">
    <PageIntro eyebrow="AGREEMENTS" title="Canonical agreement records." intro="Read offers, frozen terms, deadlines, balances and claimable credits directly from the source-attested Registry. Connect an injected wallet to create, fund, accept, settle and withdraw a disposable Studionet agreement." />
    <AgreementsBrowser />
    <ContractWorkbench mode="participant" />
  </div>;
}
