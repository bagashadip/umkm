import type { FeatureCategory, PlanId } from "@umkm/planner-engine";

export type FeatureCatalogItem = {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  availability: Record<PlanId, number | null>;
  constraints: { maxPerPlan: Record<PlanId, number | null>; unitSize?: number };
};
