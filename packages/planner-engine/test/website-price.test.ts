import { describe, expect, it } from "vitest";
import { calculateWebsitePrice, PlannerInputError } from "../src/index.js";

describe("calculateWebsitePrice", () => {
  it("charges the plan base price only when there are no products or domain", () => {
    const out = calculateWebsitePrice({ plan: "business", productCount: 0, needsOwnDomain: false });
    expect(out.totalPrice).toBe(150_000);
    expect(out.breakdown).toHaveLength(1);
    expect(out.pricingVersion).toBe(1);
  });

  it("charges product blocks in units of 100 above the flat fee", () => {
    // 10 products: one block of 100, plan business base 150_000 + 10_000.
    const ten = calculateWebsitePrice({ plan: "business", productCount: 10, needsOwnDomain: false });
    expect(ten.totalPrice).toBe(160_000);

    // 101 products: two blocks (100 + 1).
    const hundredAndOne = calculateWebsitePrice({ plan: "business", productCount: 101, needsOwnDomain: false });
    expect(hundredAndOne.totalPrice).toBe(170_000);

    // Exactly 100 products: still one block.
    const hundred = calculateWebsitePrice({ plan: "business", productCount: 100, needsOwnDomain: false });
    expect(hundred.totalPrice).toBe(160_000);
  });

  it("keeps the trial plan free but still bills per product block", () => {
    const out = calculateWebsitePrice({ plan: "trial", productCount: 10, needsOwnDomain: false });
    expect(out.totalPrice).toBe(10_000);
    expect(out.breakdown[0].total).toBe(0);
  });

  it("adds the custom domain fee on plans that allow it", () => {
    const out = calculateWebsitePrice({ plan: "growth", productCount: 0, needsOwnDomain: true });
    expect(out.totalPrice).toBe(350_000 + 150_000);
    expect(out.breakdown.find((line) => line.id === "custom_domain")?.total).toBe(150_000);
  });

  it("rejects a custom domain on a plan that does not offer it", () => {
    expect(() => calculateWebsitePrice({ plan: "trial", productCount: 0, needsOwnDomain: true })).toThrow(
      PlannerInputError,
    );
  });

  it("rejects product counts outside the supported range", () => {
    expect(() => calculateWebsitePrice({ plan: "trial", productCount: -1, needsOwnDomain: false })).toThrow(
      PlannerInputError,
    );
    expect(() => calculateWebsitePrice({ plan: "trial", productCount: 10_001, needsOwnDomain: false })).toThrow(
      PlannerInputError,
    );
    expect(() =>
      calculateWebsitePrice({ plan: "trial", productCount: 1.5, needsOwnDomain: false }),
    ).toThrow(PlannerInputError);
  });

  it("total always equals the sum of its breakdown lines", () => {
    for (const plan of ["trial", "business", "growth"] as const) {
      for (const productCount of [0, 1, 99, 100, 101, 1000]) {
        for (const needsOwnDomain of [false, true]) {
          if (plan === "trial" && needsOwnDomain) continue;
          const out = calculateWebsitePrice({ plan, productCount, needsOwnDomain });
          expect(out.totalPrice).toBe(out.breakdown.reduce((sum, line) => sum + line.total, 0));
          expect(out.totalPrice).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});
