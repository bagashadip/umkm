import { z } from "zod";

export const questionnaireSchema = z.object({
  businessType: z.enum([
    "retail",
    "food_beverage",
    "services",
    "craft",
    "other",
  ]),
  productCount: z.number().int().min(0).max(10_000),
  transactionMethod: z.enum(["whatsapp", "manual_payment", "offline", "mixed"]),
  needsSeo: z.boolean(),
  needsWhatsapp: z.boolean(),
  needsOwnDomain: z.boolean(),
  needsProductVariants: z.boolean(),
  needsOrderTracking: z.boolean(),
  plan: z.enum(["trial", "business", "growth"]),
});

export type Questionnaire = z.infer<typeof questionnaireSchema>;

/** Bump when the questionnaire shape changes. */
export const QUESTIONNAIRE_VERSION = 1;

/**
 * Loose schema for raw client input: partial, types not yet normalized.
 * Ran before anything is persisted so bad structure never reaches the DB.
 */
export const rawAnswersSchema = z
  .object({
    businessType: z.union([z.string(), z.number()]),
    productCount: z.union([z.number(), z.string()]),
    transactionMethod: z.string(),
    needsSeo: z.union([z.boolean(), z.string(), z.number()]),
    needsWhatsapp: z.union([z.boolean(), z.string(), z.number()]),
    needsOwnDomain: z.union([z.boolean(), z.string(), z.number()]),
    needsProductVariants: z.union([z.boolean(), z.string(), z.number()]),
    needsOrderTracking: z.union([z.boolean(), z.string(), z.number()]),
    plan: z.string(),
  })
  .partial();

export type RawAnswers = z.infer<typeof rawAnswersSchema>;

const truthy = (v: unknown): boolean =>
  v === true || v === 1 || v === "1" || v === "true" || v === "yes" || v === "ya";

/**
 * Coerce raw input into a shape the strict schema accepts, then validate.
 * Throws ZodError when the normalized value still does not satisfy the schema.
 */
export function normalizeAnswers(raw: RawAnswers): Questionnaire {
  const prepared = {
    businessType: String(raw.businessType ?? "").trim(),
    productCount:
      typeof raw.productCount === "number"
        ? raw.productCount
        : Number.parseInt(String(raw.productCount ?? "").trim(), 10),
    transactionMethod: String(raw.transactionMethod ?? "").trim(),
    needsSeo: truthy(raw.needsSeo),
    needsWhatsapp: truthy(raw.needsWhatsapp),
    needsOwnDomain: truthy(raw.needsOwnDomain),
    needsProductVariants: truthy(raw.needsProductVariants),
    needsOrderTracking: truthy(raw.needsOrderTracking),
    plan: String(raw.plan ?? "").trim(),
  };
  return questionnaireSchema.parse(prepared);
}

export const questionnaireQuestions = [
  { id: "businessType", label: "Jenis usaha apa?", type: "select" },
  { id: "productCount", label: "Berapa jumlah produk atau layanan?", type: "number" },
  { id: "transactionMethod", label: "Bagaimana pelanggan bertransaksi?", type: "select" },
  { id: "needsSeo", label: "Ingin usaha lebih mudah ditemukan di Google?", type: "boolean" },
  { id: "needsWhatsapp", label: "Ingin calon pembeli menghubungi WhatsApp usaha?", type: "boolean" },
  { id: "needsOwnDomain", label: "Perlu alamat web sendiri?", type: "boolean" },
  { id: "needsProductVariants", label: "Produk punya varian seperti ukuran atau warna?", type: "boolean" },
  { id: "needsOrderTracking", label: "Perlu melacak pesanan?", type: "boolean" },
  { id: "plan", label: "Pilih paket awal", type: "select" },
] as const;
