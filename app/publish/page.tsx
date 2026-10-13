import { ContractUnavailable, PageIntro } from "@/components/content";
import { ContractWorkbench } from "@/components/contract-workbench";

export default function PublishPage() {
  return <div className="page-wrap">
    <PageIntro eyebrow="PUBLISHER STUDIO" title="Register a program." intro="Propose an immutable publication source, verify its provenance, then issue a participant-specific offer. Funding and acceptance are separate wallet actions." />
    <ContractUnavailable />
    <ContractWorkbench mode="publisher" />
  </div>;
}
