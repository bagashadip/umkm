import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  buildContentSchema,
  calculateWebsitePrice,
  missingRequiredFields,
  normalizeContent,
  prototypeConfigSchema,
  resolveTemplatePreview,
  type TemplateDefinition,
} from "@umkm/planner-engine";
import { AiService } from "../ai/ai.service";
import { PrismaService } from "../prisma/prisma.service";
import type { Prisma } from "@prisma/client";
import { templateDefinitionFromRow, type TemplateRow } from "./template-record";

const CATEGORY_IDS = [
  "kuliner", "fashion", "kecantikan-kesehatan", "jasa", "kerajinan",
  "properti", "pendidikan", "agrikultur", "otomotif", "lainnya",
] as const;
const PLAN_IDS = ["trial", "business", "growth"] as const;
type WebsitePlan = (typeof PLAN_IDS)[number];

/**
 * Legacy shape of a client's business data, used when a project sits on a
 * template that predates content schemas. Templates with a content schema
 * validate against their own fields instead.
 */
type BusinessData = {
  name: string;
  tagline?: string;
  description?: string;
  whatsapp?: string;
  address?: string;
  products?: Array<{ name: string; description?: string; price?: string }>;
};

type ProjectInput = { sessionId: string; categoryId: string; templateId: string };

const asJson = (value: unknown) => value as object;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Only the slots AI is allowed to draft, so an applied draft cannot widen its reach. */
function pickFields(contentSchema: TemplateDefinition["contentSchema"], data: Record<string, unknown>, ids: string[]) {
  const picked: Record<string, unknown> = {};
  for (const id of ids) {
    if (contentSchema.fields.some((field) => field.id === id) && data[id] !== undefined) picked[id] = data[id];
  }
  return picked;
}

/** AI writes copy only: pricing and media ownership stay with planner-engine and the client. */
const NON_COPY_FIELDS = new Set(["price", "priceLabel", "image", "badge"]);

const rowName = (row: Record<string, unknown>) =>
  String(row.name ?? row.title ?? row.label ?? row.quote ?? "").trim().toLowerCase();

/**
 * Removes everything a model was not allowed to write, while leaving the
 * client's own rows untouched — their price is data they entered, not AI copy.
 */
function stripPricingAndMedia(values: Record<string, unknown>, current: Record<string, unknown>) {
  const stripped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (NON_COPY_FIELDS.has(key)) continue;
    if (!Array.isArray(value)) { stripped[key] = value; continue; }
    const ownNames = new Set(
      (Array.isArray(current[key]) ? (current[key] as unknown[]) : [])
        .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object" && !Array.isArray(row))
        .map(rowName),
    );
    stripped[key] = value
      .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object" && !Array.isArray(row))
      .map((row) => ownNames.has(rowName(row))
        ? row // client-authored row: keep it exactly as they typed it
        : Object.fromEntries(Object.entries(row).filter(([column]) => !NON_COPY_FIELDS.has(column))));
  }
  return stripped;
}

/**
 * A suggestion may extend the client's work but never replace it. Only the
 * product list merges: the client's rows join first, and a model row is dropped
 * when it repeats a name they already wrote. Other slots stay exactly as the
 * model returned them, so the draft remains "only what it spoke about".
 */
function mergeClientRows(draft: Record<string, unknown>, current: Record<string, unknown>, slots: string[]) {
  const merged = { ...draft };
  // Only when the model actually proposed products; otherwise say nothing about it.
  if (!slots.includes("products") || !Array.isArray(merged.products)) return merged;
  const own = (Array.isArray(current.products) ? current.products : [])
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object" && !Array.isArray(row));
  if (!own.length) return merged;

  const ownNames = new Set(own.map(rowName));
  const proposed = (merged.products as unknown[])
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object" && !Array.isArray(row))
    .filter((row) => !ownNames.has(rowName(row)));
  merged.products = proposed.length ? [...own, ...proposed] : own;
  return merged;
}

