export type PlanId = "trial" | "business" | "growth";
export type FeatureCategory = "included" | "configurable" | "custom";

export interface Feature {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  /** Hard cap per plan; null means the plan does not allow this feature. */
  limits: Record<PlanId, number | null>;
  /** Flat monthly price in IDR. */
  price: number;
  /** Price per unit above 0 for configurable features. */
  unitPrice?: number;
  /** Unit size that one unitPrice covers. */
  unitSize?: number;
}

export const PLANS: readonly PlanId[] = ["trial", "business", "growth"];

/** Bump when pricing rules change. Reports record the version they were priced with. */
export const PRICING_VERSION = 1;

/**
 * Feature matrix. Nothing outside this list may be selected;
 * `limits[id] = null` marks a plan that does not offer the feature at all.
 */
export const FEATURES: readonly Feature[] = [
  {
    id: "landing_page",
    name: "Landing page",
    description: "Halaman resmi untuk memperkenalkan usaha dan mengarahkan pelanggan membeli.",
    category: "included",
    limits: { trial: 1, business: 1, growth: 1 },
    price: 0,
  },
  {
    id: "product_list",
    name: "Product list",
    description: "Daftar produk rapi dengan nama, harga, dan informasi yang mudah dibagikan.",
    category: "configurable",
    limits: { trial: 20, business: 200, growth: 1000 },
    price: 0,
    unitPrice: 10_000,
    unitSize: 100,
  },
  {
    id: "manual_payment",
    name: "Pembayaran manual",
    description: "Instruksi pembayaran manual agar pesanan dan transfer lebih mudah dicek.",
    category: "configurable",
    limits: { trial: 1, business: 1, growth: 1 },
    price: 25_000,
  },
  {
    id: "seo",
    name: "SEO",
    description: "Struktur halaman yang membantu usaha lebih mudah ditemukan di Google.",
    category: "included",
    limits: { trial: 1, business: 1, growth: 1 },
    price: 0,
  },
  {
    id: "whatsapp_chat",
    name: "Chat WhatsApp",
    description: "Tombol chat langsung ke WhatsApp usaha agar calon pembeli mudah menghubungi.",
    category: "included",
    limits: { trial: 1, business: 1, growth: 1 },
    price: 0,
  },
  {
    id: "custom_domain",
    name: "Domain sendiri",
    description: "Alamat web sendiri agar usaha terlihat lebih profesional dan mudah diingat.",
    category: "custom",
    limits: { trial: null, business: 1, growth: 1 },
    price: 150_000,
  },
  {
    id: "product_variants",
    name: "Varian produk",
    description: "Dukungan varian seperti ukuran, warna, atau pilihan produk.",
    category: "custom",
    limits: { trial: null, business: 1, growth: 1 },
    price: 75_000,
  },
  {
    id: "order_tracking",
    name: "Lacak pesanan",
    description: "Pelacakan pesanan agar status pesanan lebih mudah dipantau.",
    category: "custom",
    limits: { trial: null, business: null, growth: 1 },
    price: 250_000,
  },
];

export const INDEX: Map<string, Feature> = new Map(FEATURES.map((f) => [f.id, f]));

export const PLAN_BASE_PRICE: Record<PlanId, number> = {
  trial: 0,
  business: 150_000,
  growth: 350_000,
};

export function getFeature(id: string): Feature | undefined {
  return INDEX.get(id);
}

export function isKnownFeature(id: string): boolean {
  return INDEX.has(id);
}

export function isPlanAllowed(feature: Feature, plan: PlanId): boolean {
  return feature.limits[plan] !== null;
}
