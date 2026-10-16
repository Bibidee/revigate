"use client";

import { usePathname } from "next/navigation";
import { ContractUnavailable, PageIntro } from "@/components/content";

export default function AgreementPage() {
  const parts = usePathname().split("/").filter(Boolean);
  const legacyId = parts[1] ?? "";
  return <div className="page-wrap">
    <PageIntro eyebrow={`LEGACY AGREEMENT · ${legacyId || "UNSPECIFIED"}`} title="Financial agreements removed." intro="This route is retained only so old links fail safely. Revigate no longer accepts or holds native GEN." />
    <ContractUnavailable />
    <p className="safety-copy">Do not send funds to the Registry address. Open <a href="/my-rules">My rules</a> to view and acknowledge authenticated rulebooks.</p>
  </div>;
}
