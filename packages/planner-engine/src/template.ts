import { z } from "zod";
import {
  prototypeConfigSchema,
  prototypeSectionSchema,
  prototypeThemeSchema,
  type PrototypeConfig,
  type PrototypeSection,
  type PrototypeTheme,
} from "./prototype.js";

/* ── Content schema: what a template asks the client to fill ───── */

export const CONTENT_FIELD_TYPES = [
  "text",
  "textarea",
  "select",
  "phone",
  "address",
  "productList",
  "imageList",
  "collectionList",
  "factList",
  "featureList",
] as const;

/** Semantic slots the resolver can rely on. A field declares which slot it fills. */
export const CONTENT_BINDINGS = [
  "businessName",
  "tagline",
  "description",
  "whatsapp",
  "address",
  "hours",
  "location",
  "products",
  "gallery",
  "testimonials",
  "facts",
  "highlights",
  "priceNote",
] as const;

export const contentBindingSchema = z.enum(CONTENT_BINDINGS);
export type ContentBinding = z.infer<typeof contentBindingSchema>;

const LIST_FIELD_TYPES = new Set(["productList", "imageList", "collectionList", "factList", "featureList"]);

const productItemSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().default(""),
  price: z.string().max(80).optional().default(""),
  image: z.string().max(500).optional().default(""),
  badge: z.string().max(40).optional().default(""),
});

const galleryItemSchema = z.object({
  src: z.string().min(1).max(500),
  alt: z.string().min(1).max(140),
  caption: z.string().max(140).optional().default(""),
});

const testimonialItemSchema = z.object({
  quote: z.string().min(1).max(600),
  name: z.string().min(1).max(80),
  role: z.string().max(100).optional().default(""),
});

const factItemSchema = z.object({
  label: z.string().min(1).max(60),
  value: z.string().min(1).max(120),
});

export const contentFieldSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z][a-zA-Z0-9]*$/, "id harus camelCase dan diawali huruf"),
  label: z.string().min(1).max(80),
  type: z.enum(CONTENT_FIELD_TYPES),
  required: z.boolean().default(false),
  bind: contentBindingSchema.optional(),
  placeholder: z.string().max(140).optional(),
  help: z.string().max(240).optional(),
  maxLength: z.number().int().positive().max(4000).optional(),
  minLength: z.number().int().min(0).max(4000).optional(),
  maxItems: z.number().int().positive().max(60).optional(),
  options: z.array(z.object({ value: z.string().min(1).max(60), label: z.string().min(1).max(80) })).max(30).optional(),
  group: z.string().max(60).optional(),
  defaultValue: z.unknown().optional(),
});

export const contentSchemaSchema = z.object({
  fields: z.array(contentFieldSchema).min(1).max(60),
  /** Slots AI may draft copy into. Never prices, features, plans, or template rules. */
  aiSlots: z.array(z.string().min(1).max(60)).max(30).default([]),
});

export type ContentField = z.infer<typeof contentFieldSchema>;
export type TemplateContentSchema = z.infer<typeof contentSchemaSchema>;

/* ── Template definition ──────────────────────────────────────── */

const productFieldId = (fields: ContentField[]) =>
  fields.filter((field) => field.type === "productList").map((field) => field.id);

/** Values may be a literal or a reference to a content field. */
const contentValueSchema = z.union([
  z.string(),
  z.object({ field: z.string().min(1), fallback: z.union([z.string(), z.array(z.unknown())]).optional() }),
]);
export type ContentValue = z.infer<typeof contentValueSchema>;

export const templateSectionSchema = z.object({
  key: z.string().min(1).max(60),
  type: z.enum([
    "hero", "about", "productList", "gallery", "feature",
    "testimonial", "contact", "whatsappCta", "paymentInstruction", "footer",
  ]),
  variant: z.string().min(1).max(40).default("default"),
  enabled: z.boolean().default(true),
  /** Resolved against the client's content before rendering. */
  content: z.record(z.string().min(1).max(40), contentValueSchema).default({}),
  /** Marks a section as driven by a feature module rather than plain content. */
  module: z.string().max(40).optional(),
});

