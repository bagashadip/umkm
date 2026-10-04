import {
  TemplateValidationError,
  validateTemplate,
  type TemplateDefinition,
} from "@umkm/planner-engine";

/**
 * Row shape of WebsiteTemplate.
 *
 * A template definition is stored across semantic columns so it can be queried
 * (which templates use this feature? this generator preset?) while `config`
 * keeps holding presentation data for rows created before the template system.
 */
export type TemplateRow = {
  id: string;
  categoryId?: string;
  name: string;
  description: string;
  previewImage: string | null;
  config: unknown;
  contentSchema: unknown;
  previewData: unknown;
  features: unknown;
  generatorManifest: unknown;
  sortOrder: number;
  pricePlan: string;
  version: number;
  active?: boolean;
};

type ConfigPayload = {
  presentation?: unknown;
  tags?: unknown;
  categories?: unknown;
  /** Legacy shape from before the template system: { layout, accent }. */
  layout?: string;
  accent?: string;
};

/**
 * Rebuilds a definition from a stored row.
 * Returns null for legacy rows that predate content schemas, so callers can
 * fall back to the old preview path instead of throwing on existing data.
 */
export function templateDefinitionFromRow(row: TemplateRow): TemplateDefinition | null {
  const config = (row.config ?? {}) as ConfigPayload;
  if (!config.presentation || !row.contentSchema || !row.generatorManifest) return null;

  const definition = {
    id: row.id,
    version: row.version,
    categoryId: row.categoryId ?? "lainnya",
    categories: Array.isArray(config.categories) ? config.categories : [],
    name: row.name,
    description: row.description,
    previewImage: row.previewImage,
    tags: Array.isArray(config.tags) ? config.tags : [],
    pricePlan: row.pricePlan,
    active: row.active ?? true,
    sortOrder: row.sortOrder ?? 0,
    presentation: config.presentation,
    contentSchema: row.contentSchema,
    features: Array.isArray(row.features) ? row.features : [],
    previewData: row.previewData ?? {},
    generator: row.generatorManifest,
  };

  try {
    return validateTemplate(definition).template;
  } catch (error) {
    // A bad row must not take the whole catalog down, but it must be visible:
    // it silently falls back to legacy rendering until it is re-imported.
    if (error instanceof TemplateValidationError) {
      console.warn(`[templates] '${row.id}' gagal divalidasi dan dipakai sebagai template legacy:`, error.issues);
      return null;
    }
    throw error;
  }
}

/** Splits a validated definition into the columns that store it. */
export function templateRowData(definition: TemplateDefinition) {
  return {
    id: definition.id,
    categoryId: definition.categoryId,
    name: definition.name,
    description: definition.description,
    previewImage: definition.previewImage,
    pricePlan: definition.pricePlan,
    version: definition.version,
    active: definition.active,
    sortOrder: definition.sortOrder,
    config: {
      presentation: definition.presentation,
      tags: definition.tags,
      categories: definition.categories,
    },
    contentSchema: definition.contentSchema,
    previewData: definition.previewData,
    features: definition.features,
    generatorManifest: definition.generator,
  };
}
