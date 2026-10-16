import Link from "next/link";
import type { ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) { return <div className="eyebrow">{children}</div>; }
export function EmptyState({ title, body }: { title: string; body: string }) { return <section className="empty-state"><div className="empty-symbol">—</div><h3>{title}</h3><p>{body}</p></section>; }
export function PageIntro({ eyebrow, title, intro, action }: { eyebrow: string; title: string; intro: string; action?: { label: string; href: string } }) {
  return <div className="page-intro"><div><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1><p>{intro}</p></div>{action && <Link className="button-primary" href={action.href}>{action.label}<span aria-hidden="true"> ↗</span></Link>}</div>;
}
export function Notice({ children }: { children: ReactNode }) { return <div className="notice"><span className="notice-dot" />{children}</div>; }
export function ContractUnavailable() { return (process.env.NEXT_PUBLIC_REVIGATE_CONTRACT || process.env.NEXT_PUBLIC_REVIGATE_REGISTRY) ? null : <div className="notice notice-amber"><span className="notice-dot" />Registry reads and actions are unavailable until a verified Studionet single-contract address is configured.</div>; }
