"use client";

import { usePathname } from "next/navigation";
import { ContractUnavailable, PageIntro } from "@/components/content";
import { ContractWorkbench } from "@/components/contract-workbench";
import { RevisionRecord } from "@/components/registry-browser";

export default function RevisionPage() {
  const parts = usePathname().split("/").filter(Boolean);
  const programId = parts[1] ?? "";
  const reviewId = parts[3] ?? "";
  return <div className="page-wrap">
    <PageIntro eyebrow={`REVISION · ${programId || "UNSPECIFIED"} / ${reviewId || "UNSPECIFIED"}`} title="Compare the reviewed clauses." intro="A decision is shown only after a successful finalized assessment and canonical state readback. Protocol uncertainty remains a separate status." />
    <ContractUnavailable />
    {programId && reviewId && <RevisionRecord programId={programId} reviewId={reviewId} />}
    <ContractWorkbench key={`${programId}-${reviewId}`} mode="publisher" initialProgramId={programId} initialReviewId={reviewId} />
  </div>;
}
