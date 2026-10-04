import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buat Website Bisnismu",
  description:
    "Pilih kategori dan template, isi cerita usahamu, lalu lihat preview website dengan Rakitweb.",
  alternates: { canonical: "/planner" },
  robots: { index: false, follow: true },
};

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
