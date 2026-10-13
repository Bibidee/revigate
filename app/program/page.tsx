"use client";

import { usePathname } from "next/navigation";
import { ContractUnavailable, PageIntro } from "@/components/content";
import { ContractWorkbench } from "@/components/contract-workbench";

export default function ProgramPage() {
  const parts = usePathname().split("/").filter(Boolean);
  const programId = parts[1] ?? "";
  return <div className="page-wrap">
    <PageIntro eyebrow={`PROGRAM · ${programId || "UNSPECIFIED"}`} title="Reviewed publication" intro="The canonical program record contains the latest successfully reviewed commit and epoch. It does not claim to match the mutable GitHub branch head." />
    <ContractUnavailable />
    <ContractWorkbench key={programId} mode="publisher" initialProgramId={programId} />
  </div>;
}
