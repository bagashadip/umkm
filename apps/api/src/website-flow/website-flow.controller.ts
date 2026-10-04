import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { WebsiteFlowService } from "./website-flow.service";

const categoryIdSchema = z.string().min(1);
const catalogQuerySchema = z.object({
  q: z.string().max(120).optional(),
  tag: z.string().max(40).optional(),
  categoryId: z.string().max(60).optional(),
  sort: z.enum(["curated", "name"]).optional(),
});

const createProjectSchema = z.object({
  sessionId: z.uuid(),
  categoryId: z.string().min(1),
  templateId: z.string().min(1),
});

/**
 * Only the structural guard here — each template defines its own content schema,
 * so the service validates the payload against the selected template's fields.
 */
const businessSchema = z.record(z.string().min(1).max(60), z.unknown());

const domainSchema = z.object({ domain: z.string().min(3).max(253) });

const paymentSchema = z.object({
  method: z.enum(["bank_transfer", "manual", "stub"]),
  reference: z.string().max(120).optional(),
});

const suggestionSchema = z.object({
  brief: z.string().min(3).max(1500),
  businessName: z.string().min(2).max(120),
});

@Controller("website-flow")
export class WebsiteFlowController {
  constructor(private readonly flow: WebsiteFlowService) {}

  @Get("categories")
  categories() { return this.flow.categories(); }

  @Get("categories/:id/templates")
  templates(@Param("id", new ZodValidationPipe(categoryIdSchema)) id: string) { return this.flow.templates(id); }

  @Get("templates")
  catalog(@Query(new ZodValidationPipe(catalogQuerySchema)) query: z.infer<typeof catalogQuerySchema>) {
    return this.flow.catalog(query);
  }

  @Get("templates/:id/preview")
  templatePreview(@Param("id", new ZodValidationPipe(z.string().min(1))) id: string) {
    return this.flow.templatePreview(id);
  }

  @Get("templates/:id/schema")
  templateSchema(@Param("id") id: string) { return this.flow.templateSchema(id); }

  @Post("projects")
  createProject(@Body(new ZodValidationPipe(createProjectSchema)) body: z.infer<typeof createProjectSchema>) {
    return this.flow.createProject(body);
  }

  @Get("projects/:id")
  getProject(@Param("id", new ZodValidationPipe(z.uuid())) id: string) { return this.flow.getProject(id); }

  @Post("projects/:id/business")
  saveBusiness(@Param("id", new ZodValidationPipe(z.uuid())) id: string, @Body(new ZodValidationPipe(businessSchema)) body: Record<string, unknown>) {
    return this.flow.saveBusiness(id, body);
  }

  @Get("projects/:id/preview")
  preview(@Param("id", new ZodValidationPipe(z.uuid())) id: string) { return this.flow.preview(id); }

  @Post("projects/:id/domain")
  checkDomain(@Param("id", new ZodValidationPipe(z.uuid())) id: string, @Body(new ZodValidationPipe(domainSchema)) body: z.infer<typeof domainSchema>) {
    return this.flow.checkDomain(id, body);
  }

  @Post("projects/:id/checkout")
  createCheckout(@Param("id", new ZodValidationPipe(z.uuid())) id: string) { return this.flow.createCheckout(id); }

  @Post("checkout/:id/payment")
  pay(@Param("id", new ZodValidationPipe(z.uuid())) id: string, @Body(new ZodValidationPipe(paymentSchema)) body: z.infer<typeof paymentSchema>) {
    return this.flow.submitPayment(id, body);
  }

  /**
   * Optional AI Planner: draft copy for a project's own template slots only.
   * Slots, field shapes, and every price/feature/plan rule stay on the server.
   */
  @Post("projects/:id/ai/draft")
  async draftContent(
    @Param("id", new ZodValidationPipe(z.uuid())) id: string,
    @Body(new ZodValidationPipe(suggestionSchema)) body: z.infer<typeof suggestionSchema>,
  ) {
    if (process.env.AI_PLANNER_CONTENT_ENABLED !== "true") {
      return { enabled: false, slots: [], source: "form", draft: {} };
    }
    const result = await this.flow.draftContent(id, body);
    return { enabled: true, ...result };
  }
}
