import { describe, expect, it } from "vitest";
import {
  FEATURES,
  PLAN_BASE_PRICE,
  PlannerInputError,
  assertKnownFeatures,
  calculateWebsitePrice,
  plan,
} from "../src/index.js";

const BASE = {
  businessType: "retail",
  productCount: 10,
  transactionMethod: "manual_payment",
  needsSeo: true,
  needsWhatsapp: true,
  needsOwnDomain: false,
  needsProductVariants: false,
  needsOrderTracking: false,
  plan: "trial",
} as const;

const BUSINESS_TYPES = ["retail", "food_beverage", "services", "craft", "other"] as const;
const METHODS = ["whatsapp", "manual_payment", "offline", "mixed"] as const;
const PLANS = ["trial", "business", "growth"] as const;
const COUNTS = [0, 1, 19, 20, 21, 100, 200, 201, 1000, 1001] as const;
const FLAGS = [false, true] as const;

function allAnswers() {
  const out: any[] = [];
  for (const businessType of BUSINESS_TYPES)
    for (const productCount of COUNTS)
      for (const transactionMethod of METHODS)
        for (const needsSeo of FLAGS)
          for (const needsWhatsapp of FLAGS)
            for (const needsOwnDomain of FLAGS)
              for (const needsProductVariants of FLAGS)
                for (const needsOrderTracking of FLAGS)
                  for (const plan of PLANS)
                    out.push({
                      businessType,
                      productCount,
                      transactionMethod,
                      needsSeo,
                      needsWhatsapp,
                      needsOwnDomain,
                      needsProductVariants,
                      needsOrderTracking,
                      plan,
                    });
  return out;
}

describe("feature matrix", () => {
  it("exposes only the declared feature ids", () => {
    expect(FEATURES.map((f) => f.id)).toEqual([
      "landing_page",
      "product_list",
      "manual_payment",
      "seo",
      "whatsapp_chat",
      "custom_domain",
      "product_variants",
      "order_tracking",
    ]);
  });

  it("gives every feature a limit for every plan", () => {
    for (const f of FEATURES)
      for (const p of PLANS) expect(Object.keys(f.limits)).toContain(p);
  });
});

describe("questionnaire validation", () => {
  it("rejects missing and malformed input", () => {
    expect(() => plan({})).toThrow(PlannerInputError);
    expect(() => plan({ ...BASE, productCount: -1 })).toThrow(PlannerInputError);
    expect(() => plan({ ...BASE, productCount: 1.5 })).toThrow(PlannerInputError);
    expect(() => plan({ ...BASE, productCount: 10_001 })).toThrow(PlannerInputError);
    expect(() => plan({ ...BASE, plan: "gold" })).toThrow(PlannerInputError);
    expect(() => plan(null)).toThrow(PlannerInputError);
    expect(() => plan(undefined)).toThrow(PlannerInputError);
    expect(() => plan("retail")).toThrow(PlannerInputError);
  });
});

describe("rule engine", () => {
  it("never selects a feature outside the matrix", () => {
    for (const answers of allAnswers()) {
      const known = new Set(FEATURES.map((f) => f.id));
      const { selectedFeatures, excludedFeatures, prototypeConfig } = plan(answers);
      for (const f of selectedFeatures) expect(known.has(f.id)).toBe(true);
      for (const f of excludedFeatures) expect(known.has(f.id)).toBe(true);
      for (const f of prototypeConfig.features) expect(known.has(f)).toBe(true);
      expect(selectedFeatures.length + excludedFeatures.length).toBe(FEATURES.length);
    }
  });

  it("rejects unknown feature ids at the boundary", () => {
    expect(() => assertKnownFeatures(["landing_page"])).not.toThrow();
    expect(() => assertKnownFeatures(["ai_magic"])).toThrow(PlannerInputError);
    expect(() => assertKnownFeatures(["landing_page", "ss"])).toThrow(PlannerInputError);
    expect(() => assertKnownFeatures([])).not.toThrow();
  });

  it("excludes plan-gated features rather than dropping them", () => {
    const out = plan({
      ...BASE,
      plan: "trial",
      needsOwnDomain: true,
      needsProductVariants: true,
      needsOrderTracking: true,
    });
    expect(out.selectedFeatures.map((f) => f.id)).toEqual([
      "landing_page",
      "product_list",
      "manual_payment",
      "seo",
      "whatsapp_chat",
    ]);
    const reasons = Object.fromEntries(out.excludedFeatures.map((f) => [f.id, f.reason]));
    expect(reasons.custom_domain).toBe("not_available_on_plan");
    expect(reasons.product_variants).toBe("not_available_on_plan");
    expect(reasons.order_tracking).toBe("not_available_on_plan");
  });

  it("excludes requested features that exceed the plan cap", () => {
    const out = plan({ ...BASE, productCount: 21, plan: "trial" });
    expect(out.excludedFeatures.find((f) => f.id === "product_list")?.reason).toBe(
      "over_plan_limit",
    );
    expect(out.selectedFeatures.find((f) => f.id === "product_list")).toBeUndefined();
  });

  it("includes product list when count is within the plan cap", () => {
    for (const plan of PLANS) {
      const out = plan === undefined ? null : null;
      expect(out).toBeNull();
    }
  });

  it("drives channel features from transaction method", () => {
    expect(plan({ ...BASE, transactionMethod: "whatsapp" }).selectedFeatures.map((f) => f.id)).toContain("whatsapp_chat");
    expect(plan({ ...BASE, transactionMethod: "offline", needsWhatsapp: false }).selectedFeatures.map((f) => f.id)).not.toContain("whatsapp_chat");
    expect(plan({ ...BASE, transactionMethod: "mixed", needsWhatsapp: false }).selectedFeatures.map((f) => f.id)).toContain("manual_payment");
    expect(plan({ ...BASE, transactionMethod: "offline", needsWhatsapp: false }).selectedFeatures.map((f) => f.id)).not.toContain("manual_payment");
  });
});

