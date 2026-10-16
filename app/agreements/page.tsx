import { PageIntro } from "@/components/content";
import { AgreementWorkspace } from "@/components/agreement-workspace";

export default function AgreementsPage() {
  return <div className="page-wrap">
    <PageIntro eyebrow="AGREEMENTS" title="A clearer way to manage commitments." intro="Browse canonical agreement records, review the terms that are frozen on-chain, and take the next valid action from one focused workspace." />
    <AgreementWorkspace />
  </div>;
}
