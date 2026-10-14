import { ContractUnavailable, PageIntro } from "@/components/content";
import { ContractWorkbench } from "@/components/contract-workbench";

export default function PublishPage() {
  return <div className="page-wrap">
    <PageIntro eyebrow="PUBLISHER STUDIO" title="Register a program." intro="Propose an immutable publication source, verify its provenance, and request materiality reviews for later signed revisions." />
    <ContractUnavailable />
    <ContractWorkbench mode="publisher" />
  </div>;
}