export type TemplateSection = z.infer<typeof templateSectionSchema>;

const generatorSchema = z.object({
  frontendPreset: z.string().min(1).max(60),
  backendPreset: z.string().min(1).max(60),
  modules: z.array(z.string().min(1).max(40)).max(20).default([]),
});

export const templateDefinitionSchema = z.object({
  id: z.string().min(1).max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "id harus kebab-case"),
  version: z.number().int().positive(),
  categoryId: z.string().min(1).max(60),
  /** Extra categories this template also appears under. */
  categories: z.array(z.string().min(1).max(60)).default([]),
  name: z.string().min(1).max(80),
  description: z.string().min(1).max(240),
  previewImage: z.string().max(500).nullable().default(null),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  pricePlan: z.enum(["trial", "business", "growth"]).default("business"),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
  presentation: z.object({
    theme: prototypeThemeSchema,
    sections: z.array(templateSectionSchema).min(1).max(30),
  }),
  contentSchema: contentSchemaSchema,
  features: z.array(z.string().min(1).max(60)).max(30).default([]),
  /** Sample content used for catalog thumbnails and live previews. */
  previewData: z.record(z.string(), z.unknown()).default({}),
  generator: generatorSchema,
});

export type TemplateDefinition = z.infer<typeof templateDefinitionSchema>;

/* ── Validation ───────────────────────────────────────────────── */

export class TemplateValidationError extends Error {
  constructor(
    message: string,
    readonly issues: string[] = [],
  ) {
    super(message);
    this.name = "TemplateValidationError";
  }
}

/* Per-field-item shapes, shared by request validation and template validation. */
const featureItemSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(400),
  icon: z.string().max(40).optional().default(""),
});

const itemSchemas = {
  productList: productItemSchema,
  imageList: galleryItemSchema,
  collectionList: testimonialItemSchema,
  factList: factItemSchema,
  featureList: featureItemSchema,
} as const;

/** Checks that a list field's sample data matches the shape the renderer expects. */
function listFieldIssues(template: TemplateDefinition): string[] {
  const issues: string[] = [];
  for (const field of template.contentSchema.fields) {
    const itemSchema = itemSchemas[field.type as keyof typeof itemSchemas];
    if (!itemSchema) continue;
    const sample = (template.previewData ?? {})[field.id];
    if (sample === undefined || sample === null) continue;
    if (!Array.isArray(sample)) {
      issues.push(`previewData.${field.id} harus berupa daftar`);
      continue;
    }
    const result = z.array(itemSchema).safeParse(sample);
    if (!result.success) {
      issues.push(`previewData.${field.id}: ${result.error.issues[0]?.message ?? "tidak valid"}`);
    }
  }
  return issues;
}

const SECTION_TEMPLATES: Record<TemplateSection["type"], (args: { variant: string }) => z.ZodType<PrototypeSection>> = {
  hero: () => prototypeSectionSchema.options[0],
  about: () => prototypeSectionSchema.options[1],
  productList: () => prototypeSectionSchema.options[2],
  gallery: () => prototypeSectionSchema.options[3],
  feature: () => prototypeSectionSchema.options[4],
  testimonial: () => prototypeSectionSchema.options[5],
  contact: () => prototypeSectionSchema.options[6],
  whatsappCta: () => prototypeSectionSchema.options[7],
  paymentInstruction: () => prototypeSectionSchema.options[8],
  footer: () => prototypeSectionSchema.options[9],
};

