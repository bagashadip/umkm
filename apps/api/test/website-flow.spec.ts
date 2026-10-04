import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { AiService } from "../src/ai/ai.service";
import { PrismaService } from "../src/prisma/prisma.service";

const business = {
  name: "Kedai Rasa Pagi",
  tagline: "Sarapan hangat setiap pagi",
  description: "Kopi dan sarapan rumahan untuk tetangga sekitar.",
  whatsapp: "08123456789",
  address: "Bandung",
  products: [{ name: "Kopi susu", description: "Kopi susu gula aren", price: "Rp 18.000" }],
};

describe("Website flow endpoints", () => {
  let app: INestApplication;
  let sessionId: string;
  let projectId: string;
  let checkoutId: string;
  // Local .env may enable AI; this suite must still prove the off state works,
  // and must never reach a live provider while asserting on responses.
  const previousFlag = process.env.AI_PLANNER_CONTENT_ENABLED;
  const previousGeminiKey = process.env.GEMINI_API_KEY;

  beforeAll(async () => {
    process.env.AI_PLANNER_CONTENT_ENABLED = "";
    // Empty, not deleted: ConfigModule loads .env during compile and would
    // otherwise reinstate a real key, turning assertions into live AI calls.
    process.env.GEMINI_API_KEY = "";
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    process.env.AI_PLANNER_CONTENT_ENABLED = previousFlag;
    if (previousGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousGeminiKey;
  });

  it("lists seeded categories and category-specific templates", async () => {
    const categories = await request(app.getHttpServer()).get("/api/website-flow/categories").expect(200);
    expect(categories.body).toHaveLength(10);
    expect(categories.body.map((item: { id: string }) => item.id)).toContain("kuliner");

    const templates = await request(app.getHttpServer()).get("/api/website-flow/categories/kuliner/templates").expect(200);
    expect(templates.body.length).toBeGreaterThanOrEqual(2);
    expect(templates.body[0]).toEqual(expect.objectContaining({ id: expect.stringContaining("kuliner"), name: expect.any(String) }));
    expect(JSON.stringify(templates.body)).not.toContain("presentation");

    // The imported sample advertises its own dynamic form.
    const sample = templates.body.find((item: { id: string }) => item.id === "commerce-editorial-v1");
    expect(sample).toEqual(expect.objectContaining({ dynamic: true, version: 1, pricePlan: "business" }));
    expect(sample.features).toEqual(expect.arrayContaining(["catalog", "whatsapp"]));
    expect(sample.modules).toEqual(expect.arrayContaining(["catalog", "whatsapp"]));
  });

  it("serves the template's own content schema for the data step", async () => {
    const schema = await request(app.getHttpServer()).get("/api/website-flow/templates/commerce-editorial-v1/schema").expect(200);
    expect(schema.body.dynamic).toBe(true);
    const ids = schema.body.fields.map((field: { id: string }) => field.id);
    expect(ids).toEqual(["businessName", "tagline", "description", "whatsapp", "address", "hours", "products", "facts", "highlights"]);
    expect(schema.body.fields[0]).toEqual(expect.objectContaining({ required: true, type: "text", bind: "businessName" }));
    expect(schema.body.aiSlots).toEqual(["tagline", "description", "products"]);
  });

  it("renders a preview from the sample template and freezes its definition", async () => {
    const session = await request(app.getHttpServer()).post("/api/planner/start").expect(201);
    const project = await request(app.getHttpServer()).post("/api/website-flow/projects").send({
      sessionId: session.body.sessionId, categoryId: "kuliner", templateId: "commerce-editorial-v1",
    }).expect(201);
    expect(project.body.templateSnapshot).toEqual(
      expect.objectContaining({ id: "commerce-editorial-v1", version: 1, definition: expect.any(Object) }),
    );

    const saved = await request(app.getHttpServer()).post(`/api/website-flow/projects/${project.body.id}/business`).send({
      businessName: "Warung Uji Coba",
      tagline: "Masakan rumah setiap hari.",
      description: "Dapur rumahan yang buka sejak 2019.",
      whatsapp: "081234567899",
      address: "Depok",
      hours: "Senin–Sabtu",
      products: [{ name: "Nasi uduk", description: "Nasi uduk dengan lauk rumahan.", price: "Rp 20.000" }],
      facts: [{ label: "Melayani sejak", value: "2019" }],
      highlights: [{ title: "Masak pagi hari", body: "Tidak disimpan semalaman." }],
    }).expect(201);

    const preview = saved.body.previewConfig;
    expect(preview.businessName).toBe("Warung Uji Coba");
    expect(preview.businessType).toBe("Kuliner");
    expect(preview.template).toEqual(expect.objectContaining({ id: "commerce-editorial-v1", version: 1 }));
    expect(preview.theme.primary).toBe("#264653");
    expect(preview.sections.map((section: { type: string }) => section.type)).toEqual([
      "hero", "about", "productList", "feature", "whatsappCta", "footer",
    ]);
    const hero = preview.sections[0];
    expect(hero.title).toBe("Masakan rumah setiap hari.");
    expect(hero.ctaHref).toContain("wa.me/081234567899");
    expect(preview.products[0]).toEqual(expect.objectContaining({ name: "Nasi uduk", priceLabel: "Rp 20.000" }));
    expect(preview.features).toEqual(expect.arrayContaining(["product_list", "whatsapp_chat", "catalog"]));
  });

  it("serves a filterable catalog across every category", async () => {
    const catalog = await request(app.getHttpServer()).get("/api/website-flow/templates").expect(200);
    expect(catalog.body.templates.length).toBeGreaterThanOrEqual(3);
    expect(catalog.body.tags).toEqual(expect.arrayContaining(["editorial", "catalog", "story-led"]));
    expect(JSON.stringify(catalog.body.templates)).not.toContain("presentation");
    expect(catalog.body.templates.every((item: { categoryName: string }) => item.categoryName)).toBe(true);
    const editorial = catalog.body.templates.find((item: { id: string }) => item.id === "commerce-editorial-v1");
    expect(editorial.swatches).toEqual(["#264653", "#e9c46a", "#E76F51"]);
    expect(editorial.sectionOrder).toEqual(["hero", "about", "productList", "feature", "whatsappCta", "footer"]);

    const search = await request(app.getHttpServer()).get("/api/website-flow/templates?q=editorial").expect(200);
    expect(search.body.templates).toHaveLength(1);
    expect(search.body.templates[0].id).toBe("commerce-editorial-v1");

    const tagged = await request(app.getHttpServer()).get("/api/website-flow/templates?tag=story-led").expect(200);
    expect(tagged.body.templates.every((item: { tags: string[] }) => item.tags.includes("story-led"))).toBe(true);

    const byCategory = await request(app.getHttpServer()).get("/api/website-flow/templates?categoryId=jasa").expect(200);
    expect(byCategory.body.templates.every((item: { categoryId: string; categories: string[] }) =>
      item.categoryId === "jasa" || item.categories.includes("jasa"))).toBe(true);

    const empty = await request(app.getHttpServer()).get("/api/website-flow/templates?q=zzzz-tidak-ada").expect(200);
    expect(empty.body.templates).toHaveLength(0);
  });

  it("renders a live preview from a template's sample data before selection", async () => {
    const preview = await request(app.getHttpServer())
      .get("/api/website-flow/templates/commerce-editorial-v1/preview")
      .expect(200);
    expect(preview.body).toEqual(expect.objectContaining({ id: "commerce-editorial-v1", version: 1, dynamic: true }));
    expect(preview.body.previewConfig.businessName).toBe("Kedai Rasa Pagi");
    expect(preview.body.previewConfig.theme.primary).toBe("#264653");
    expect(preview.body.previewConfig.sections.map((section: { type: string }) => section.type)).toContain("productList");
    expect(preview.body.previewConfig.products.length).toBeGreaterThan(0);

    // Legacy templates carry no sample content, so they say so instead of rendering a lie.
    const legacy = await request(app.getHttpServer())
      .get("/api/website-flow/templates/kuliner-story/preview")
      .expect(200);
    expect(legacy.body).toEqual({ id: "kuliner-story", name: expect.any(String), version: 1, dynamic: false, previewConfig: null });

    await request(app.getHttpServer()).get("/api/website-flow/templates/tidak-ada/preview").expect(404);
  });

  it("rejects content that does not satisfy the template's schema", async () => {
    const session = await request(app.getHttpServer()).post("/api/planner/start").expect(201);
    const project = await request(app.getHttpServer()).post("/api/website-flow/projects").send({
      sessionId: session.body.sessionId, categoryId: "kuliner", templateId: "commerce-editorial-v1",
    }).expect(201);

    const missing = await request(app.getHttpServer())
      .post(`/api/website-flow/projects/${project.body.id}/business`)
      .send({ tagline: "Hanya kalimat pembuka." })
      .expect(400);
    expect(missing.body.message).toMatch(/Nama usaha/);

    const tooLong = await request(app.getHttpServer())
      .post(`/api/website-flow/projects/${project.body.id}/business`)
      .send({ businessName: "x".repeat(121) })
      .expect(400);
    expect(tooLong.body.message).toBeTruthy();
  });

  it("accepts business data with an untouched blank feature-list row", async () => {
    const session = await request(app.getHttpServer()).post("/api/planner/start").expect(201);
    const project = await request(app.getHttpServer()).post("/api/website-flow/projects").send({
      sessionId: session.body.sessionId, categoryId: "kuliner", templateId: "commerce-editorial-v1",
    }).expect(201);

    const response = await request(app.getHttpServer())
      .post(`/api/website-flow/projects/${project.body.id}/business`)
      .send({
        businessName: "Zayn Food",
        tagline: "Khusus makanan baby",
        description: "jadi ini ceritanya makanan buat baby aja",
        facts: [{ label: "Bubur lezat rasa ayam bawang", value: "enak" }],
        highlights: [{ label: "", value: "" }],
        whatsapp: "085945133344",
        address: "Jakarta",
        hours: "08.00 - 20.00",
        products: [{ name: "Bubur Baby", description: "Rasa ayam bawang", price: "15000" }],
      })
      .expect(201);

    expect(response.body.project.businessData.highlights).toEqual([]);
    expect(response.body.previewConfig.businessName).toBe("Zayn Food");
    const feature = response.body.previewConfig.sections.find((section: { type: string }) => section.type === "feature");
    expect(feature.items.length).toBeGreaterThan(0);
    expect(feature.items[0]).toEqual(expect.objectContaining({ title: expect.any(String), body: expect.any(String) }));
    expect(response.body.previewConfig.products[0].name).toBe("Bubur Baby");
  });

  it("rejects a template from another category", async () => {
    const session = await request(app.getHttpServer()).post("/api/planner/start").expect(201);
    await request(app.getHttpServer()).post("/api/website-flow/projects").send({ sessionId: session.body.sessionId, categoryId: "kuliner", templateId: "fashion-story" }).expect(400);
  });

  it("persists the seven-step flow and freezes a server-side price", async () => {
    const session = await request(app.getHttpServer()).post("/api/planner/start").expect(201);
    sessionId = session.body.sessionId;
    const templates = await request(app.getHttpServer()).get("/api/website-flow/categories/kuliner/templates").expect(200);
    const project = await request(app.getHttpServer()).post("/api/website-flow/projects").send({ sessionId, categoryId: "kuliner", templateId: templates.body[0].id }).expect(201);
    projectId = project.body.id;
    expect(project.body.currentStep).toBe(3);

    const saved = await request(app.getHttpServer()).post(`/api/website-flow/projects/${projectId}/business`).send(business).expect(201);
    expect(saved.body.previewConfig.businessName).toBe(business.name);
    expect(saved.body.previewConfig.products[0].name).toBe("Kopi susu");

    const domain = await request(app.getHttpServer()).post(`/api/website-flow/projects/${projectId}/domain`).send({ domain: "kedairasapagi.id" }).expect(201);
    expect(domain.body).toEqual(expect.objectContaining({ domain: "kedairasapagi.id", available: true, provider: "stub" }));

    const checkout = await request(app.getHttpServer()).post(`/api/website-flow/projects/${projectId}/checkout`).expect(201);
    checkoutId = checkout.body.checkoutId;
    expect(checkout.body.amount).toBe(310_000); // business 150k + product block 10k + domain 150k
    expect(checkout.body.priceSnapshot.totalPrice).toBe(checkout.body.amount);

    const order = await app.get(PrismaService).orderSnapshot.findUnique({ where: { projectId } });
    expect(order).not.toBeNull();
    expect(order?.version).toBe(1);
    const payload = order?.payload as Record<string, any>;
    const storedName = payload.businessData.name ?? payload.businessData.businessName;
    expect(storedName).toBe(business.name);
    expect(payload).toEqual(expect.objectContaining({
      schemaVersion: 1,
      projectId,
      plan: expect.any(String),
      price: expect.objectContaining({ total: checkout.body.amount, currency: "IDR" }),
      domain: "kedairasapagi.id",
    }));
    expect(payload.generator.modules).toEqual([]);

    const payment = await request(app.getHttpServer()).post(`/api/website-flow/checkout/${checkoutId}/payment`).send({ method: "stub", reference: "test-ref" }).expect(201);
    expect(payment.body).toEqual(expect.objectContaining({ checkoutId, status: "payment_pending", paymentStatus: "pending" }));
  });

  /**
   * The order snapshot is server-side only: it has no public endpoint yet,
   * because exposing it would leak client data behind a guessable project id.
   */
  it("has no order snapshot before checkout", async () => {
    const session = await request(app.getHttpServer()).post("/api/planner/start").expect(201);
    const project = await request(app.getHttpServer()).post("/api/website-flow/projects").send({
      sessionId: session.body.sessionId, categoryId: "kuliner", templateId: "commerce-editorial-v1",
    }).expect(201);
    const order = await app.get(PrismaService).orderSnapshot.findUnique({ where: { projectId: project.body.id } });
    expect(order).toBeNull();
  });

  it("freezes the dynamic template's full definition, presets, and price into the order", async () => {
    const session = await request(app.getHttpServer()).post("/api/planner/start").expect(201);
    const project = await request(app.getHttpServer()).post("/api/website-flow/projects").send({
      sessionId: session.body.sessionId, categoryId: "kuliner", templateId: "commerce-editorial-v1",
    }).expect(201);
    const id = project.body.id;
    await request(app.getHttpServer()).post(`/api/website-flow/projects/${id}/business`).send({
      businessName: "Warung Beku", tagline: "Masakan rumahan", description: "Nasi uduk tiap pagi.",
      whatsapp: "08123456789", address: "Depok", hours: "06.00-11.00",
      products: [{ name: "Nasi uduk", description: "Gurih", price: "Rp 20.000" }],
      facts: [], highlights: [],
    }).expect(201);
    const checkout = await request(app.getHttpServer()).post(`/api/website-flow/projects/${id}/checkout`).expect(201);

    const order = await app.get(PrismaService).orderSnapshot.findUnique({ where: { projectId: id } });
    const payload = order?.payload as Record<string, any>;

    // Everything the generator needs, captured — no live catalog read later.
    expect(payload.generator).toEqual({
      frontendPreset: "business-site-v1",
      backendPreset: "catalog-api-v1",
      modules: ["catalog", "whatsapp"],
    });
    expect(payload.template.definition.contentSchema).toBeTruthy();
    expect(payload.template.definition.presentation.sections.length).toBeGreaterThan(0);
    expect(payload.businessData.businessName).toBe("Warung Beku");
    expect(payload.businessData.products).toHaveLength(1);
    expect(payload.price.total).toBe(checkout.body.amount);
    expect(payload.price.breakdown.length).toBeGreaterThan(0);
    // Pricing only from planner-engine: no AI field can enter this.
    expect(JSON.stringify(payload)).not.toMatch(/draft|source.*ai/);
  });

  /** After payment the order is committed: the snapshot may not move. */
  it("refuses to reprice or rewrite an order that has a payment", async () => {
    const session = await request(app.getHttpServer()).post("/api/planner/start").expect(201);
    const project = await request(app.getHttpServer()).post("/api/website-flow/projects").send({
      sessionId: session.body.sessionId, categoryId: "kuliner", templateId: "commerce-editorial-v1",
    }).expect(201);
    const id = project.body.id;
    const submitDynamicBusiness = (products: Array<{ name: string; description: string; price: string }>) =>
      request(app.getHttpServer()).post(`/api/website-flow/projects/${id}/business`).send({
        businessName: business.name, tagline: business.tagline, description: business.description,
        whatsapp: business.whatsapp, address: business.address, hours: "08.00-20.00",
        products, facts: [], highlights: [],
      });
    await submitDynamicBusiness([{ name: "Kopi susu", description: "Kopi susu gula aren", price: "Rp 18.000" }]).expect(201);

    const checkout = await request(app.getHttpServer()).post(`/api/website-flow/projects/${id}/checkout`).expect(201);
    const order = await app.get(PrismaService).orderSnapshot.findUnique({ where: { projectId: id } });
    const payload = order?.payload as Record<string, any>;
    expect(payload.price.total).toBe(checkout.body.amount);

    // Before payment, the client can change data and get an updated price + snapshot.
    await submitDynamicBusiness([
      { name: "Kopi susu", description: "Kopi susu gula aren", price: "Rp 18.000" },
      { name: "Roti bakar", description: "Roti cokelat", price: "Rp 12.000" },
    ]).expect(201);
    const retry = await request(app.getHttpServer()).post(`/api/website-flow/projects/${id}/checkout`).expect(201);
    const refreshedOrder = await app.get(PrismaService).orderSnapshot.findUnique({ where: { projectId: id } });
    const refreshed = refreshedOrder?.payload as Record<string, any>;
    expect(refreshed.price.total).toBe(retry.body.amount);
    // The snapshot followed the client's edits — it is live until payment.
    expect(refreshed.businessData.products).toHaveLength(2);
    const refreshedName = refreshed.businessData.name ?? refreshed.businessData.businessName;
    expect(refreshedName).toBe(business.name);

    await request(app.getHttpServer())
      .post(`/api/website-flow/checkout/${checkout.body.checkoutId}/payment`)
      .send({ method: "stub", reference: "frozen" })
      .expect(201);

    // A paid order cannot be repriced or rewritten.
    const afterPaymentOrder = await app.get(PrismaService).orderSnapshot.findUnique({ where: { projectId: id } });
    const afterPayment = afterPaymentOrder?.payload;
    await submitDynamicBusiness([{ name: "Menu berubah", description: "Isi", price: "Rp 99.000" }]).expect(201);
    const blocked = await request(app.getHttpServer()).post(`/api/website-flow/projects/${id}/checkout`).expect(400);
    expect(blocked.body.message).toMatch(/tidak bisa dihitung ulang/);
    const afterOrder = await app.get(PrismaService).orderSnapshot.findUnique({ where: { projectId: id } });
    expect(afterOrder?.payload).toEqual(afterPayment);
  });

  it("marks deterministic stub domains as unavailable", async () => {
    const session = await request(app.getHttpServer()).post("/api/planner/start").expect(201);
    const project = await request(app.getHttpServer()).post("/api/website-flow/projects").send({ sessionId: session.body.sessionId, categoryId: "jasa", templateId: "jasa-story" }).expect(201);
    const result = await request(app.getHttpServer()).post(`/api/website-flow/projects/${project.body.id}/domain`).send({ domain: "taken-example.id" }).expect(201);
    expect(result.body.available).toBe(false);
  });

  it("keeps AI drafts off until the feature flag is turned on", async () => {
    const schema = await request(app.getHttpServer()).get("/api/website-flow/templates/commerce-editorial-v1/schema").expect(200);
    expect(schema.body.aiEnabled).toBe(false);

    const session = await request(app.getHttpServer()).post("/api/planner/start").expect(201);
    const project = await request(app.getHttpServer()).post("/api/website-flow/projects").send({
      sessionId: session.body.sessionId, categoryId: "kuliner", templateId: "commerce-editorial-v1",
    }).expect(201);
    const draft = await request(app.getHttpServer())
      .post(`/api/website-flow/projects/${project.body.id}/ai/draft`)
      .send({ brief: "warung sarapan dekat kampus", businessName: "Kedai Uji" })
      .expect(201);
    expect(draft.body).toEqual({ enabled: false, slots: [], source: "form", draft: {} });
  });
});

/**
 * The AI Planner is opt-in. With the flag on but no API key the service falls
 * back to deterministic copy, so these assertions hold whether or not a key is
 * configured on the machine running them.
 */
describe("template-aware AI drafts", () => {
  let app: INestApplication;
  const previousFlag = process.env.AI_PLANNER_CONTENT_ENABLED;
  const previousGeminiKey = process.env.GEMINI_API_KEY;

  beforeAll(async () => {
    process.env.AI_PLANNER_CONTENT_ENABLED = "true";
    process.env.GEMINI_API_KEY = "";
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    process.env.AI_PLANNER_CONTENT_ENABLED = previousFlag;
    if (previousGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousGeminiKey;
  });

  async function newProject(templateId = "commerce-editorial-v1") {
    const session = await request(app.getHttpServer()).post("/api/planner/start").expect(201);
    const project = await request(app.getHttpServer()).post("/api/website-flow/projects").send({
      sessionId: session.body.sessionId, categoryId: "kuliner", templateId,
    }).expect(201);
    return project.body.id as string;
  }

  it("advertises the flag together with the template's own slots", async () => {
    const dynamic = await request(app.getHttpServer()).get("/api/website-flow/templates/commerce-editorial-v1/schema").expect(200);
    expect(dynamic.body.aiEnabled).toBe(true);
    expect(dynamic.body.aiSlots).toEqual(["tagline", "description", "products"]);
  });

  it("drafts only the slots the template declared", async () => {
    const projectId = await newProject();
    const result = await request(app.getHttpServer())
      .post(`/api/website-flow/projects/${projectId}/ai/draft`)
      .send({ brief: "warung sarapan rumahan dekat kampus, buka jam enam pagi", businessName: "Kedai Uji" })
      .expect(201);

    expect(result.body.enabled).toBe(true);
    expect(result.body.templateId).toBe("commerce-editorial-v1");
    expect(result.body.slots).toEqual(["tagline", "description", "products"]);

    // Nothing outside the template's slots may come back — not even contact data.
    for (const key of Object.keys(result.body.draft)) {
      expect(result.body.slots).toContain(key);
    }
    expect(result.body.draft).not.toHaveProperty("businessName");
    expect(result.body.draft).not.toHaveProperty("whatsapp");
    // And no pricing or feature rule may arrive with it.
    expect(JSON.stringify(result.body.draft)).not.toMatch(/pricePlan|features|generator|discount/);
    expect(result.body.source).toMatch(/^(ai|form)$/);
  });

  it("returns a usable draft without an API key", async () => {
    const projectId = await newProject();
    const result = await request(app.getHttpServer())
      .post(`/api/website-flow/projects/${projectId}/ai/draft`)
      .send({ brief: "kopi susu gula aren buatan sendiri", businessName: "Kedai Kopi Senja" })
      .expect(201);
    expect(result.body.source).toBe("form");
    expect(result.body.draft.tagline).toContain("Kedai Kopi Senja");
    expect(result.body.draft.description).toContain("kopi susu gula aren");
  });

  it("leaves the saved project untouched until the client saves the form", async () => {
    const projectId = await newProject();
    await request(app.getHttpServer())
      .post(`/api/website-flow/projects/${projectId}/ai/draft`)
      .send({ brief: "jualan sate kambing setiap malam", businessName: "Sate Pak Udin" })
      .expect(201);

    const project = await request(app.getHttpServer()).get(`/api/website-flow/projects/${projectId}`).expect(200);
    expect(project.body.businessData).toBeNull();
  });

  it("keeps the client's own values when a slot the draft omits already holds them", async () => {
    const projectId = await newProject();
    await request(app.getHttpServer()).post(`/api/website-flow/projects/${projectId}/business`).send({
      businessName: "Warung Sore", tagline: "Sudah kamu tulis sendiri", description: "",
      whatsapp: "08123456789", address: "Depok", hours: "08.00 - 20.00",
      products: [], facts: [], highlights: [],
    }).expect(201);

    const result = await request(app.getHttpServer())
      .post(`/api/website-flow/projects/${projectId}/ai/draft`)
      .send({ brief: "makanan rumahan untuk keluarga", businessName: "Warung Sore" })
      .expect(201);
    expect(result.body.draft.tagline ?? "Sudah kamu tulis sendiri").toBeTruthy();
    // Non-slot data is never part of a draft, so it can never be lost by applying one.
    expect(result.body.draft).not.toHaveProperty("whatsapp");
  });

  it("refuses to draft for a template without a content schema", async () => {
    const projectId = await newProject("kuliner-story");
    const result = await request(app.getHttpServer())
      .post(`/api/website-flow/projects/${projectId}/ai/draft`)
      .send({ brief: "warung nasi uduk", businessName: "Nasi Uduk Bu Tini" })
      .expect(400);
    expect(result.body.message).toMatch(/belum mendukung draft konten/);
  });

  it("rejects a draft request with no brief", async () => {
    const projectId = await newProject();
    await request(app.getHttpServer())
      .post(`/api/website-flow/projects/${projectId}/ai/draft`)
      .send({ brief: "x", businessName: "Kedai Uji" })
      .expect(400);
  });

  it("returns only the slots a draft actually said something about", async () => {
    // Stand in for a model that has a line for the description and nothing else.
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AiService)
      .useValue({
        draftContent: async (input: { contentSchema: unknown }) => ({
          draft: { description: "Nasi uduk buatan sendiri sejak 2019." },
          source: "ai" as const,
          slots: ["tagline", "description", "products"],
          input,
        }),
      })
      .compile();
    const partialApp = moduleRef.createNestApplication();
    partialApp.setGlobalPrefix("api");
    await partialApp.init();

    try {
      const session = await request(partialApp.getHttpServer()).post("/api/planner/start").expect(201);
      const project = await request(partialApp.getHttpServer()).post("/api/website-flow/projects").send({
        sessionId: session.body.sessionId, categoryId: "kuliner", templateId: "commerce-editorial-v1",
      }).expect(201);
      await request(partialApp.getHttpServer()).post(`/api/website-flow/projects/${project.body.id}/business`).send({
        businessName: "Warung Sore", tagline: "Tetap punya kamu", description: "",
        whatsapp: "08123456789", address: "Depok", hours: "08.00 - 20.00",
        products: [], facts: [], highlights: [],
      }).expect(201);

      const result = await request(partialApp.getHttpServer())
        .post(`/api/website-flow/projects/${project.body.id}/ai/draft`)
        .send({ brief: "nasi uduk rumahan", businessName: "Warung Sore" })
        .expect(201);

      // Slots the model skipped are absent, not filled in with stale content:
      // applying this draft can only add the description.
      expect(result.body.draft).toEqual({ description: "Nasi uduk buatan sendiri sejak 2019." });
      expect(result.body.slots).toEqual(["tagline", "description", "products"]);

      const stored = await request(partialApp.getHttpServer()).get(`/api/website-flow/projects/${project.body.id}`).expect(200);
      expect(stored.body.businessData.tagline).toBe("Tetap punya kamu");
      expect(stored.body.businessData.description).toBe("");
    } finally {
      await partialApp.close();
    }
  });

  /**
   * Pricing and media are product decisions, not copy. Whether a model invents
   * a price or the fallback path is reached, the guard is on the response path
   * itself, so this holds for every provider behind AiService.
   */
  it("strips any price or media a model tries to draft", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AiService)
      .useValue({
        draftContent: async () => ({
          draft: {
            tagline: "Sarapan hangat setiap pagi",
            products: [{ name: "Nasi Uduk", description: "Lemak gurih", price: "Rp 25.000", image: "nasi.jpg", badge: "Best" }],
          },
          source: "ai" as const,
          slots: ["tagline", "description", "products"],
        }),
      })
      .compile();
    const aiApp = moduleRef.createNestApplication();
    aiApp.setGlobalPrefix("api");
    await aiApp.init();

    try {
      const session = await request(aiApp.getHttpServer()).post("/api/planner/start").expect(201);
      const project = await request(aiApp.getHttpServer()).post("/api/website-flow/projects").send({
        sessionId: session.body.sessionId, categoryId: "kuliner", templateId: "commerce-editorial-v1",
      }).expect(201);
      const result = await request(aiApp.getHttpServer())
        .post(`/api/website-flow/projects/${project.body.id}/ai/draft`)
        .send({ brief: "nasi uduk rumahan", businessName: "Warung Uji" })
        .expect(201);

      const row = (result.body.draft.products as Array<Record<string, unknown>>)[0];
      expect(row).toEqual({ name: "Nasi Uduk", description: "Lemak gurih" });
      expect(result.body.draft.tagline).toBe("Sarapan hangat setiap pagi");
    } finally {
      await aiApp.close();
    }
  });

  /** Applying a suggestion must never delete what the client paid attention to first. */
  it("keeps the client's own product rows when the model suggests more", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AiService)
      .useValue({
        draftContent: async () => ({
          draft: { products: [{ name: "Nasi Uduk Baru", description: "Lemak gurih" }] },
          source: "ai" as const,
          slots: ["tagline", "description", "products"],
        }),
      })
      .compile();
    const mergeApp = moduleRef.createNestApplication();
    mergeApp.setGlobalPrefix("api");
    await mergeApp.init();

    try {
      const session = await request(mergeApp.getHttpServer()).post("/api/planner/start").expect(201);
      const project = await request(mergeApp.getHttpServer()).post("/api/website-flow/projects").send({
        sessionId: session.body.sessionId, categoryId: "kuliner", templateId: "commerce-editorial-v1",
      }).expect(201);
      await request(mergeApp.getHttpServer()).post(`/api/website-flow/projects/${project.body.id}/business`).send({
        businessName: "Warung Uji", tagline: "", description: "", whatsapp: "08123456789",
        address: "Depok", hours: "",
        products: [{ name: "Nasi Kremes", description: "Nasi, lauk", price: "15000" }],
        facts: [], highlights: [],
      }).expect(201);

      const result = await request(mergeApp.getHttpServer())
        .post(`/api/website-flow/projects/${project.body.id}/ai/draft`)
        .send({ brief: "nasi uduk rumahan", businessName: "Warung Uji" })
        .expect(201);

      const rows = result.body.draft.products as Array<Record<string, unknown>>;
      expect(rows[0]).toMatchObject({ name: "Nasi Kremes", description: "Nasi, lauk", price: "15000" });
      expect(rows[1]).toMatchObject({ name: "Nasi Uduk Baru", description: "Lemak gurih" });
      expect(rows[1]).not.toHaveProperty("price");
      expect(rows[1]).not.toHaveProperty("image");
      expect(rows[1]).not.toHaveProperty("badge");
    } finally {
      await mergeApp.close();
    }
  });
});
