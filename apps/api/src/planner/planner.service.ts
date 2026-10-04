import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  normalizeAnswers, plan, PRICING_VERSION, questionnaireSchema,
  QUESTIONNAIRE_VERSION, rawAnswersSchema,
} from "@umkm/planner-engine";
import { PrismaService } from "../prisma/prisma.service";
import { normalizeWhatsapp, WhatsappValidationError } from "../common/whatsapp";

type AnswerBody = { sessionId: string; step: string; payload: Record<string, unknown> };
type FinishBody = { sessionId: string; lead?: { whatsapp: string; name?: string; business?: string } };

function validationError(field: string, message: string): BadRequestException {
  return new BadRequestException({ success: false, errors: [{ field, message }] });
}

@Injectable()
export class PlannerService {
  constructor(private readonly prisma: PrismaService) {}

  start() {
    return this.prisma.plannerSession.create({ data: {} }).then(({ id }) => ({ sessionId: id }));
  }

  async answer(body: AnswerBody) {
    const session = await this.prisma.plannerSession.findUnique({ where: { id: body.sessionId } });
    if (!session) throw new NotFoundException("Session not found");
    const raw = rawAnswersSchema.safeParse(body.payload);
    if (!raw.success) throw validationError("payload", raw.error.message);
    if (Object.keys(questionnaireSchema.shape).every((key) => key in body.payload)) {
      try { normalizeAnswers(raw.data); }
      catch (error) { throw validationError("payload", error instanceof Error ? error.message : "invalid payload"); }
    }
    return this.prisma.plannerAnswer.upsert({
      where: { sessionId_step: { sessionId: body.sessionId, step: body.step } },
      create: { sessionId: body.sessionId, step: body.step, payload: body.payload as object },
      update: { payload: body.payload as object },
    });
  }

  async finish(body: FinishBody) {
    const answers = await this.prisma.plannerAnswer.findMany({ where: { sessionId: body.sessionId }, orderBy: { updatedAt: "asc" } });
    if (!answers.length) throw validationError("sessionId", "session tidak punya jawaban");
    const rawAnswers = Object.assign({}, ...answers.map((answer) => answer.payload));
    let normalizedAnswers;
    let output;
    try {
      normalizedAnswers = normalizeAnswers(rawAnswersSchema.parse(rawAnswers));
      output = plan(normalizedAnswers);
    } catch (error) {
      throw validationError("payload", error instanceof Error ? error.message : "invalid answers");
    }

    const report = await this.prisma.$transaction(async (tx) => {
      let leadId: string | null = null;
      if (body.lead) {
        let whatsapp: string;
        try { whatsapp = normalizeWhatsapp(body.lead.whatsapp); }
        catch (error) {
          if (error instanceof WhatsappValidationError) throw validationError("lead.whatsapp", error.message);
          throw error;
        }
        const lead = await tx.lead.upsert({
          where: { whatsapp },
          create: { whatsapp, name: body.lead.name, business: body.lead.business },
          update: { name: body.lead.name, business: body.lead.business },
        });
        leadId = lead.id;
      }

      return tx.plannerReport.create({
        data: {
          sessionId: body.sessionId, leadId, status: "final",
          questionnaireVersion: QUESTIONNAIRE_VERSION, pricingVersion: PRICING_VERSION,
          rawAnswers: rawAnswers as object, normalizedAnswers: normalizedAnswers as object,
          selectedFeatures: output.selectedFeatures as object, excludedFeatures: output.excludedFeatures as object,
          priceBreakdown: output.breakdown as object, prototypeConfig: output.prototypeConfig as object,
          totalPrice: output.totalPrice,
        },
      });
    });

    return {
      reportId: report.id,
      snapshot: {
        rawAnswers: report.rawAnswers, normalizedAnswers: report.normalizedAnswers,
        selectedFeatures: report.selectedFeatures, excludedFeatures: report.excludedFeatures,
        priceBreakdown: report.priceBreakdown, prototypeConfig: report.prototypeConfig,
      },
      total: report.totalPrice, pricingVersion: report.pricingVersion,
    };
  }

  async getReport(id: string) {
    const report = await this.prisma.plannerReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException("Report not found");
    return {
      id: report.id, status: report.status,
      snapshot: {
        rawAnswers: report.rawAnswers, normalizedAnswers: report.normalizedAnswers,
        selectedFeatures: report.selectedFeatures, excludedFeatures: report.excludedFeatures,
        priceBreakdown: report.priceBreakdown, prototypeConfig: report.prototypeConfig,
      },
      prototypeConfig: report.prototypeConfig, total: report.totalPrice,
      pricingVersion: report.pricingVersion, questionnaireVersion: report.questionnaireVersion,
      createdAt: report.createdAt,
    };
  }
}
