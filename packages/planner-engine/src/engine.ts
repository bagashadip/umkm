import { questionnaireSchema, type Questionnaire } from "./questionnaire.js";
import { type PrototypeConfig } from "./prototype.js";
import {
  FEATURES,
  INDEX,
  PLAN_BASE_PRICE,
  type Feature,
  type PlanId,
} from "./matrix.js";

export interface SelectedFeature {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface ExcludedFeature {
  id: string;
  name: string;
  reason: "not_requested" | "not_available_on_plan" | "over_plan_limit";
}

export interface BreakdownLine {
  id: string;
  label: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PlannerOutput {
  selectedFeatures: SelectedFeature[];
  excludedFeatures: ExcludedFeature[];
  totalPrice: number;
  breakdown: BreakdownLine[];
  prototypeConfig: PrototypeConfig;
}

export class PlannerInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlannerInputError";
  }
}

function addFeature(
  selected: SelectedFeature[],
  breakdown: BreakdownLine[],
  feature: Feature,
  quantity: number,
): void {
  // unitPrice applies per unitSize units; price is the flat fee.
  const blocks = feature.unitSize ? Math.ceil(quantity / feature.unitSize) : 0;
  const total = feature.price + (feature.unitPrice ?? 0) * blocks;
  selected.push({ id: feature.id, name: feature.name, quantity, price: total });
  breakdown.push({
    id: feature.id,
    label: feature.name,
    quantity,
    unitPrice: feature.unitPrice ?? feature.price,
    total,
  });
}

export interface WebsitePriceInput {
  plan: PlanId;
  productCount: number;
  needsOwnDomain: boolean;
}

export interface WebsitePriceOutput {
  totalPrice: number;
  breakdown: BreakdownLine[];
  pricingVersion: number;
}

/** Deterministic price calculation for the new template-led website flow. */
export function calculateWebsitePrice(input: WebsitePriceInput): WebsitePriceOutput {
  if (!Number.isInteger(input.productCount) || input.productCount < 0 || input.productCount > 10_000) {
    throw new PlannerInputError("productCount must be an integer between 0 and 10000");
  }
  const planBase = PLAN_BASE_PRICE[input.plan];
  const productFeature = FEATURES.find((feature) => feature.id === "product_list")!;
  const domainFeature = FEATURES.find((feature) => feature.id === "custom_domain")!;
  const breakdown: BreakdownLine[] = [{
    id: `plan_${input.plan}`, label: `Paket ${input.plan}`, quantity: 1, unitPrice: planBase, total: planBase,
  }];
  if (input.productCount > 0) {
    const blocks = productFeature.unitSize ? Math.ceil(input.productCount / productFeature.unitSize) : 0;
    const total = productFeature.price + (productFeature.unitPrice ?? 0) * blocks;
    breakdown.push({ id: productFeature.id, label: productFeature.name, quantity: input.productCount, unitPrice: productFeature.unitPrice ?? productFeature.price, total });
  }
  if (input.needsOwnDomain) {
    if (domainFeature.limits[input.plan] === null) throw new PlannerInputError(`Paket ${input.plan} tidak mendukung domain sendiri`);
    breakdown.push({ id: domainFeature.id, label: domainFeature.name, quantity: 1, unitPrice: domainFeature.price, total: domainFeature.price });
  }
  return { totalPrice: breakdown.reduce((sum, line) => sum + line.total, 0), breakdown, pricingVersion: 1 };
}

/** Pure deterministic mapping from validated answers to allowed features and price. */
export function plan(input: unknown): PlannerOutput {
  const parsed = questionnaireSchema.safeParse(input);
  if (!parsed.success) {
    throw new PlannerInputError(parsed.error.message);
  }

  const answers = parsed.data;
  const selected: SelectedFeature[] = [];
  const excluded: ExcludedFeature[] = [];
  const breakdown: BreakdownLine[] = [
    {
      id: `plan_${answers.plan}`,
      label: `Paket ${answers.plan}`,
      quantity: 1,
      unitPrice: PLAN_BASE_PRICE[answers.plan],
      total: PLAN_BASE_PRICE[answers.plan],
    },
  ];

  const requested: Record<string, number> = {
    landing_page: 1,
    product_list: answers.productCount,
    manual_payment: answers.transactionMethod === "manual_payment" || answers.transactionMethod === "mixed" ? 1 : 0,
    seo: answers.needsSeo ? 1 : 0,
    whatsapp_chat: answers.needsWhatsapp || answers.transactionMethod === "whatsapp" ? 1 : 0,
    custom_domain: answers.needsOwnDomain ? 1 : 0,
    product_variants: answers.needsProductVariants ? 1 : 0,
    order_tracking: answers.needsOrderTracking ? 1 : 0,
  };

  for (const feature of FEATURES) {
    const quantity = requested[feature.id] ?? 0;
    const limit = feature.limits[answers.plan];

    if (quantity === 0) {
      excluded.push({ id: feature.id, name: feature.name, reason: "not_requested" });
    } else if (limit === null) {
      excluded.push({ id: feature.id, name: feature.name, reason: "not_available_on_plan" });
    } else if (quantity > limit) {
      excluded.push({ id: feature.id, name: feature.name, reason: "over_plan_limit" });
    } else {
      addFeature(selected, breakdown, feature, quantity);
    }
  }

  const totalPrice = breakdown.reduce((sum, line) => sum + line.total, 0);
  const productLimit = FEATURES.find((feature) => feature.id === "product_list")!.limits[answers.plan]!;

  return {
    selectedFeatures: selected,
    excludedFeatures: excluded,
    totalPrice,
    breakdown,
    prototypeConfig: {
      businessName: "Usaha kamu",
      businessType: answers.businessType,
      theme: { primary: "#b12a20", font: "DM Sans, sans-serif", radius: "0.25rem" },
      sections: [
        { type: "hero", enabled: true, title: "Selamat datang di usaha kami", subtitle: "Produk pilihan untuk kebutuhanmu." },
        { type: "about", enabled: true, title: "Tentang usaha kami", body: "Cerita usaha dan layanan untuk pelanggan." },
        { type: "productList", enabled: selected.some((feature) => feature.id === "product_list"), title: "Produk kami" },
        { type: "paymentInstruction", enabled: selected.some((feature) => feature.id === "manual_payment"), title: "Cara pembayaran", body: "Hubungi kami untuk instruksi pembayaran." },
        { type: "whatsappCta", enabled: selected.some((feature) => feature.id === "whatsapp_chat"), title: "Pesan lewat WhatsApp", body: "Tanyakan produk dan ketersediaan." },
        { type: "footer", enabled: true, text: "Usaha kamu" },
      ],
      features: selected.map((feature) => feature.id),
      products: Array.from({ length: Math.min(answers.productCount, productLimit, 3) }, (_, index) => ({ id: `product-${index + 1}`, name: `Produk ${index + 1}`, description: "Produk pilihan usaha.", priceLabel: "Hubungi kami" })),
      paymentInstruction: "Hubungi usaha untuk instruksi pembayaran.",
      whatsappNumber: "628000000000",
      seo: { title: "Usaha kamu", description: "Temukan produk pilihan dari usaha kami." },
    },
  };
}

/** Strict boundary for integrations that supply feature IDs directly. */
export function assertKnownFeatures(featureIds: readonly string[]): void {
  const unknown = featureIds.filter((id) => !INDEX.has(id));
  if (unknown.length > 0) {
    throw new PlannerInputError(`Unknown feature(s): ${unknown.join(", ")}`);
  }
}
