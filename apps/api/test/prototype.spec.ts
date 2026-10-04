import { Test } from "@nestjs/testing";
import { PrototypeService } from "../src/prototype/prototype.service";
import { prototypeConfigSchema } from "@umkm/planner-engine";

describe("PrototypeService", () => {
  it("returns schema-valid sample config", async () => {
    const module = await Test.createTestingModule({ providers: [PrototypeService] }).compile();
    const config = module.get(PrototypeService).sample();
    expect(() => prototypeConfigSchema.parse(config)).not.toThrow();
    expect(config.businessName).toBe("Kedai Rasa Pagi");
    expect(config.sections.some((section) => section.enabled)).toBe(true);
    expect(config.products.length).toBeGreaterThan(0);
  });
});
