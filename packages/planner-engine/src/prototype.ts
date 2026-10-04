import { z } from "zod";

const title = z.string().min(1).max(160);
const subtitle = z.string().min(1).max(240);
const body = z.string().min(1).max(4000);

const factSchema = z.object({ label: z.string().min(1).max(60), value: z.string().min(1).max(120) });
const imageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1).max(140),
  caption: z.string().max(140).optional(),
});
const featureItemSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(400),
  icon: z.string().max(40).optional(),
});
const testimonialSchema = z.object({
  quote: z.string().min(1).max(600),
  name: z.string().min(1).max(80),
  role: z.string().max(100).optional(),
});
const linkSchema = z.object({ label: z.string().min(1).max(60), href: z.string().min(1) });

/**
 * Sections are structural: a template says which sections exist and how they are
 * variant-styled. The API resolves each section against client data before rendering,
 * so every value a section displays already exists in this resolved config.
 */
const sectionBase = {
  enabled: z.boolean(),
  /** Optional in the render config so plain configs stay minimal; the renderer falls back to "default". */
  variant: z.string().min(1).optional(),
};

export const PROTOTYPE_SECTION_TYPES = [
  "hero",
  "about",
  "productList",
  "gallery",
  "feature",
  "testimonial",
  "contact",
  "whatsappCta",
  "paymentInstruction",
  "footer",
] as const;

export const prototypeSectionSchema = z.discriminatedUnion("type", [
  z.object({
    ...sectionBase,
    type: z.literal("hero"),
    title,
    subtitle,
    eyebrow: z.string().max(80).optional(),
    image: imageSchema.optional(),
    ctaLabel: z.string().max(60).optional(),
    ctaHref: z.string().max(400).optional(),
    secondaryLabel: z.string().max(60).optional(),
    secondaryHref: z.string().max(400).optional(),
    meta: z.array(z.string().max(80)).max(4).optional(),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("about"),
    title,
    body,
    image: imageSchema.optional(),
    facts: z.array(factSchema).max(6).optional(),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("productList"),
    title,
    note: z.string().max(240).optional(),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("gallery"),
    title,
    images: z.array(imageSchema).max(24),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("feature"),
    title,
    note: z.string().max(240).optional(),
    items: z.array(featureItemSchema).min(1).max(8),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("testimonial"),
    title,
    items: z.array(testimonialSchema).min(1).max(6),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("contact"),
    title,
    body: z.string().max(600).optional(),
    address: z.string().max(300).optional(),
    hours: z.string().max(200).optional(),
    phone: z.string().max(40).optional(),
    mapHref: z.string().max(400).optional(),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("whatsappCta"),
    title,
    body,
    buttonLabel: z.string().max(60).optional(),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("paymentInstruction"),
    title,
    body,
  }),
  z.object({
    ...sectionBase,
    type: z.literal("footer"),
    text: z.string().min(1).max(300),
    links: z.array(linkSchema).max(6).optional(),
  }),
]);

export const prototypeThemeSchema = z.object({
  primary: z.string().min(1),
  font: z.string().min(1),
  radius: z.string().min(1),
  accent: z.string().min(1).optional(),
  ink: z.string().min(1).optional(),
  muted: z.string().min(1).optional(),
  surface: z.string().min(1).optional(),
  surfaceAlt: z.string().min(1).optional(),
  highlight: z.string().min(1).optional(),
  onPrimary: z.string().min(1).optional(),
  displayFont: z.string().min(1).optional(),
  buttonStyle: z.enum(["pill", "soft", "square"]).optional(),
  pattern: z.enum(["none", "grid", "dots", "arcs"]).optional(),
});

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  priceLabel: z.string(),
  image: z.string().max(500).optional(),
  badge: z.string().max(40).optional(),
});

export const prototypeConfigSchema = z.object({
  businessName: z.string().min(1),
  businessType: z.string().min(1),
  theme: prototypeThemeSchema,
  sections: z.array(prototypeSectionSchema),
  features: z.array(z.string()),
  products: z.array(productSchema),
  paymentInstruction: z.string().min(1),
  whatsappNumber: z.string().min(1),
  seo: z.object({ title: z.string().min(1), description: z.string().min(1) }),
  /** Provenance kept with the render config so a generated project stays reproducible. */
  template: z
    .object({ id: z.string().min(1), version: z.number().int().positive(), name: z.string().min(1) })
    .optional(),
});

export type PrototypeConfig = z.infer<typeof prototypeConfigSchema>;
export type PrototypeSection = z.infer<typeof prototypeSectionSchema>;
export type PrototypeTheme = z.infer<typeof prototypeThemeSchema>;
export type PrototypeProduct = z.infer<typeof productSchema>;

export const samplePrototypeConfig: PrototypeConfig = {
  businessName: "Kedai Rasa Pagi",
  businessType: "Makanan dan minuman",
  theme: { primary: "#b12a20", font: "DM Sans, sans-serif", radius: "0.25rem" },
  sections: [
    { type: "hero", enabled: true, title: "Rasa rumahan untuk pagi yang lebih nikmat", subtitle: "Kopi, kue, dan sarapan dibuat segar setiap hari." },
    { type: "about", enabled: true, title: "Dibuat dekat dari dapur kami", body: "Pesan sarapan dan camilan untuk rumah, kantor, atau acara kecilmu." },
    { type: "productList", enabled: true, title: "Menu hari ini" },
    { type: "paymentInstruction", enabled: true, title: "Cara bayar", body: "Transfer ke BCA 123456789 a.n. Kedai Rasa Pagi. Kirim bukti pembayaran lewat WhatsApp." },
    { type: "whatsappCta", enabled: true, title: "Mau pesan?", body: "Tanya menu dan ketersediaan langsung ke kami." },
    { type: "footer", enabled: true, text: "Kedai Rasa Pagi · Bandung" },
  ],
  features: ["landing_page", "product_list", "manual_payment", "whatsapp_chat"],
  products: [
    { id: "kopi-susu", name: "Kopi susu gula aren", description: "Espresso, susu, dan gula aren.", priceLabel: "Rp 18.000" },
    { id: "roti-bakar", name: "Roti bakar srikaya", description: "Roti panggang dengan selai srikaya.", priceLabel: "Rp 15.000" },
    { id: "nasi-ayam", name: "Nasi ayam suwir", description: "Nasi hangat, ayam suwir, dan sambal.", priceLabel: "Rp 25.000" },
  ],
  paymentInstruction: "Transfer ke BCA 123456789 a.n. Kedai Rasa Pagi.",
  whatsappNumber: "628123456789",
  seo: { title: "Kedai Rasa Pagi Bandung", description: "Pesan kopi, sarapan, dan camilan rumahan dari Kedai Rasa Pagi." },
};
