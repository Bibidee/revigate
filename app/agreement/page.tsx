"use client";

import { usePathname } from "next/navigation";
import { ContractUnavailable, PageIntro } from "@/components/content";
import { ContractWorkbench } from "@/components/contract-workbench";

export default function AgreementPage() {
  const parts = usePathname().split("/").filter(Boolean);
  const offerId = parts[1] ?? "";
  return <div className="page-wrap">
    <PageIntro eyebrow={`AGREEMENT · ${offerId || "UNSPECIFIED"}`} title="Frozen offer terms." intro="Read the canonical offer before signing. Funding, acceptance, allocation and delivery are distinct states." />
    <ContractUnavailable />
    <ContractWorkbench key={offerId} mode="participant" initialOfferId={offerId} />
  </div>;
}
