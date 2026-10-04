-- Template system foundation: content schema, preview data, feature list,
-- generator manifest, and a per-project template snapshot.
ALTER TABLE "WebsiteTemplate" ADD COLUMN IF NOT EXISTS "contentSchema" JSONB;
ALTER TABLE "WebsiteTemplate" ADD COLUMN IF NOT EXISTS "previewData" JSONB;
ALTER TABLE "WebsiteTemplate" ADD COLUMN IF NOT EXISTS "features" JSONB;
ALTER TABLE "WebsiteTemplate" ADD COLUMN IF NOT EXISTS "generatorManifest" JSONB;

-- Catalog ordering, so templates can be curated without renaming rows.
ALTER TABLE "WebsiteTemplate" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Frozen copy of the template at order time so later catalog edits cannot
-- change a project that was already created.
ALTER TABLE "WebsiteProject" ADD COLUMN IF NOT EXISTS "templateSnapshot" JSONB;
