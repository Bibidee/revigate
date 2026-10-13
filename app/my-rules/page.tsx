import { ContractUnavailable, PageIntro } from "@/components/content";
import { ContractWorkbench } from "@/components/contract-workbench";

export default function MyRulesPage() {
  return <div className="page-wrap">
    <PageIntro eyebrow="ACKNOWLEDGMENTS" title="The versions you accepted." intro="A wallet acknowledgment applies to a specific reviewed epoch. Earlier records remain visible when a later material change makes them stale for new participation." />
    <ContractUnavailable />
    <ContractWorkbench mode="participant" />
  </div>;
}
