"use client";

import { usePathname } from "next/navigation";
import { ContractUnavailable, PageIntro } from "@/components/content";
import { ContractWorkbench } from "@/components/contract-workbench";

export default function AgreementPage() {
  const offerId = usePathname().split("/").filter(Boolean)[1] ?? "";
  return <div className="page-wrap">
    <PageIntro eyebrow={`AGREEMENT · ${offerId || "UNSPECIFIED"}`} title="A protected agreement." intro="The page loads exact terms from the configured Studionet contract. It will not display sample offers as canonical state." />
    <ContractUnavailable />
    <ContractWorkbench key={offerId} mode="participant" initialOfferId={offerId} />
  </div>;
}
