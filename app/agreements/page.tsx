import { ContractUnavailable, PageIntro } from "@/components/content";
import { ContractWorkbench } from "@/components/contract-workbench";

export default function AgreementsPage() {
  return <div className="page-wrap">
    <PageIntro eyebrow="AGREEMENTS" title="Commitments, by wallet." intro="Read a canonical offer, check the designated wallet and frozen terms, then use the action available to that wallet." />
    <ContractUnavailable />
    <ContractWorkbench mode="participant" />
  </div>;
}
