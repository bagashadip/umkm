import { describe, expect, it } from "vitest";
import {
  TemplateValidationError,
  aiSlotFields,
  buildAiDraftSchema,
  buildContentSchema,
  commerceEditorialTemplate,
  missingRequiredFields,
  normalizeContent,
  resolveTemplatePreview,
  templateDefinitionSchema,
  validateTemplate,
} from "../src/index.js";
import type { TemplateDefinition } from "../src/index.js";

const data = commerceEditorialTemplate.previewData;

describe("template definition schema", () => {
  it("accepts the sample template", () => {
    const { template } = validateTemplate(commerceEditorialTemplate);
    expect(template.id).toBe("commerce-editorial-v1");
    expect(template.presentation.sections.map((s) => s.type)).toEqual([
      "hero", "about", "productList", "feature", "whatsappCta", "footer",
    ]);
    expect(template.generator.modules).toContain("catalog");
  });

  it("rejects an id that is not kebab-case", () => {
    expect(() => templateDefinitionSchema.parse({ ...commerceEditorialTemplate, id: "Not Kebab" })).toThrow();
  });

  it("rejects duplicate section keys", () => {
    const sections = commerceEditorialTemplate.presentation.sections;
    expect(() => validateTemplate({
      ...commerceEditorialTemplate,
      presentation: { ...commerceEditorialTemplate.presentation, sections: [...sections, sections[0]] },
    })).toThrow(TemplateValidationError);
  });

  it("rejects a section pointing at an unknown content field", () => {
    const invalid = {
      ...commerceEditorialTemplate,
      presentation: {
        ...commerceEditorialTemplate.presentation,
        sections: commerceEditorialTemplate.presentation.sections.map((section, index) =>
          index === 0 ? { ...section, content: { ...section.content, title: { field: "nope" } } } : section,
        ),
      },
    };
    expect(() => validateTemplate(invalid)).toThrow(TemplateValidationError);
    try { validateTemplate(invalid); } catch (error) {
      expect((error as TemplateValidationError).issues.join(" ")).toMatch(/field tak dikenal: nope/);
    }
  });

  it("rejects a template without businessName bound", () => {
    const invalid = {
      ...commerceEditorialTemplate,
      contentSchema: {
        ...commerceEditorialTemplate.contentSchema,
        fields: commerceEditorialTemplate.contentSchema.fields.map((field) =>
          field.bind === "businessName" ? { ...field, bind: undefined } : field,
        ),
      },
    };
    expect(() => validateTemplate(invalid)).toThrow(TemplateValidationError);
    expect(() => validateTemplate(invalid)).toThrow(/tidak valid/);
  });

  it("rejects a generator module that is not declared as a feature", () => {
    const invalid = { ...commerceEditorialTemplate, generator: { ...commerceEditorialTemplate.generator, modules: ["catalog", "booking"] } };
    expect(() => validateTemplate(invalid)).toThrow(TemplateValidationError);
    try { validateTemplate(invalid); } catch (error) {
      expect((error as TemplateValidationError).issues.join(" ")).toMatch(/booking/);
    }
  });
});

describe("resolveTemplatePreview", () => {
  const preview = resolveTemplatePreview({
    template: commerceEditorialTemplate as TemplateDefinition,
    category: { id: "kuliner", name: "Kuliner" },
    data,
  });

  it("is deterministic", () => {
    const again = resolveTemplatePreview({ template: commerceEditorialTemplate as TemplateDefinition, category: { id: "kuliner", name: "Kuliner" }, data });
    expect(JSON.stringify(again)).toBe(JSON.stringify(preview));
  });

  it("pulls client content into every section", () => {
    expect(preview.businessName).toBe("Kedai Rasa Pagi");
    expect(preview.businessType).toBe("Kuliner");
    const hero = preview.sections.find((s) => s.type === "hero");
    expect(hero && "title" in hero && hero.title).toBe(data.tagline);
    expect(hero && "eyebrow" in hero && hero.eyebrow).toBe("Kuliner");
    const about = preview.sections.find((s) => s.type === "about");
    expect(about && "body" in about && about.body).toBe(data.description);
    expect(about && "facts" in about && about.facts).toHaveLength(3);
  });

  it("records which template produced the config", () => {
    expect(preview.template).toEqual({ id: "commerce-editorial-v1", version: 1, name: "Commerce Editorial" });
  });

  it("applies the template theme", () => {
    expect(preview.theme.primary).toBe("#264653");
    expect(preview.theme.accent).toBe("#E76F51");
    expect(preview.theme.buttonStyle).toBe("soft");
  });

  it("turns catalog entries into renderable products", () => {
    expect(preview.products).toHaveLength(3);
    expect(preview.products[0].priceLabel).toBe("Rp 18.000");
    expect(preview.products[0].badge).toBe("Favorit");
    expect(preview.features).toContain("product_list");
  });

  it("builds a real WhatsApp link when a number is present", () => {
    expect(preview.whatsappNumber).toBe("628123456789");
    const hero = preview.sections.find((s) => s.type === "hero");
    expect(hero && "ctaHref" in hero && hero.ctaHref).toContain("wa.me/628123456789");
  });

  it("renders an empty site gracefully when the client has only named the business", () => {
    const sparse = resolveTemplatePreview({ template: commerceEditorialTemplate as TemplateDefinition, category: { id: "kuliner", name: "Kuliner" }, data: { businessName: "Warung Sore" } });
    expect(sparse.businessName).toBe("Warung Sore");
    expect(sparse.products).toHaveLength(0);
    const hero = sparse.sections.find((s) => s.type === "hero");
    expect(hero && "title" in hero && hero.title).toBe("Warung Sore");
    expect(hero && "ctaHref" in hero).toBe(false);
    expect(sparse.sections.every((section) => section.enabled)).toBe(true);
  });
});

