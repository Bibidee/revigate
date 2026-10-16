"use client";

import { usePathname } from "next/navigation";
import { ContractUnavailable, PageIntro } from "@/components/content";

export default function AgreementPage() {
  const parts = usePathname().split("/").filter(Boolean);
  const legacyId = parts[1] ?? "";
  return <div className="page-wrap">
    <PageIntro eyebrow={`LEGACY AGREEMENT · ${legacyId || "UNSPECIFIED"}`} title="Agreement route locked." intro="This route is retained for old links. The current agreement controls are available only from a verified custody-enabled deployment." />
    <ContractUnavailable />
    <p className="safety-copy">Do not send funds to the Registry address. Use <a href="/agreements">Agreements</a> for the current gated controls or <a href="/my-rules">My rules</a> for authenticated rulebooks.</p>
  </div>;
}