/** Validates a template definition against itself: sections, bindings, and sample data. */
export function validateTemplate(input: unknown): { template: TemplateDefinition; issues: string[] } {
  const parsed = templateDefinitionSchema.safeParse(input);
  if (!parsed.success) {
    throw new TemplateValidationError(
      "Template tidak valid",
      parsed.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`),
    );
  }

  const template = parsed.data;
  const issues: string[] = [];

  const keys = new Set<string>();
  for (const section of template.presentation.sections) {
    if (keys.has(section.key)) issues.push(`section.key duplikat: ${section.key}`);
    keys.add(section.key);
  }

  const fieldIds = new Set(template.contentSchema.fields.map((field) => field.id));
  const bindings = template.contentSchema.fields.filter((field) => field.bind).map((field) => field.bind as string);
  const bindingCounts = bindings.reduce<Record<string, number>>((acc, binding) => {
    acc[binding] = (acc[binding] ?? 0) + 1;
    return acc;
  }, {});
  for (const [binding, count] of Object.entries(bindingCounts)) {
    if (count > 1 && !["facts", "gallery", "testimonials", "products", "highlights"].includes(binding)) {
      issues.push(`bind '${binding}' dipakai lebih dari satu field`);
    }
  }
  if (!bindingCounts.businessName) issues.push("contentSchema harus punya field dengan bind 'businessName'");
  issues.push(...listFieldIssues(template));

  const productIds = productFieldId(template.contentSchema.fields);
  for (const section of template.presentation.sections) {
    for (const [slot, value] of Object.entries(section.content)) {
      if (typeof value === "string") continue;
      if (!fieldIds.has(value.field)) {
        issues.push(`section '${section.key}' merujuk field tak dikenal: ${value.field}`);
      } else if (slot === "items" && !productIds.includes(value.field)) {
        const field = template.contentSchema.fields.find((candidate) => candidate.id === value.field);
        if (field && !LIST_FIELD_TYPES.has(field.type)) {
          issues.push(`section '${section.key}' slot 'items' membutuhkan field berjenis list: ${value.field}`);
        }
      }
    }
  }

  for (const module of template.generator.modules) {
    if (!template.features.includes(module)) issues.push(`generator.modules '${module}' tidak ada di features`);
  }
  if (!template.generator.modules.length) issues.push("generator.modules kosong — proyek klien tidak bisa dirakit");

  // Render the sample data end to end; a template that cannot render is not importable.
  if (issues.length === 0) {
    try {
      resolveTemplatePreview({ template, category: { id: template.categoryId, name: template.categoryId }, data: template.previewData });
    } catch (error) {
      issues.push(`previewData tidak bisa dirender: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (issues.length) throw new TemplateValidationError(`Template '${template.id}' tidak valid`, issues);
  return { template, issues };
}

/* ── Content validation (dynamic, driven by the template) ─────── */

function fieldZodSchema(field: ContentField): z.ZodType {
  const item = itemSchemas[field.type as keyof typeof itemSchemas];
  if (item) {
    const list = z.array(item).max(field.maxItems ?? 60);
    return field.required ? list : list.optional();
  }

  let schema: z.ZodType;
  switch (field.type) {
    case "phone":
      schema = z.string().max(field.maxLength ?? 30);
      break;
    case "select":
      schema = z.enum((field.options ?? []).map((option) => option.value) as [string, ...string[]]);
      break;
    case "textarea":
    case "address":
    case "text":
      schema = z.string().max(field.maxLength ?? (field.type === "textarea" ? 2000 : 300));
      break;
    default:
      schema = z.string().max(field.maxLength ?? 300);
  }

  if (field.required) return schema;
  // Optional strings are tolerated when empty so partial drafts can still preview.
  return z.union([schema, z.literal("")]).optional();
}

/** Builds a zod object for a template's content schema. Used by the API for request validation. */
export function buildContentSchema(contentSchema: TemplateContentSchema): z.ZodType<Record<string, unknown>> {
  const shape: Record<string, z.ZodType> = {};
  for (const field of contentSchema.fields) shape[field.id] = fieldZodSchema(field);
  return z.object(shape) as unknown as z.ZodType<Record<string, unknown>>;
}

/** The fields a template is willing to let AI draft. Anything not listed stays untouched. */
export function aiSlotFields(contentSchema: TemplateContentSchema): ContentField[] {
  const byId = new Map(contentSchema.fields.map((field) => [field.id, field]));
  return contentSchema.aiSlots
    .map((slot) => byId.get(slot))
    .filter((field): field is ContentField => field !== undefined);
}

/**
 * Validation for an AI draft: only the template's declared slots exist in this
 * shape, so a model cannot introduce a price, feature, or arbitrary field even
 * if it returns one — unknown keys are stripped rather than kept.
 * Every slot is optional because a draft may omit fields it has nothing to say about.
 */
export function buildAiDraftSchema(contentSchema: TemplateContentSchema): z.ZodType<Record<string, unknown>> {
  const shape: Record<string, z.ZodType> = {};
  for (const field of aiSlotFields(contentSchema)) shape[field.id] = fieldZodSchema(field).optional();
  // An invented key must never fail the whole draft; it just has nowhere to land.
  return z.object(shape).strip() as unknown as z.ZodType<Record<string, unknown>>;
}

export type ContentValues = Record<string, unknown>;

/**
 * Drops a list row the client never filled.
 * The form always seeds one empty row so the user has somewhere to type,
 * so an untouched field must not arrive at the schema validator as
 * `{ title: "" }` and fail on a required sub-field.
 */
function isBlankRow(row: unknown): boolean {
  if (typeof row !== "object" || row === null || Array.isArray(row)) return false;
  return Object.values(row as Record<string, unknown>).every((value) => {
    if (value === null || value === undefined) return true;
    if (typeof value !== "string") return false;
    return value.trim().length === 0;
  });
}

/** Fills defaults and drops unknown keys so stored data always matches the template. */
export function normalizeContent(contentSchema: TemplateContentSchema, input: Record<string, unknown>): ContentValues {
  const values: ContentValues = {};
  for (const field of contentSchema.fields) {
    const raw = input[field.id];
    if (raw === undefined || raw === null) {
      if (field.defaultValue !== undefined) values[field.id] = field.defaultValue;
      else if (LIST_FIELD_TYPES.has(field.type)) values[field.id] = [];
      else values[field.id] = "";
      continue;
    }
    values[field.id] = Array.isArray(raw) && LIST_FIELD_TYPES.has(field.type) ? raw.filter((row) => !isBlankRow(row)) : raw;
  }
  return values;
}

/** Required fields reported in the order they appear, so the form can point at them. */
export function missingRequiredFields(contentSchema: TemplateContentSchema, values: ContentValues): string[] {
  return contentSchema.fields
    .filter((field) => {
      if (!field.required) return false;
      const value = values[field.id];
      if (value === undefined || value === null) return true;
      if (typeof value === "string") return value.trim().length < (field.minLength ?? 1);
      if (Array.isArray(value)) return value.length === 0;
      return false;
    })
    .map((field) => field.id);
}

/* ── Resolution: template + client data → render config ───────── */

export interface ResolveInput {
  template: TemplateDefinition;
  category: { id: string; name: string };
  data: Record<string, unknown>;
}


function bindingField(template: TemplateDefinition, binding: ContentBinding): ContentField | undefined {
  return template.contentSchema.fields.find((field) => field.bind === binding);
}

function fieldValue(template: TemplateDefinition, values: ContentValues, binding: ContentBinding): unknown {
  const field = bindingField(template, binding);
  return field ? values[field.id] : undefined;
}

const asString = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

function toProducts(items: unknown[]): PrototypeConfig["products"] {
  return items.map((item, index) => {
    const product = productItemSchema.parse(item);
    return {
      id: `product-${index + 1}`,
      name: product.name,
      description: product.description || "Produk pilihan usaha.",
      priceLabel: product.price || "Hubungi kami",
      ...(product.image ? { image: product.image } : {}),
      ...(product.badge ? { badge: product.badge } : {}),
    };
  });
}

function toGallery(items: unknown[]): { src: string; alt: string; caption?: string }[] {
  return items.map((item, index) => {
    const image = galleryItemSchema.parse(item);
    return { src: image.src, alt: image.alt, ...(image.caption ? { caption: image.caption } : {}) };
  });
}

function whatsappHref(whatsapp: string, businessName: string): string {
  const number = whatsapp.replace(/\D/g, "");
  if (!number) return "";
  return `https://wa.me/${number}?text=${encodeURIComponent(`Halo ${businessName}, saya ingin bertanya.`)}`;
}

/**
 * Resolves a section's content slots.
 *
 * A slot can be:
 *  - a binding name (e.g. `"tagline"`): read the client field that declares that binding;
 *  - `{ field, fallback }`: read a specific content field directly.
 * Anything not supplied falls back to the section's default below.
 *
 * This is what lets one section serve templates whose forms have different field ids —
 * the section names semantics, the template's contentSchema maps them to real fields.
 */
function resolveSectionContent(
  template: TemplateDefinition,
  values: ContentValues,
  section: TemplateSection,
  ctx: {
    category: { id: string; name: string };
    businessName: string;
    tagline: string;
    description: string;
    whatsapp: string;
    address: string;
    hours: string;
    location: string;
    priceNote: string;
    waHref: string;
    productCount: number;
  },
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  /**
   * A slot value is either a binding name (read whichever field declares it)
   * or `{ field, fallback }` (read that specific field).
   * Unmapped slots fall back to the defaults below.
   */
  const rawFor = (slot: string): unknown => {
    const explicit = section.content[slot];
    if (explicit === undefined) return undefined;
    if (typeof explicit === "string") {
      const field = bindingField(template, explicit as ContentBinding);
      return field ? values[field.id] : undefined;
    }
    return values[explicit.field] ?? explicit.fallback;
  };

  const read = (slot: string, fallback = ""): string => {
    const value = rawFor(slot);
    return asString(value) || fallback;
  };

  const readList = (slot: string): unknown[] => {
    const value = rawFor(slot);
    if (Array.isArray(value) && value.length) return value;
    return [];
  };

  switch (section.type) {
    case "hero": {
      out.title = read("title", ctx.tagline || ctx.businessName);
      out.subtitle = read(
        "subtitle",
        ctx.description || `Kenali ${ctx.businessName} dan pilihannya.`,
      );
      out.eyebrow = read("eyebrow", ctx.category.name);
      if (ctx.waHref) {
        out.ctaLabel = read("ctaLabel", `Chat ${ctx.businessName}`);
        out.ctaHref = ctx.waHref;
      }
      const meta = Array.from(new Set([ctx.address, ctx.location].filter(Boolean))).slice(0, 3);
      if (meta.length) out.meta = meta;
      break;
    }
    case "about": {
      out.title = read("title", ctx.businessName);
      out.body = read(
        "body",
        ctx.description ||
          `${ctx.businessName} melayani pelanggan dengan pilihan yang kami rangkai sendiri.`,
      );
      const facts = readList("facts");
      if (facts.length) out.facts = facts;
      else if (ctx.address || ctx.hours) {
        out.facts = [
          ...(ctx.address ? [{ label: "Lokasi", value: ctx.address }] : []),
          ...(ctx.hours ? [{ label: "Jam buka", value: ctx.hours }] : []),
        ];
      }
      break;
    }
    case "productList": {
      out.title = read("title", ctx.category.id === "kuliner" ? "Menu kami" : "Pilihan kami");
      const note = read("note", ctx.priceNote);
      if (note) out.note = note;
      break;
    }
    case "gallery": {
      out.title = read("title", "Galeri");
      out.images = readList("images");
      break;
    }
    case "feature": {
      out.title = read("title", "Kenapa memilih kami");
      const note = read("note", ctx.description);
      if (note) out.note = note;
      const items = readList("items");
      out.items = items.length
        ? items
        : [
            { title: "Dikerjakan langsung", body: `Setiap pesanan ditangani oleh tim ${ctx.businessName}.` },
            ...(ctx.address ? [{ title: "Mudah ditemukan", body: `${ctx.address}.` }] : []),
            ...(ctx.waHref ? [{ title: "Balas cepat", body: "Hubungi kami lewat WhatsApp kapan saja." }] : []),
          ];
      break;
    }
    case "testimonial": {
      out.title = read("title", "Kata pelanggan");
      const items = readList("items");
      out.items = items.length
        ? items
        : [{ quote: "Pelayanannya ramah dan pesanan selalu sesuai.", name: "Pelanggan" }];
      break;
    }
    case "contact": {
      out.title = read("title", "Temui kami");
      const body = read("body", ctx.description);
      if (body) out.body = body;
      if (ctx.address) out.address = ctx.address;
      if (ctx.hours) out.hours = ctx.hours;
      if (ctx.whatsapp) out.phone = ctx.whatsapp;
      if (ctx.waHref) {
        out.mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          ctx.address || ctx.businessName,
        )}`;
      }
      break;
    }
    case "whatsappCta": {
      out.title = read("title", "Ada yang ingin ditanyakan?");
      out.body = read(
        "body",
        `Tanya ketersediaan, harga, dan pemesanan langsung ke ${ctx.businessName}.`,
      );
      out.buttonLabel = read("buttonLabel", `Chat ${ctx.businessName}`);
      break;
    }
    case "paymentInstruction": {
      out.title = read("title", "Cara bayar");
      out.body = read(
        "body",
        ctx.priceNote || `Hubungi ${ctx.businessName} untuk instruksi pembayaran.`,
      );
      break;
    }
    case "footer": {
      out.text = read(
        "text",
        [ctx.businessName, ctx.address || ctx.location].filter(Boolean).join(" · "),
      );
      if (ctx.waHref) out.links = [{ label: "WhatsApp", href: ctx.waHref }];
      break;
    }
  }

  return out;
}

/**
 * Deterministic. Same template + same data always produce the same config,
 * which is what lets an order snapshot regenerate the same client project later.
 */
export function resolveTemplatePreview({ template, category, data }: ResolveInput): PrototypeConfig {
  const values = normalizeContent(template.contentSchema, data);
  const businessName = asString(fieldValue(template, values, "businessName")) || "Usaha kamu";
  const tagline = asString(fieldValue(template, values, "tagline"));
  const description = asString(fieldValue(template, values, "description"));
  const whatsapp = asString(fieldValue(template, values, "whatsapp"));
  const address = asString(fieldValue(template, values, "address"));
  const hours = asString(fieldValue(template, values, "hours"));
  const location = asString(fieldValue(template, values, "location"));
  const priceNote = asString(fieldValue(template, values, "priceNote"));
  const products = toProducts((fieldValue(template, values, "products") as unknown[]) ?? []);
  const waHref = whatsappHref(whatsapp, businessName);

  const ctx = {
    category, businessName, tagline, description, whatsapp,
    address, hours, location, priceNote, waHref,
    productCount: products.length,
  };

  const sections: PrototypeSection[] = [];
  for (const section of template.presentation.sections) {
    if (!section.enabled) continue;

    const content = resolveSectionContent(template, values, section, ctx);
    const candidate = prototypeSectionSchema.safeParse({
      ...content,
      type: section.type,
      enabled: true,
      variant: section.variant,
    });

    // An empty required block renders as a broken heading; drop it rather than ship it.
    if (candidate.success) sections.push(candidate.data);
  }

  const features = Array.from(new Set([
    ...template.features,
    ...(products.length ? ["product_list"] : []),
    ...(whatsapp ? ["whatsapp_chat"] : []),
    "landing_page",
  ]));

  return prototypeConfigSchema.parse({
    businessName,
    businessType: category.name,
    theme: template.presentation.theme,
    sections,
    features,
    products,
    paymentInstruction: priceNote || `Hubungi ${businessName} untuk instruksi pembayaran.`,
    whatsappNumber: whatsapp || "628000000000",
    seo: {
      title: [businessName, location].filter(Boolean).join(" "),
      description: description || `${businessName} — ${category.name}${address ? ` di ${address}` : ""}.`,
    },
    template: { id: template.id, version: template.version, name: template.name },
  });
}

/** Which template sections belong to a given feature module. Used by the generator manifest. */
export function sectionsForModules(template: TemplateDefinition, modules: string[]): string[] {
  return template.presentation.sections
    .filter((section) => section.module && modules.includes(section.module))
    .map((section) => section.key);
}
