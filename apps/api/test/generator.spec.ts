import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { GeneratorService } from "../src/generator/generator.service";
import { PrismaService } from "../src/prisma/prisma.service";

const business = {
  businessName: "Warung Beku",
  tagline: "Nasi uduk tiap pagi",
  description: "Masakan rumahan dekat stasiun.",
  whatsapp: "08123456789",
  address: "Depok",
  hours: "06.00-11.00",
  products: [
    { name: "Nasi uduk", description: "Gurih dan hangat", price: "Rp 20.000" },
    { name: "Bubur ayam", description: "Kuah kaldu ayam", price: "Rp 15.000" },
  ],
  facts: [{ label: "Melayani sejak", value: "2018" }],
  highlights: [{ title: "Dimasak pagi", body: "Tidak disimpan semalaman." }],
};

/**
 * The generator is a service, not an endpoint: an order build plan carries the
 * client's full business data, so it waits for an authenticated provisioning
 * path rather than shipping behind a guessable project id.
 */
describe("Order generator", () => {
  let app: INestApplication;
  let generator: GeneratorService;
  let prisma: PrismaService;
  const previousFlag = process.env.AI_PLANNER_CONTENT_ENABLED;
  const previousGeminiKey = process.env.GEMINI_API_KEY;

  beforeAll(async () => {
    process.env.AI_PLANNER_CONTENT_ENABLED = "";
    process.env.GEMINI_API_KEY = "";
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
    generator = app.get(GeneratorService);
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
    process.env.AI_PLANNER_CONTENT_ENABLED = previousFlag;
    if (previousGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousGeminiKey;
  });

  /** Checkout the dynamic template so the order snapshot exists. */
  async function orderedProject() {
    const session = await request(app.getHttpServer()).post("/api/planner/start").expect(201);
    const project = await request(app.getHttpServer()).post("/api/website-flow/projects").send({
      sessionId: session.body.sessionId, categoryId: "kuliner", templateId: "commerce-editorial-v1",
    }).expect(201);
    await request(app.getHttpServer()).post(`/api/website-flow/projects/${project.body.id}/business`).send(business).expect(201);
    const checkout = await request(app.getHttpServer()).post(`/api/website-flow/projects/${project.body.id}/checkout`).expect(201);
    return { projectId: project.body.id as string, amount: checkout.body.amount as number };
  }

  it("refuses to build before an order exists", async () => {
    const session = await request(app.getHttpServer()).post("/api/planner/start").expect(201);
    const project = await request(app.getHttpServer()).post("/api/website-flow/projects").send({
      sessionId: session.body.sessionId, categoryId: "kuliner", templateId: "commerce-editorial-v1",
    }).expect(201);
    await expect(generator.buildPlan(project.body.id)).rejects.toMatchObject({ status: 404 });
  });

  it("builds a plan from the frozen order alone", async () => {
    const { projectId, amount } = await orderedProject();
    const plan = await generator.buildPlan(projectId);

    expect(plan.projectId).toBe(projectId);
    expect(plan.template).toEqual({ id: "commerce-editorial-v1", version: 1, legacy: false });
    expect(plan.plan).toBe("business");
    expect(plan.price.total).toBe(amount);
    expect(plan.domain).toBeNull();

    // Frontend preset + the render config the client site will ship.
    expect(plan.frontend.preset).toBe("business-site-v1");
    expect(plan.frontend.config?.businessName).toBe("Warung Beku");
    expect(plan.frontend.config?.products).toHaveLength(2);
    expect(plan.frontend.config?.theme.primary).toBe("#264653");
    // Module-driven sections: catalog and whatsapp sections only.
    expect(plan.frontend.sections).toEqual(expect.arrayContaining(["selection", "conversation"]));

    expect(plan.backend).toEqual({
      preset: "catalog-api-v1",
      modules: ["catalog", "whatsapp"],
      products: [
        { id: "product-1", name: "Nasi uduk", description: "Gurih dan hangat" },
        { id: "product-2", name: "Bubur ayam", description: "Kuah kaldu ayam" },
      ],
    });
    expect(plan.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic: same order, same hash", async () => {
    const { projectId } = await orderedProject();
    const first = await generator.buildPlan(projectId);
    const second = await generator.buildPlan(projectId);
    expect(second.hash).toBe(first.hash);
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });

  /**
   * The generator's whole reason for existing: a catalog edit after checkout
   * must not change what the client bought.
   */
  it("ignores later catalog changes to the template", async () => {
    const { projectId } = await orderedProject();
    const before = await generator.buildPlan(projectId);

    const row = await prisma.websiteTemplate.findUnique({ where: { id: "commerce-editorial-v1" } });
    const originalConfig = JSON.parse(JSON.stringify(row?.config)) as Record<string, any>;
    const originalFeatures = JSON.parse(JSON.stringify(row?.features)) as string[];
    const edited = JSON.parse(JSON.stringify(originalConfig));
    edited.presentation.theme.primary = "#ff00ff";
    edited.presentation.sections = edited.presentation.sections.filter((section: { key: string }) => section.key !== "closing");
    await prisma.websiteTemplate.update({ where: { id: "commerce-editorial-v1" }, data: { config: edited, features: ["landing_page"] } });

    try {
      const after = await generator.buildPlan(projectId);
      expect(after.hash).toBe(before.hash);
      expect(after.frontend.config?.theme.primary).toBe("#264653");
      expect(after.backend.modules).toEqual(["catalog", "whatsapp"]);
    } finally {
      await prisma.websiteTemplate.update({ where: { id: "commerce-editorial-v1" }, data: { config: originalConfig, features: originalFeatures } });
    }

    const restored = await generator.buildPlan(projectId);
    expect(restored.hash).toBe(before.hash);
  });

  it("carries the chosen domain into the plan", async () => {
    const { projectId } = await orderedProject();
    await request(app.getHttpServer()).post(`/api/website-flow/projects/${projectId}/domain`).send({ domain: "warungbeku.id" }).expect(201);
    const checkout = await request(app.getHttpServer()).post(`/api/website-flow/projects/${projectId}/checkout`).expect(201);
    const plan = await generator.buildPlan(projectId);
    expect(plan.domain).toBe("warungbeku.id");
    expect(plan.price.total).toBe(checkout.body.amount);
    expect(plan.price.breakdown.length).toBeGreaterThan(0);
  });
});
