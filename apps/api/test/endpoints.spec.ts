import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("API endpoints", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  it("POST /api/planner/start returns sessionId", async () => {
    const res = await request(app.getHttpServer()).post("/api/planner/start").expect(201);
    expect(res.body).toHaveProperty("sessionId");
  });

  it("POST /api/planner/answer validates with Zod error shape", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/planner/answer")
      .send({ sessionId: "not-a-uuid", step: "", payload: {} })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors[0]).toHaveProperty("field");
    expect(res.body.errors[0]).toHaveProperty("message");
  });

  it("POST /api/planner/finish requires sessionId", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/planner/finish")
      .send({ lead: { whatsapp: "628123456789" } })
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/planner/report/:id returns 404 for unknown id", async () => {
    await request(app.getHttpServer()).get("/api/planner/report/00000000-0000-0000-0000-000000000000").expect(404);
  });

  it("old routes are gone (404)", async () => {
    await request(app.getHttpServer()).post("/api/planner/sessions").expect(404);
    await request(app.getHttpServer()).post("/planner/sessions").expect(404);
    await request(app.getHttpServer()).post("/api/planner/reports/x/lead").expect(404);
    await request(app.getHttpServer()).post("/planner/reports/x/lead").expect(404);
  });

  it("GET /api/features exposes safe catalog without prices", async () => {
    const res = await request(app.getHttpServer()).get("/api/features").expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    const first = res.body[0];
    expect(first).toEqual(expect.objectContaining({ id: expect.any(String), name: expect.any(String), description: expect.any(String), category: expect.any(String), availability: expect.any(Object), constraints: expect.any(Object) }));
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain("unitPrice");
    expect(serialized).not.toContain("PLAN_BASE_PRICE");
    for (const item of res.body) {
      expect(item.price).toBeUndefined();
      expect(item.unitPrice).toBeUndefined();
    }
  });
});
