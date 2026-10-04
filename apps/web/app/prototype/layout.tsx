import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contoh Website",
  description: "Contoh website bisnis yang dirender dari konfigurasi Rakitweb.",
  robots: { index: false, follow: false },
};

export default function PrototypeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
