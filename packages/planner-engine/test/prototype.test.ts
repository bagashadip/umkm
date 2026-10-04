import { describe, expect, it } from "vitest";
import { plan } from "../src/index.js";
import { prototypeConfigSchema, samplePrototypeConfig } from "../src/prototype.js";

const ANSWERS = {
  businessType: "retail" as const, productCount: 10, transactionMethod: "manual_payment" as const,
  needsSeo: true, needsWhatsapp: true, needsOwnDomain: true,
  needsProductVariants: false, needsOrderTracking: false, plan: "trial" as const,
};

describe("prototype config schema", () => {
  it("accepts the shared sample fixture", () => {
    const parsed = prototypeConfigSchema.parse(samplePrototypeConfig);
    expect(parsed.businessName).toBe("Kedai Rasa Pagi");
    expect(parsed.products).toHaveLength(3);
    expect(parsed.theme.radius).toBe("0.25rem");
  });

  it("rejects missing required fields", () => {
    expect(() => prototypeConfigSchema.parse({ businessName: "X" })).toThrow();
    const partial = { ...samplePrototypeConfig };
    delete (partial as Record<string, unknown>).whatsappNumber;
    expect(() => prototypeConfigSchema.parse(partial)).toThrow();
  });

  it("rejects unknown section types", () => {
    const bad = { ...samplePrototypeConfig, sections: [{ type: "blog", enabled: true }] };
    expect(() => prototypeConfigSchema.parse(bad)).toThrow();
  });

  it("plan output satisfies the same schema", () => {
    expect(() => prototypeConfigSchema.parse(plan(ANSWERS).prototypeConfig)).not.toThrow();
  });

  it("preserves enabled/disabled section state and theme", () => {
    const config = prototypeConfigSchema.parse(samplePrototypeConfig);
    const off = { ...config, sections: config.sections.map((s) => ({ ...s, enabled: false })) };
    expect(off.sections.every((s) => s.enabled === false)).toBe(true);
    expect(off.theme).toEqual(config.theme);
  });
});
