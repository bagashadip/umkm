import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PlannerService } from "../src/planner/planner.service";
import { PrismaService } from "../src/prisma/prisma.service";

const ANSWERS = {
  businessType: "retail", productCount: 10, transactionMethod: "manual_payment",
  needsSeo: true, needsWhatsapp: true, needsOwnDomain: true,
  needsProductVariants: false, needsOrderTracking: false, plan: "trial",
};

function mockPrisma(overrides: Record<string, unknown> = {}) {
  const base: any = {
    plannerSession: { findUnique: jest.fn().mockResolvedValue({ id: "s" }), create: jest.fn().mockResolvedValue({ id: "s" }) },
    plannerAnswer: {
      upsert: jest.fn().mockResolvedValue({ id: "a" }),
      findMany: jest.fn().mockResolvedValue([{ payload: ANSWERS, updatedAt: new Date() }]),
    },
    plannerReport: { create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: "r1", totalPrice: data.totalPrice, ...data, createdAt: new Date() })),
      findUnique: jest.fn() },
    lead: { upsert: jest.fn() },
    ...overrides,
  };
  if (!base.$transaction) base.$transaction = (fn: (tx: any) => Promise<unknown>) => fn(base);
  return base as unknown as PrismaService;
}

describe("PlannerService", () => {
  it("creates a session returning sessionId", async () => {
    const service = new PlannerService(mockPrisma());
    await expect(service.start()).resolves.toEqual({ sessionId: "s" });
  });

  it("upserts an answer for a step", async () => {
    const prisma = mockPrisma();
    const service = new PlannerService(prisma);
    await service.answer({ sessionId: "s", step: "step-1", payload: { businessType: "retail" } });
    expect(prisma.plannerAnswer.upsert).toHaveBeenCalledTimes(1);
  });

  it("rejects unknown session", async () => {
    const prisma = mockPrisma({ plannerSession: { findUnique: jest.fn().mockResolvedValue(null) } });
    await expect(new PlannerService(prisma).answer({ sessionId: "x", step: "a", payload: {} })).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects invalid complete payload with Zod error shape", async () => {
    const service = new PlannerService(mockPrisma());
    const err = await service.answer({ sessionId: "s", step: "a", payload: { ...ANSWERS, productCount: -1 } })
      .catch((e) => e);
    expect(err).toBeInstanceOf(BadRequestException);
    const resp = err.getResponse();
    expect(resp.success).toBe(false);
    expect(resp.errors[0]).toHaveProperty("field");
    expect(resp.errors[0]).toHaveProperty("message");
  });

  it("finish without lead succeeds with leadId null", async () => {
    const prisma = mockPrisma();
    const out = await new PlannerService(prisma).finish({ sessionId: "s" });
    expect(prisma.lead.upsert).not.toHaveBeenCalled();
    expect(out.reportId).toBe("r1");
    expect(out.snapshot).toHaveProperty("rawAnswers");
    expect(out.snapshot).toHaveProperty("normalizedAnswers");
    expect(out.snapshot).toHaveProperty("selectedFeatures");
    expect(out.snapshot).toHaveProperty("excludedFeatures");
    expect(out.snapshot).toHaveProperty("priceBreakdown");
    expect(out.snapshot).toHaveProperty("prototypeConfig");
    expect(typeof out.total).toBe("number");
    expect(out.pricingVersion).toBeGreaterThan(0);
    expect((prisma as any).plannerReport.create.mock.calls[0][0].data.leadId).toBeNull();
  });

  it("finish with lead normalizes whatsapp and dedupes", async () => {
    const prisma = mockPrisma({
      lead: { upsert: jest.fn().mockResolvedValue({ id: "lead-1", whatsapp: "628123456789" }) },
    });
    const service = new PlannerService(prisma);
    await service.finish({ sessionId: "s", lead: { whatsapp: "0812-3456-789", name: "Budi", business: "Warung Kopi" } });
    expect(prisma.lead.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { whatsapp: "628123456789" } }));
    expect((prisma as any).plannerReport.create.mock.calls[0][0].data.leadId).toBe("lead-1");
    await service.finish({ sessionId: "s", lead: { whatsapp: "+62 812 3456 789", name: "Budi", business: "Warung Kopi" } });
    expect(prisma.lead.upsert).toHaveBeenCalledTimes(2);
    expect(new Set((prisma as any).lead.upsert.mock.calls.map((c: unknown[]) => (c[0] as any).where.whatsapp)).size).toBe(1);
  });

  it("rejects invalid whatsapp before creating report", async () => {
    const prisma = mockPrisma();
    await expect(new PlannerService(prisma).finish({ sessionId: "s", lead: { whatsapp: "nope" } }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.plannerReport.create).not.toHaveBeenCalled();
  });

  it("returns 404 for unknown report", async () => {
    const prisma = mockPrisma({ plannerReport: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn() } });
    await expect(new PlannerService(prisma).getReport("missing")).rejects.toBeInstanceOf(NotFoundException);
  });
});
