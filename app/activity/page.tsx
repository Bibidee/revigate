import { ContractUnavailable, PageIntro } from "@/components/content";
import { ContractWorkbench } from "@/components/contract-workbench";

export default function ActivityPage() {
  return <div className="page-wrap">
    <PageIntro eyebrow="TRANSACTION RECORD" title="Follow each signed action." intro="A submitted hash is not completion. Revigate separates provisional consensus, finalized execution, canonical readback, and external GEN delivery evidence." />
    <ContractUnavailable />
    <div className="lifecycle"><span>Wallet signed</span><i /><span>Submitted</span><i /><span>Finalized</span><i /><span>State verified</span><i /><span>Delivery evidence</span></div>
    <ContractWorkbench mode="participant" />
  </div>;
}
