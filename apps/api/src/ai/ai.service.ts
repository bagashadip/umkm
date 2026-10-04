import { Injectable, Logger } from "@nestjs/common";
import { GoogleGenAI, type GenerateContentParameters } from "@google/genai";
import {
  aiSlotFields,
  buildAiDraftSchema,
  normalizeAnswers,
  questionnaireSchema,
  rawAnswersSchema,
  type Questionnaire,
  type RawAnswers,
  type TemplateContentSchema,
} from "@umkm/planner-engine";
import { z } from "zod";

export const aiQuestionnaireSchema = z.object({
  businessType: z.enum(["retail", "food_beverage", "services", "craft", "other"]),
  productCount: z.number().int().min(0).max(10_000),
  transactionMethod: z.enum(["whatsapp", "manual_payment", "offline", "mixed"]),
  needsSeo: z.boolean(),
  needsWhatsapp: z.boolean(),
  needsOwnDomain: z.boolean(),
  needsProductVariants: z.boolean(),
  needsOrderTracking: z.boolean(),
  plan: z.enum(["trial", "business", "growth"]),
});

export type AiQuestionnaire = z.infer<typeof aiQuestionnaireSchema>;

export type AiMappingResult = {
  questionnaire: Questionnaire;
  source: "ai" | "form";
};

/**
 * Gemini reads structured output from the *same* zod schema that validates the
 * reply, so the model's contract and our validation cannot drift apart.
 */