describe("content schema validation", () => {
  const contentSchema = commerceEditorialTemplate.contentSchema;

  it("accepts a full payload", () => expect(buildContentSchema(contentSchema).safeParse(data).success).toBe(true));
  it("rejects an overlong name", () => expect(buildContentSchema(contentSchema).safeParse({ ...data, businessName: "x".repeat(121) }).success).toBe(false));

  it("fills defaults for lists and clears unknown keys", () => {
    const values = normalizeContent(contentSchema, { businessName: "Toko Uji", unrelated: "drop" });
    expect(values).not.toHaveProperty("unrelated");
    expect(values.products).toEqual([]);
    expect(values.facts).toEqual([]);
  });

  it("reports missing required fields in order", () => {
    const values = normalizeContent(contentSchema, {});
    expect(missingRequiredFields(contentSchema, values)).toEqual(["businessName"]);
    expect(missingRequiredFields(contentSchema, { ...values, businessName: "Toko Uji" })).toEqual([]);
  });

  it("drops untouched list rows before validation", () => {
    const submitted = {
      businessName: "Zayn Food", tagline: "Khusus makanan baby", description: "jadi ini ceritanya makanan buat baby aja",
      facts: [{ label: "Bubur lezat rasa ayam bawang", value: "enak" }], highlights: [{ label: "", value: "" }],
      whatsapp: "085945133344", address: "Jakarta", hours: "08.00 - 20.00",
      products: [{ name: "Bubur Baby", description: "Rasa ayam bawang", price: "15000" }],
    };
    const values = normalizeContent(contentSchema, submitted);
    expect(values.highlights).toEqual([]);
    expect(buildContentSchema(contentSchema).safeParse(values).success).toBe(true);
  });

  it("keeps a partially filled list row so validation can name it", () => {
    const bad = normalizeContent(contentSchema, { businessName: "Toko Uji", highlights: [{ title: "", body: "" }, { title: "Masak pagi", body: "Tidak disimpan semalaman." }] });
    expect(bad.highlights).toHaveLength(1);
    const parsed = buildContentSchema(contentSchema).safeParse({ ...bad, highlights: [{ title: "isi", body: "" }, { title: "", body: "isi" }] });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues[0]?.path[0]).toBe("highlights");
  });

  it("renders a featureList the shape the feature section expects", () => {
    const preview = resolveTemplatePreview({ template: commerceEditorialTemplate as TemplateDefinition, category: { id: "kuliner", name: "Kuliner" }, data: normalizeContent(contentSchema, { businessName: "Warung Bayi", highlights: [{ title: "Halal", body: "Semua bahan bersertifikat." }] }) });
    const feature = preview.sections.find((s) => s.type === "feature");
    expect(feature && "items" in feature && feature.items[0]).toEqual({ title: "Halal", body: "Semua bahan bersertifikat." });
  });
});

describe("AI draft slots", () => {
  const contentSchema = commerceEditorialTemplate.contentSchema;

  it("exposes only the slots the template declared", () => {
    expect(contentSchema.aiSlots).toEqual(["tagline", "description", "products"]);
    expect(aiSlotFields(contentSchema).map((field) => field.id)).toEqual(["tagline", "description", "products"]);
    expect(contentSchema.aiSlots).not.toContain("businessName");
    expect(contentSchema.aiSlots).not.toContain("whatsapp");
  });

  it("validates declared slots and ignores every other key", () => {
    const parsed = buildAiDraftSchema(contentSchema).safeParse({
      tagline: "Sarapan hangat setiap pagi", description: "Masakan rumah untuk keluarga.",
      products: [{ name: "Bubur Baby", description: "Rasa ayam bawang" }],
      businessName: "Kedai Lain", whatsapp: "08120000000", address: "Surabaya", hours: "24 jam",
      facts: [{ label: "Sejak", value: "2019" }], price: 9_999_999, plan: "growth",
      features: ["seo", "own_domain"], discount: "-50%", generator: { frontendPreset: "hacked-v1" },
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toEqual({
      tagline: "Sarapan hangat setiap pagi", description: "Masakan rumah untuk keluarga.",
      products: [{ name: "Bubur Baby", description: "Rasa ayam bawang", price: "", image: "", badge: "" }],
    });
  });

  it("enforces each slot's field rules while allowing omitted slots", () => {
    const schema = buildAiDraftSchema(contentSchema);
    expect(schema.safeParse({ products: [{ description: "tanpa nama" }] }).success).toBe(false);
    expect(schema.safeParse({ tagline: "x".repeat(141) }).success).toBe(false);
    expect(schema.safeParse({}).success).toBe(true);
  });

  it("ignores declared slot ids that no field implements", () => {
    const broken = { ...contentSchema, aiSlots: [...contentSchema.aiSlots, "ghostSlot"] };
    expect(aiSlotFields(broken).map((field) => field.id)).toEqual(["tagline", "description", "products"]);
    // A slot nobody implements is not a slot: it never becomes a draftable field.
    const parsed = buildAiDraftSchema(broken).safeParse({ ghostSlot: "x" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).not.toHaveProperty("ghostSlot");
  });
});
