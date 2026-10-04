import { createHash } from "node:crypto";
import { Injectable, NotFoundException } from "@nestjs/common";
import {
  resolveTemplatePreview,
  sectionsForModules,
  type TemplateDefinition,
} from "@umkm/planner-engine";
import { PrismaService } from "../prisma/prisma.service";

type OrderPayload = {
  schemaVersion: number;
  projectId: string;
  category: { id: string; name: string };
  template: { id: string; version: number; legacy?: boolean; definition?: TemplateDefinition; config?: unknown; pricePlan?: string };
  businessData: Record<string, unknown>;
  plan: string | null;
  price: { total: number; currency: string; breakdown: Array<{ id?: string; label: string; quantity: number; total: number }> };
  domain: string | null;
  generator: { frontendPreset: string | null; backendPreset: string | null; modules: string[] };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Stable stringify: same payload must always hash the same, key order notwithstanding. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (isRecord(value)) {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

/**
 * Builds a website client project from an order.
 *
 * Everything it needs arrives inside the frozen OrderSnapshot: template
 * definition, business data, price, and module list. It deliberately reads no
 * live catalog, so a template edit after checkout cannot change what a client
 * was sold, and no AI output can influence features or price.
 */
@Injectable()
export class GeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  async buildPlan(projectId: string) {
    const snapshot = await this.prisma.orderSnapshot.findUnique({ where: { projectId } });
    if (!snapshot) throw new NotFoundException("Snapshot pesanan belum dibuat");
    const payload = snapshot.payload as unknown as OrderPayload;

    const definition = payload.template?.definition;
    const modules = payload.generator?.modules ?? [];

    // Deterministic render config: template + frozen business data → config.
    const frontendConfig = definition
      ? resolveTemplatePreview({
          template: definition,
          category: { id: payload.category?.id ?? "", name: payload.category?.name ?? "" },
          data: payload.businessData ?? {},
        })
      : null;

    const products = (payload.businessData?.products ?? []) as Array<Record<string, unknown>>;

    const plan = {
      schemaVersion: payload.schemaVersion ?? 1,
      projectId: payload.projectId,
      snapshotId: snapshot.id,
      template: { id: payload.template?.id ?? "", version: payload.template?.version ?? 1, legacy: Boolean(payload.template?.legacy) },
      category: payload.category,
      plan: payload.plan,
      price: payload.price,
      domain: payload.domain,
      frontend: {
        preset: payload.generator?.frontendPreset ?? null,
        config: frontendConfig,
        sections: definition ? sectionsForModules(definition, modules) : [],
      },
      backend: {
        preset: payload.generator?.backendPreset ?? null,
        modules,
        products: products.map((row, index) => ({
          id: `product-${index + 1}`,
          name: row.name ?? "",
          description: row.description ?? "",
        })),
      },
    };

    return { ...plan, hash: createHash("sha256").update(canonical(plan)).digest("hex") };
  }
}
