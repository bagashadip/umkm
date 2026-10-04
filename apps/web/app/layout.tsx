import type { Metadata } from "next";
import { Archivo, Manrope } from "next/font/google";
import "./globals.css";

const display = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: "700",
});
const body = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

const siteUrl = "https://rakitweb.id";
const siteTitle = "Rakitweb — Website untuk Bisnis Kecil";
const siteDescription =
  "Rakitweb membantu bisnis kecil punya website sendiri: pilih kategori, isi cerita usahamu, lihat preview, dan mulai dengan langkah yang jelas.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | Rakitweb",
  },
  description: siteDescription,
  keywords: [
    "jasa website UMKM",
    "pembuatan website bisnis kecil",
    "website UMKM",
    "website usaha",
    "Rakitweb",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: "website",
    locale: "id_ID",
    siteName: "Rakitweb",
    url: siteUrl,
    images: [
      {
        url: "/og-placeholder.png",
        width: 1200,
        height: 630,
        alt: "Rakitweb — website untuk bisnis kecil",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-placeholder.png"],
  },
  robots: { index: true, follow: true },
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": `${siteUrl}/#business`,
      name: "Rakitweb",
      description: siteDescription,
      url: siteUrl,
      areaServed: { "@type": "Country", name: "Indonesia" },
      address: {
        "@type": "PostalAddress",
        addressCountry: "ID",
      },
    },
    {
      "@type": "Service",
      "@id": `${siteUrl}/#website-service`,
      name: "Jasa Website Bisnis Kecil",
      serviceType: "Pembuatan website bisnis kecil",
      description:
        "Perencanaan dan pembuatan website bisnis kecil dengan katalog produk, pembayaran manual, SEO, dan chat WhatsApp.",
      provider: { "@id": `${siteUrl}/#business` },
      areaServed: { "@type": "Country", name: "Indonesia" },
      audience: { "@type": "Audience", audienceType: "Pemilik bisnis kecil" },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable}`}>
      <body suppressHydrationWarning>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      </body>
    </html>
  );
}