function normalizeDomain(input: string): string {
  const domain = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!/^(?=.{3,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) {
    throw new BadRequestException("Masukkan domain yang valid, contoh: usahaku.id");
  }
  return domain;
}

const TEMPLATE_SELECT = {
  id: true, categoryId: true, name: true, description: true, previewImage: true,
  config: true, contentSchema: true, previewData: true, features: true,
  generatorManifest: true, pricePlan: true, version: true, active: true, sortOrder: true,
} as const;

/** The shape every project query below returns: category joined, template column-filtered. */
type ProjectRecord = Prisma.WebsiteProjectGetPayload<{
  include: { category: true; template: { select: typeof TEMPLATE_SELECT } };
}> & {
  /** Only getProject joins the checkout; the other paths answer with null. */
  checkout?: { id: string; status: string; amount: number } | null;
};

@Injectable()
export class WebsiteFlowService {
  constructor(private readonly prisma: PrismaService, private readonly ai: AiService) {}

  async categories() {
    return this.prisma.businessCategory.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: {
      id: true, name: true, description: true, icon: true,
    } });
  }

  async templates(categoryId: string) {
    const category = await this.prisma.businessCategory.findFirst({ where: { id: categoryId, active: true } });
    if (!category || !CATEGORY_IDS.includes(categoryId as (typeof CATEGORY_IDS)[number])) throw new NotFoundException("Kategori tidak ditemukan");
    const rows = await this.prisma.websiteTemplate.findMany({ where: { categoryId, active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
    // Linked categories widen availability without duplicating rows.
    const linked = await this.prisma.websiteTemplate.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
    const seen = new Set(rows.map((row) => row.id));
    for (const row of linked) {
      if (seen.has(row.id)) continue;
      const config = (row.config ?? {}) as { categories?: unknown };
      if (Array.isArray(config.categories) && config.categories.includes(categoryId)) rows.push(row);
    }
    return rows.map((row) => this.templateView(row as unknown as TemplateRow));
  }

  /**
   * Browsable catalog across every category.
   * Server-side filtering keeps the search box from shipping the whole catalog
   * to the browser, and `q` matches only client-facing text.
   */
  async catalog(query: { q?: string; tag?: string; categoryId?: string; sort?: string }) {
    const rows = await this.prisma.websiteTemplate.findMany({
      where: { active: true },
      include: { category: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    const cards = rows.map((row) => ({
      ...this.templateView(row as unknown as TemplateRow),
      categoryId: row.categoryId,
      categoryName: row.category.name,
      categories: this.linkedCategories(row.config),
    }));

    const needle = query.q?.trim().toLowerCase();
    const tag = query.tag?.trim();
    const categoryId = query.categoryId?.trim();

    let results = cards.filter((card) => {
      if (categoryId && card.categoryId !== categoryId && !card.categories.includes(categoryId)) return false;
      if (tag && !card.tags.includes(tag)) return false;
      if (!needle) return true;
      return [card.name, card.description, card.categoryName, ...card.tags]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });

    if (query.sort === "name") results = [...results].sort((a, b) => a.name.localeCompare(b.name, "id"));

    return {
      templates: results,
      // Filter chips: only tags that actually exist in the catalog.
      tags: Array.from(new Set(cards.flatMap((card) => card.tags))).sort((a, b) => a.localeCompare(b)),
      total: results.length,
    };
  }

  /**
   * Live preview of a template before anyone picks it.
   * Renders the template's own sample data, never a client project.
   */
  async templatePreview(templateId: string) {
    const row = await this.prisma.websiteTemplate.findFirst({
      where: { id: templateId, active: true },
      include: { category: true },
    });
    if (!row) throw new NotFoundException("Template tidak ditemukan");
    const definition = templateDefinitionFromRow(row as unknown as TemplateRow);

    if (!definition) {
      // Pre-system templates carry no sample data, so there is nothing honest to render.
      return { id: row.id, name: row.name, version: row.version, dynamic: false, previewConfig: null };
    }

    return {
      id: definition.id,
      name: definition.name,
      version: definition.version,
      dynamic: true,
      previewConfig: resolveTemplatePreview({
        template: definition,
        category: { id: row.categoryId, name: row.category.name },
        data: definition.previewData,
      }),
    };
  }

  /** Content schema + feature labels for the "Ceritakan usahamu" step. */
  async templateSchema(templateId: string) {
    const row = await this.prisma.websiteTemplate.findFirst({ where: { id: templateId, active: true } });
    if (!row) throw new NotFoundException("Template tidak ditemukan");
    const definition = templateDefinitionFromRow(row as unknown as TemplateRow);
    const legacy = legacyContentSchema();
    // The client only ever renders what the server declares: the flag and the
    // template's own slots, never a hard-coded list of draftable fields.
    const aiEnabled = process.env.AI_PLANNER_CONTENT_ENABLED === "true";
    if (!definition) {
      return { dynamic: false, fields: legacy.fields, aiSlots: legacy.aiSlots, aiEnabled: aiEnabled && legacy.aiSlots.length > 0 };
    }
    return { dynamic: true, ...definition.contentSchema, aiEnabled: aiEnabled && definition.contentSchema.aiSlots.length > 0 };
  }

  /**
   * Template-aware AI draft for one project.
   *
   * Slots come from the template, not from the request: a client cannot widen
   * what AI may write, and the response is validated against the same content
   * schema, so no price, feature, or plan rule can enter business data here.
   */
  async draftContent(id: string, input: { brief: string; businessName: string }) {
    const project = await this.prisma.websiteProject.findUnique({
      where: { id },
      include: { template: true, category: true },
    });
    if (!project) throw new NotFoundException("Project tidak ditemukan");
    const definition = templateDefinitionFromRow(project.template as unknown as TemplateRow);
    if (!definition) throw new BadRequestException("Template ini belum mendukung draft konten.");

    const current = isRecord(project.businessData) ? project.businessData : {};
    const nameFieldId = definition.contentSchema.fields.find((field) => field.bind === "businessName")?.id;
    const existingName = nameFieldId && typeof current[nameFieldId] === "string" ? current[nameFieldId] as string : "";
    const effectiveName = existingName.trim() || input.businessName.trim();
    const result = await this.ai.draftContent({
      contentSchema: definition.contentSchema,
      brief: input.brief,
      // Step 2 has not been saved yet, so the form's own name is the current one.
      businessName: effectiveName || this.contentOf(project).name || "",
      categoryName: project.category.name,
      current,
    });

    // Provider-agnostic guard: a model may only ever propose copy. Products join
    // with what the client typed (by name, so apply never deletes their pricing).
    const mergedWithClient = mergeClientRows(result.draft, current, result.slots);

    // Validate AI-authored values using the template's form schema, but keep
    // unreturned slots absent so applying the draft cannot erase typed values.
    const nameForValidation = effectiveName || this.contentOf(project).name || "Nama usaha";
    const validationData = nameFieldId ? { [nameFieldId]: nameForValidation, ...mergedWithClient } : mergedWithClient;
    const parsed = buildContentSchema(definition.contentSchema).safeParse(normalizeContent(definition.contentSchema, validationData));
    if (!parsed.success) throw new BadRequestException("Draft konten tidak sesuai dengan template.");
    // Strip after normalizing: the schema's own defaults re-add empty price/image
    // fields on every row, so this is the first point they can be removed for good.
    const normalizedDraft = stripPricingAndMedia(normalizeContent(definition.contentSchema, mergedWithClient), current);
    const draft = pickFields(definition.contentSchema, normalizedDraft, result.slots);
    // An empty suggestion is no suggestion; drop it rather than blank a typed value.
    for (const [key, value] of Object.entries(draft)) {
      if (typeof value === "string" && !value.trim()) delete draft[key];
      if (Array.isArray(value) && value.length === 0) delete draft[key];
    }
    return {
      templateId: definition.id,
      slots: result.slots,
      source: result.source,
      draft,
    };
  }

  async createProject(input: ProjectInput) {
    const [session, template] = await Promise.all([
      this.prisma.plannerSession.findUnique({ where: { id: input.sessionId } }),
      this.prisma.websiteTemplate.findFirst({ where: { id: input.templateId, active: true }, include: { category: true } }),
    ]);
    if (!session) throw new NotFoundException("Session tidak ditemukan");
    if (!template || template.categoryId !== input.categoryId) {
      // A template may be offered under a linked category.
      const linked = (template?.config as { categories?: unknown } | null)?.categories;
      if (!template || !Array.isArray(linked) || !linked.includes(input.categoryId)) {
        throw new BadRequestException("Template tidak tersedia untuk kategori ini");
      }
    }
    const project = await this.prisma.websiteProject.create({ data: {
      sessionId: input.sessionId,
      categoryId: input.categoryId,
      templateId: input.templateId,
      currentStep: 3,
      // Frozen at order time: editing the catalog later must not move existing projects.
      templateSnapshot: asJson(this.snapshotOf(template)),
    }, include: { category: true, template: { select: TEMPLATE_SELECT } } });
    return this.projectView(project);
  }

  async getProject(id: string) {
    const project = await this.prisma.websiteProject.findUnique({ where: { id }, include: {
      category: true, template: { select: TEMPLATE_SELECT },
      checkout: true,
    } });
    if (!project) throw new NotFoundException("Project tidak ditemukan");
    return this.projectView(project);
  }

  async saveBusiness(id: string, data: Record<string, unknown>) {
    const project = await this.prisma.websiteProject.findUnique({ where: { id }, include: { template: true } });
    if (!project) throw new NotFoundException("Project tidak ditemukan");
    const definition = templateDefinitionFromRow(project.template as unknown as TemplateRow);
    const content = definition ? this.validateContent(definition, data) : (data as unknown as BusinessData);

    const saved = await this.prisma.websiteProject.update({ where: { id }, data: {
      businessData: asJson(content), currentStep: 4,
    }, include: { category: true, template: { select: TEMPLATE_SELECT } } });
    return this.buildPreview(saved);
  }

  async preview(id: string) {
    const project = await this.prisma.websiteProject.findUnique({ where: { id }, include: { template: true, category: true } });
    if (!project) throw new NotFoundException("Project tidak ditemukan");
    if (!project.businessData) throw new BadRequestException("Isi data bisnis sebelum melihat preview");
    return this.buildPreview(project);
  }

  async checkDomain(id: string, input: { domain: string }) {
    const project = await this.prisma.websiteProject.findUnique({ where: { id } });
    if (!project) throw new NotFoundException("Project tidak ditemukan");
    const domain = normalizeDomain(input.domain);
    // Stub provider: reserve predictable names for deterministic local development and tests.
    const available = !/(taken|dipakai|admin|www)\./.test(domain) && !domain.startsWith("taken");
    const check = await this.prisma.domainCheck.create({ data: { projectId: id, domain, available, provider: "stub", status: available ? "available" : "unavailable" } });
    await this.prisma.websiteProject.update({ where: { id }, data: { currentStep: 6 } });
    return { id: check.id, domain: check.domain, available: check.available, provider: check.provider, status: check.status, checkedAt: check.checkedAt };
  }

  async createCheckout(id: string) {
    const project = await this.prisma.websiteProject.findUnique({ where: { id }, include: { template: true, category: true, domainChecks: { orderBy: { checkedAt: "desc" }, take: 1 } } });
    if (!project) throw new NotFoundException("Project tidak ditemukan");
    if (!project.businessData) throw new BadRequestException("Data bisnis belum lengkap");
    const data = this.contentOf(project);
    const planId = project.template.pricePlan;
    if (!PLAN_IDS.includes(planId as WebsitePlan)) throw new BadRequestException("Template memiliki paket harga yang tidak valid");
    const price = calculateWebsitePrice({ plan: planId as WebsitePlan, productCount: data.products?.length ?? 0, needsOwnDomain: Boolean(project.domainChecks[0]?.available) });
    const domain = project.domainChecks[0];

    // A snapshot follows the order attempt: before any payment the client may go
    // back, edit, and re-checkout (which re-prices), so the latest attempt wins.
    // Once a payment record exists the order is committed and must never move.
    const paymentCount = await this.prisma.payment.count({ where: { checkout: { projectId: id } } });
    const frozen = paymentCount > 0;
    if (frozen) {
      // Repricing a paid order would separate amount from snapshot, so refuse
      // instead: the order is already committed.
      const paid = await this.prisma.checkout.findUnique({ where: { projectId: id } });
      if (paid && paid.status !== "pending") {
        throw new BadRequestException("Pesanan ini sudah dibayar dan tidak bisa dihitung ulang");
      }
    }

    const payload = this.orderPayload(project, price, domain);
    const checkout = await this.prisma.$transaction(async (tx) => {
      const created = await tx.checkout.upsert({
        where: { projectId: id },
        create: { projectId: id, amount: price.totalPrice, priceSnapshot: asJson(price), currency: "IDR" },
        update: { amount: price.totalPrice, priceSnapshot: asJson(price), status: "pending" },
      });
      await tx.orderSnapshot.upsert({
        where: { projectId: id },
        create: { projectId: id, payload: asJson(payload) },
        update: frozen ? {} : { payload: asJson(payload) },
      });
      await tx.websiteProject.update({ where: { id }, data: { currentStep: 7, status: "checkout" } });
      return created;
    });
    return { checkoutId: checkout.id, amount: checkout.amount, currency: checkout.currency, status: checkout.status, priceSnapshot: checkout.priceSnapshot };
  }

  /** Everything the generator is allowed to build from — no live catalog lookups later. */
  private orderPayload(
    project: { id: string; categoryId: string; businessData: unknown; template: unknown; category?: { name: string } },
    price: { totalPrice: number; breakdown: Array<{ id?: string; label: string; quantity: number; total: number }> },
    domain?: { domain: string; available: boolean } | null,
  ) {
    const template = isRecord(project.template) ? project.template : {};
    const generator = isRecord(template.generatorManifest) ? template.generatorManifest : {};
    const modules = Array.isArray(generator.modules) ? (generator.modules as string[]) : [];
    return {
      schemaVersion: 1,
      projectId: project.id,
      // The renderer needs the human name for sections like the hero eyebrow.
      category: { id: project.categoryId, name: project.category?.name ?? "" },
      template: this.snapshotOf(project.template as { id: string; version: number; name: string; config: unknown; contentSchema: unknown; previewData: unknown; features: unknown; generatorManifest: unknown; pricePlan: string }),
      businessData: project.businessData ?? {},
      plan: template.pricePlan ?? null,
      price: {
        total: price.totalPrice,
        currency: "IDR",
        // Priced from planner-engine only: ids + amounts, never a model's opinion.
        breakdown: price.breakdown.map((line) => ({ id: line.id ?? line.label, label: line.label, quantity: line.quantity, total: line.total })),
      },
      domain: domain?.available ? domain.domain : null,
      generator: {
        frontendPreset: typeof generator.frontendPreset === "string" ? generator.frontendPreset : null,
        backendPreset: typeof generator.backendPreset === "string" ? generator.backendPreset : null,
        modules: modules.slice().sort(),
      },
    };
  }

  async submitPayment(checkoutId: string, input: { method: "bank_transfer" | "manual" | "stub"; reference?: string }) {
    const checkout = await this.prisma.checkout.findUnique({ where: { id: checkoutId } });
    if (!checkout) throw new NotFoundException("Checkout tidak ditemukan");
    if (checkout.status === "paid") return { checkoutId, status: "paid", paymentStatus: "paid" };
    const payment = await this.prisma.payment.create({ data: { checkoutId, method: input.method, reference: input.reference, amount: checkout.amount, provider: "stub", status: "pending" } });
    await this.prisma.checkout.update({ where: { id: checkoutId }, data: { status: "payment_pending" } });
    return { checkoutId, paymentId: payment.id, status: "payment_pending", paymentStatus: "pending", message: "Pembayaran tercatat dan menunggu verifikasi." };
  }

  /* ── Template system ─────────────────────────────────────────── */

  /**
   * Validates incoming content against the template's own content schema,
   * so each template can ask for different inputs and reject what it needs.
   */
  private validateContent(definition: TemplateDefinition, data: Record<string, unknown>) {
    const schema = buildContentSchema(definition.contentSchema);
    // Normalize first: the form seeds one empty row in list inputs, and should
    // never make an untouched optional list block a valid business submission.
    const normalized = normalizeContent(definition.contentSchema, data);
    const parsed = schema.safeParse(normalized);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = definition.contentSchema.fields.find((candidate) => candidate.id === String(issue?.path[0]));
      const row = typeof issue?.path[1] === "number" ? ` (item ${Number(issue.path[1]) + 1})` : "";
      const detail = [issue?.path[2], issue?.message].filter(Boolean).join(": ");
      throw new BadRequestException(field ? `${field.label}${row}: ${detail}` : detail || "Isian tidak valid");
    }
    const values = normalizeContent(definition.contentSchema, parsed.data);
    const missing = missingRequiredFields(definition.contentSchema, values);
    if (missing.length) {
      const label = definition.contentSchema.fields.find((field) => field.id === missing[0])?.label ?? missing[0];
      throw new BadRequestException(`Lengkapi isian wajib terlebih dahulu: ${label}`);
    }
    return values;
  }

  private snapshotOf(template: { id: string; version: number; name: string; config: unknown; contentSchema: unknown; previewData: unknown; features: unknown; generatorManifest: unknown; pricePlan: string }) {
    const definition = templateDefinitionFromRow(template as unknown as TemplateRow);
    return definition
      ? { id: definition.id, version: definition.version, definition }
      : { id: template.id, version: template.version, legacy: true, config: template.config, pricePlan: template.pricePlan };
  }

  /** Extra categories a template is listed under, beyond its own row. */
  private linkedCategories(config: unknown): string[] {
    const categories = isRecord(config) ? config.categories : undefined;
    return Array.isArray(categories) ? categories.filter((id): id is string => typeof id === "string") : [];
  }

  private templateView(row: TemplateRow) {
    const definition = templateDefinitionFromRow(row);
    const config = (row.config ?? {}) as { tags?: unknown; presentation?: unknown };
    const presentation = isRecord(config.presentation)
      ? config.presentation
      : null;
    const theme = presentation && isRecord(presentation.theme) ? presentation.theme : null;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      previewImage: row.previewImage,
      version: row.version,
      pricePlan: row.pricePlan,
      tags: Array.isArray(config.tags) ? config.tags.filter((tag): tag is string => typeof tag === "string") : [],
      features: Array.isArray(row.features) ? row.features : [],
      modules: isRecord(row.generatorManifest)
        ? (((row.generatorManifest.modules as unknown) as string[]) ?? [])
        : [],
      // Public design tokens only, so a catalog card can show the template's real colours.
      swatches: theme
        ? [theme.primary, theme.surfaceAlt, theme.accent].filter((value): value is string => typeof value === "string")
        : [],
      // Section names in order — the card's structure without shipping full presentation.
      sectionOrder: presentation && Array.isArray(presentation.sections)
        ? presentation.sections.map((section) => (section as { type?: string }).type).filter((type): type is string => typeof type === "string")
        : [],
      // Drives the dynamic form in the configurator.
      dynamic: Boolean(definition),
    };
  }

  private contentOf(project: { businessData: unknown; template?: unknown }) {
    const data = project.businessData as unknown;
    if (!isRecord(data)) return { name: "Usaha", products: [] } as BusinessData;
    if (typeof data.name === "string") return data as unknown as BusinessData;
    // Dynamic templates bind the name semantically but may use a different field id.
    const template = project.template ? templateDefinitionFromRow(project.template as unknown as TemplateRow) : null;
    const nameField = template?.contentSchema.fields.find((field) => field.bind === "businessName")?.id;
    const productField = template?.contentSchema.fields.find((field) => field.bind === "products")?.id;
    return {
      name: (nameField && typeof data[nameField] === "string" ? data[nameField] : "Usaha") as string,
      products: (productField && Array.isArray(data[productField]) ? data[productField] : []) as BusinessData["products"],
    } as BusinessData;
  }

  private projectView(project: ProjectRecord) {
    return { id: project.id, sessionId: project.sessionId, status: project.status, currentStep: project.currentStep, category: project.category, template: project.template, businessData: project.businessData, previewConfig: project.previewConfig, templateSnapshot: project.templateSnapshot, checkout: project.checkout ?? null };
  }

  private buildPreview(project: ProjectRecord) {
    const definition = templateDefinitionFromRow(project.template as unknown as TemplateRow);

    if (definition) {
      const config = resolveTemplatePreview({
        template: definition,
        category: { id: project.categoryId, name: project.category.name },
        data: (project.businessData ?? {}) as Record<string, unknown>,
      });
      return this.prisma.websiteProject.update({ where: { id: project.id }, data: { previewConfig: asJson(config), currentStep: 5 }, include: { category: true, template: { select: TEMPLATE_SELECT } } }).then((updated) => ({ project: this.projectView(updated), previewConfig: config }));
    }

    return this.buildLegacyPreview(project);
  }

  /** Keeps templates created before the template system rendering exactly as they did. */
  private buildLegacyPreview(project: ProjectRecord) {
    const data = (project.businessData ?? {}) as BusinessData;
    const template = (project.template.config ?? {}) as { layout?: string; accent?: string };
    const name = data.name?.trim() || "Usaha kamu";
    const products = (data.products ?? []).map((product, index) => ({ id: `product-${index + 1}`, name: product.name, description: product.description || "Produk pilihan usaha.", priceLabel: product.price || "Hubungi kami" }));
    const config = prototypeConfigSchema.parse({
      businessName: name, businessType: project.category.name,
      theme: { primary: template.accent || "#0b2545", font: "Manrope, sans-serif", radius: "0.5rem" },
      sections: [
        { type: "hero", enabled: true, title: data.tagline || `${name}, lebih mudah ditemukan`, subtitle: data.description || `Kenali ${name} dan produk pilihan kami.` },
        { type: "about", enabled: true, title: `Tentang ${name}`, body: data.description || "Cerita usaha dan layanan untuk pelanggan." },
        { type: "productList", enabled: products.length > 0, title: project.categoryId === "kuliner" ? "Menu kami" : "Pilihan kami" },
        { type: "whatsappCta", enabled: Boolean(data.whatsapp), title: "Ada yang ingin ditanyakan?", body: "Hubungi kami untuk informasi dan pemesanan." },
        { type: "footer", enabled: true, text: data.address || name },
      ],
      features: ["landing_page", ...(products.length ? ["product_list"] : []), ...(data.whatsapp ? ["whatsapp_chat"] : [])], products,
      paymentInstruction: "Hubungi usaha untuk instruksi pembayaran.", whatsappNumber: data.whatsapp || "628000000000", seo: { title: name, description: data.description || `${name} di ${project.category.name}.` },
    });
    return this.prisma.websiteProject.update({ where: { id: project.id }, data: { previewConfig: asJson(config), currentStep: 5 }, include: { category: true, template: { select: TEMPLATE_SELECT } } }).then((updated) => ({ project: this.projectView(updated), previewConfig: config }));
  }
}

/** Mirrors the shape of a template content schema for pre-system templates. */
function legacyContentSchema() {
  return {
    fields: [
      { id: "name", label: "Nama usaha", type: "text", required: true, placeholder: "Contoh: Kedai Rasa Pagi" },
      { id: "tagline", label: "Kalimat pembuka", type: "text", required: false, placeholder: "Contoh: Sarapan hangat setiap pagi" },
      { id: "description", label: "Cerita singkat", type: "textarea", required: false },
      { id: "whatsapp", label: "WhatsApp (opsional)", type: "phone", required: false, placeholder: "0812..." },
      { id: "address", label: "Lokasi (opsional)", type: "address", required: false, placeholder: "Bandung" },
      { id: "products", label: "Produk atau layanan", type: "productList", required: false, maxItems: 60 },
    ],
    aiSlots: ["tagline", "description", "products"],
  } as const;
}
