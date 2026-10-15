import { ContractUnavailable, PageIntro } from "@/components/content";
import { ContractWorkbench } from "@/components/contract-workbench";

export default function AgreementsPage() {
  return <div className="page-wrap">
    <PageIntro eyebrow="AGREEMENTS" title="Commitments, by wallet." intro="Read canonical offers, confirm the designated wallets and frozen terms, and use only the action available to the connected wallet." />
    <ContractUnavailable />
    <ContractWorkbench mode="participant" />
  </div>;
}
