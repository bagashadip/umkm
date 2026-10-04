export { FEATURES, PLANS, PLAN_BASE_PRICE, PRICING_VERSION, getFeature, isKnownFeature, isPlanAllowed } from "./matrix.js";
export type { Feature, FeatureCategory, PlanId } from "./matrix.js";
export {
  QUESTIONNAIRE_VERSION,
  normalizeAnswers,
  questionnaireQuestions,
  questionnaireSchema,
  rawAnswersSchema,
} from "./questionnaire.js";
export type { Questionnaire, RawAnswers } from "./questionnaire.js";
export { PlannerInputError, assertKnownFeatures, calculateWebsitePrice, plan } from "./engine.js";
export type {
  BreakdownLine,
  ExcludedFeature,
  PlannerOutput,
  SelectedFeature,
  WebsitePriceInput,
  WebsitePriceOutput,
} from "./engine.js";

export {
  prototypeConfigSchema,
  prototypeSectionSchema,
  prototypeThemeSchema,
  samplePrototypeConfig,
} from "./prototype.js";
export type { PrototypeConfig, PrototypeProduct, PrototypeSection, PrototypeTheme } from "./prototype.js";

export {
  CONTENT_BINDINGS,
  CONTENT_FIELD_TYPES,
  TemplateValidationError,
  aiSlotFields,
  buildAiDraftSchema,
  buildContentSchema,
  missingRequiredFields,
  normalizeContent,
  resolveTemplatePreview,
  sectionsForModules,
  templateDefinitionSchema,
  templateSectionSchema,
  contentSchemaSchema,
  contentFieldSchema,
  validateTemplate,
} from "./template.js";
export type {
  ContentBinding,
  ContentField,
  ContentValues,
  TemplateContentSchema,
  TemplateDefinition,
  TemplateSection,
} from "./template.js";

export { commerceEditorialTemplate } from "./templates/commerce-editorial.js";

