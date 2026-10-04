import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  TemplateValidationError,
  commerceEditorialTemplate,
  resolveTemplatePreview,
  validateTemplate,
  type TemplateDefinition,
} from "@umkm/planner-engine";

/**
 * Catalog of every importable template.
 * Add new template definitions here and they are validated on import.
 */
const TEMPLATES: TemplateDefinition[] = [commerceEditorialTemplate];

const prisma = new PrismaClient();

function assertCategoryExists(definition: TemplateDefinition) {
  return prisma.businessCategory
    .findFirst({ where: { id: definition.categoryId } })
    .then((category) => {
      if (!category) {
        throw new TemplateValidationError(
          `Template '${definition.id}' menunjuk kategori yang tidak ada: ${definition.categoryId}`,
        );
      }
    });
}

async function main() {
  const only = process.argv.find((arg) => arg.startsWith("--id="))?.slice(5);
  const dryRun = process.argv.includes("--dry-run");
  const selected = only ? TEMPLATES.filter((template) => template.id === only) : TEMPLATES;
  if (selected.length === 0) throw new Error(`Template tidak ditemukan di katalog: ${only}`);

  for (const definition of selected) {
    // Full validation: schema, duplicate keys, bindings, and a rendered preview.
    const { template } = validateTemplate(definition);
    if (!dryRun) await assertCategoryExists(template);
    // Proof that previewData actually renders before anything is written.
    resolveTemplatePreview({
      template,
      category: { id: template.categoryId, name: template.categoryId },
      data: template.previewData,
    });

    if (dryRun) {
      console.log(`✓ ${template.id} (v${template.version}) valid`);
      continue;
    }

    const data = {
      id: template.id,
      categoryId: template.categoryId,
      name: template.name,
      description: template.description,
      previewImage: template.previewImage,
      pricePlan: template.pricePlan,
      version: template.version,
      active: template.active,
      sortOrder: template.sortOrder,
      config: { presentation: template.presentation, tags: template.tags, categories: template.categories } as never,
      contentSchema: template.contentSchema as never,
      previewData: template.previewData as never,
      features: template.features as never,
      generatorManifest: template.generator as never,
    };

    await prisma.websiteTemplate.upsert({
      where: { id: template.id },
      create: data,
      update: data,
    });
    console.log(`✓ ${template.id} (v${template.version})`);
  }
}

main()
  .catch((error) => {
    if (error instanceof TemplateValidationError) {
      console.error(`✗ ${error.message}`);
      for (const issue of error.issues) console.error(`   - ${issue}`);
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