const toJsonSchema = (schema: z.ZodType): Record<string, unknown> =>
  z.toJSONSchema(schema, { io: "output" }) as unknown as Record<string, unknown>;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: GoogleGenAI | null;

  constructor() {
    const key = (process.env.GEMINI_API_KEY ?? "").trim().replace(/^["']|["']$/g, "");
    this.client = key ? new GoogleGenAI({ apiKey: key }) : null;
  }

  /**
   * Maps free text only. Pricing and feature selection remain in planner-engine.
   * Any missing key or failed AI response falls back to the structured form.
   */
  async mapTextToQuestionnaire(
    text: string,
    fallback: RawAnswers,
  ): Promise<AiMappingResult> {
    const safeFallback = this.normalizeFallback(fallback);
    if (!this.client || !text.trim()) return { questionnaire: safeFallback, source: "form" };

    try {
      const parsed = await this.generate(
        "Map Indonesian user text to questionnaire fields only. Return only the questionnaire structure. " +
        "Never calculate prices, select features, invent fields, or change plan rules. " +
        "If text does not provide a value, preserve the supplied fallback value.",
        JSON.stringify({ text, fallback: safeFallback }),
        aiQuestionnaireSchema,
      );
      const questionnaire = questionnaireSchema.parse(parsed);
      return { questionnaire, source: "ai" };
    } catch (error) {
      this.logger.warn(`AI questionnaire mapping failed; using form fallback: ${String(error)}`);
      return { questionnaire: safeFallback, source: "form" };
    }
  }

  /**
   * Optional AI Planner role: drafts *copy suggestions* for the business form.
   *
   * The template decides which fields may be drafted (`contentSchema.aiSlots`);
   * the same template's field types decide the shape of the reply, so a model
   * can neither add a field nor drop one into a price, feature, or plan rule.
   * Those stay in planner-engine. Returns source "form" when the feature is
   * off, there is no API key, or the reply fails validation.
   */
  async draftContent(input: {
    contentSchema: TemplateContentSchema;
    brief: string;
    businessName: string;
    categoryName: string;
    current: Record<string, unknown>;
  }): Promise<{ draft: Record<string, unknown>; source: "ai" | "form"; slots: string[] }> {
    const slots = aiSlotFields(input.contentSchema).map((field) => field.id);
    const draftSchema = buildAiDraftSchema(input.contentSchema);
    const build = (draft: Record<string, unknown>, source: "ai" | "form") => {
      const clean = this.dropEmpty(draft);
      // A valid-but-empty JSON response is not useful to the reviewer. Treat it
      // as an unavailable model and use the deterministic fallback instead.
      if (source === "ai" && Object.keys(clean).length === 0) {
        return { draft: this.staticDraft(slots, input), source: "form" as const, slots };
      }
      return { draft: clean, source, slots };
    };

    if (!this.client || !input.brief.trim() || slots.length === 0) {
      return build(this.staticDraft(slots, input), "form");
    }

    try {
      const parsed = await this.generate(
        "Draft Indonesian marketing copy for a small business website from the brief. " +
        `Fill only these fields: ${slots.join(", ")}. ` +
        "Every other value is out of reach for you — never propose a price, discount, plan, feature, or section. " +
        "Omit a field instead of guessing it. Keep every claim generic and supportable by the brief. " +
        "Reply in Indonesian, and do not repeat the business name in every field.",
        JSON.stringify(input),
        draftSchema,
      );
      const checked = draftSchema.safeParse(parsed);
      if (!checked.success) throw new Error(`Gemini draft failed validation: ${checked.error.issues[0]?.message ?? "unknown"}`);
      // dropEmpty keeps a half-finished reply from blanking a field the client already wrote
      return build(checked.data, "ai");
    } catch (error) {
      this.logger.warn(`AI content draft failed; using form fallback: ${String(error)}`);
      return build(this.staticDraft(slots, input), "form");
    }
  }

  /**
   * One guarded JSON call: the system prompt says what to do, the JSON Schema
   * says what may come back, and zod has the final say either way.
   *
   * A flash model occasionally answers 503 during demand spikes, which is not
   * an invalid key or a bad prompt, so the call falls back to a second model
   * before giving up and letting the caller use its static draft.
   */
  private async generate(
    systemInstruction: string,
    userPayload: string,
    schema: z.ZodType,
  ): Promise<Record<string, unknown>> {
    if (!this.client) throw new Error("GEMINI_API_KEY is not configured");
    const jsonSchema = toJsonSchema(schema);
    const primary = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";
    const models = Array.from(new Set([primary, "gemini-3.1-flash-lite"]));

    let lastError: unknown;
    for (const model of models) {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const request: GenerateContentParameters = {
            model,
            contents: userPayload,
            config: {
              systemInstruction,
              temperature: 0.4,
              maxOutputTokens: 8192,
              responseMimeType: "application/json",
              responseJsonSchema: jsonSchema,
            },
          };
          const response = await this.client.models.generateContent(request);
          const text = response.text;
          if (!text?.trim()) throw new Error("Gemini returned an empty response");
          return JSON.parse(text) as Record<string, unknown>;
        } catch (error) {
          lastError = error;
          const status = (error as { status?: number })?.status;
          if (status !== 503 && status !== 429) break; // auth/schema errors will not heal on retry
          this.logger.warn(`Gemini ${model} busy (attempt ${attempt + 1}); trying again`);
          await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  /** Deterministic copy for slots we can draft without a model, so the flow never dead-ends. */
  private staticDraft(
    slots: string[],
    input: { brief: string; businessName: string; categoryName: string; current: Record<string, unknown> },
  ): Record<string, unknown> {
    const draft: Record<string, unknown> = {};
    const brief = input.brief.trim().split(/\s+/).slice(0, 24).join(" ");
    const text = brief || `${input.businessName} melayani pelanggan di kategori ${input.categoryName}.`;
    for (const slot of slots) {
      if (slot === "tagline") draft[slot] = `${input.businessName} — ${input.categoryName}`;
      else if (slot === "description") draft[slot] = text;
      else if (slot === "whatsapp") draft[slot] = String(input.current.whatsapp ?? "");
      else if (slot === "address") draft[slot] = String(input.current.address ?? "");
    }
    return draft;
  }

  /** Never let an empty reply overwrite something the client typed. */
  private dropEmpty(draft: Record<string, unknown>): Record<string, unknown> {
    const kept: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(draft)) {
      if (typeof value === "string" ? value.trim().length > 0 : Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null) {
        kept[key] = value;
      }
    }
    return kept;
  }

  private normalizeFallback(fallback: RawAnswers): Questionnaire {
    const raw = rawAnswersSchema.parse(fallback);
    return normalizeAnswers(raw);
  }
}
