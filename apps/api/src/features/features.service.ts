import { Injectable } from "@nestjs/common";
import { FEATURES } from "@umkm/planner-engine";
import type { FeatureCatalogItem } from "./features.types";

@Injectable()
export class FeaturesService {
  list(): FeatureCatalogItem[] {
    return FEATURES.map(({ id, name, description, category, limits, unitSize }) => ({
      id,
      name,
      description,
      category,
      availability: limits,
      constraints: { maxPerPlan: limits, ...(unitSize ? { unitSize } : {}) },
    }));
  }
}