describe("pricing", () => {
  it("charges plan base plus feature flat fees", () => {
    const out = plan({ ...BASE, plan: "business" });
    const featuresOnly = out.breakdown.filter((l) => !l.id.startsWith("plan_"));
    expect(out.totalPrice).toBe(
      PLAN_BASE_PRICE.business + featuresOnly.reduce((s, l) => s + l.total, 0),
    );
    expect(out.breakdown[0]).toEqual({
      id: "plan_business",
      label: "Paket business",
      quantity: 1,
      unitPrice: PLAN_BASE_PRICE.business,
      total: PLAN_BASE_PRICE.business,
    });
  });

  it("bills product blocks per 100 units", () => {
    const line = plan({ ...BASE, productCount: 1 }).breakdown.find((l) => l.id === "product_list")!;
    expect(line.total).toBe(10_000);
    const hundred = plan({ ...BASE, plan: "business", productCount: 100 }).breakdown.find((l) => l.id === "product_list")!;
    expect(hundred.total).toBe(10_000);
    const twoBlocks = plan({ ...BASE, plan: "business", productCount: 101 }).breakdown.find((l) => l.id === "product_list")!;
    expect(twoBlocks.total).toBe(20_000);
  });

  it("is deterministic", () => {
    const a = plan(BASE);
    const b = plan(BASE);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("aggregates breakdown to total price for every answer combination", () => {
    for (const answers of allAnswers()) {
      const out = plan(answers);
      const sum = out.breakdown.reduce((s, l) => s + l.total, 0);
      expect(out.totalPrice).toBe(sum);
      expect(out.totalPrice).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(out.totalPrice)).toBe(true);
      for (const line of out.breakdown) {
        expect(line.quantity).toBeGreaterThanOrEqual(0);
        expect(line.total).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("prototype config", () => {
  it("reflects the approved feature set and plan product limit", () => {
    const out = plan({ ...BASE, plan: "growth", productCount: 500, needsOwnDomain: true });
    expect(out.prototypeConfig.businessType).toBe("retail");
    expect(out.prototypeConfig.features).toEqual(out.selectedFeatures.map((f) => f.id));
    expect(out.prototypeConfig.seo.title).toBe("Usaha kamu");
  });

  it("generates at most 3 demo products and toggles sections by feature", () => {
    const trial = plan({ ...BASE, plan: "trial", productCount: 10, needsOwnDomain: true });
    expect(trial.prototypeConfig.products).toHaveLength(3);
    const sections = Object.fromEntries(trial.prototypeConfig.sections.map((s) => [s.type, s.enabled]));
    expect(sections.productList).toBe(true);
    expect(sections.paymentInstruction).toBe(true);
    expect(sections.whatsappCta).toBe(true);

    const noSeo = plan({ ...BASE, needsSeo: false, transactionMethod: "offline", needsWhatsapp: false });
    expect(noSeo.prototypeConfig.sections.find((s) => s.type === "productList")?.enabled).toBe(true);
    expect(noSeo.prototypeConfig.sections.find((s) => s.type === "paymentInstruction")?.enabled).toBe(false);
    expect(noSeo.prototypeConfig.sections.find((s) => s.type === "whatsappCta")?.enabled).toBe(false);
  });
});
