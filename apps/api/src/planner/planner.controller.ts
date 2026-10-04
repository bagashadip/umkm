import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AiService } from "../ai/ai.service";
import { PlannerService } from "./planner.service";

const answerSchema = z.object({
  sessionId: z.uuid(),
  step: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
});

const leadSchema = z.object({
  whatsapp: z.string().min(1),
  name: z.string().min(1).optional(),
  business: z.string().min(1).optional(),
});

const finishSchema = z.object({ sessionId: z.uuid(), lead: leadSchema.optional() });

const textSchema = z.object({ sessionId: z.uuid(), text: z.string().min(1).max(4000), payload: z.record(z.string(), z.unknown()) });

@Controller("planner")
export class PlannerController {
  constructor(
    private readonly planner: PlannerService,
    private readonly ai: AiService,
  ) {}

  @Post("start")
  start() { return this.planner.start(); }

  @Post("answer")
  answer(@Body(new ZodValidationPipe(answerSchema)) body: z.infer<typeof answerSchema>) {
    return this.planner.answer(body);
  }

  /** Free-text entry: AI maps text to questionnaire; structured form values are the fallback. */
  @Post("answer-text")
  async answerText(@Body(new ZodValidationPipe(textSchema)) body: z.infer<typeof textSchema>) {
    const result = await this.ai.mapTextToQuestionnaire(body.text, body.payload);
    return {
      source: result.source,
      questionnaire: result.questionnaire,
      saved: await this.planner.answer({ sessionId: body.sessionId, step: "ai-text", payload: result.questionnaire }),
    };
  }

  @Post("finish")
  finish(@Body(new ZodValidationPipe(finishSchema)) body: z.infer<typeof finishSchema>) {
    return this.planner.finish(body);
  }

  @Get("report/:id")
  getReport(@Param("id", new ZodValidationPipe(z.uuid())) id: string) { return this.planner.getReport(id); }
}
