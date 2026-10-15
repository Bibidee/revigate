import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: "Revigate — rules with a history",
  description: "Reviewed rulebooks and wallet acknowledgments without custody.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Shell>{children}</Shell></body></html>;
}
