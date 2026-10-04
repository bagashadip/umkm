-- Dynamic website flow: catalog, project, domain, checkout, and payment persistence.
-- This migration assumes all prior migrations in this repository have already run.
CREATE TABLE "BusinessCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebsiteTemplate" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "previewImage" TEXT,
  "config" JSONB NOT NULL,
  "pricePlan" TEXT NOT NULL DEFAULT 'business',
  "version" INTEGER NOT NULL DEFAULT 1,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WebsiteTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebsiteProject" (
  "id" UUID NOT NULL,
  "sessionId" UUID NOT NULL,
  "leadId" UUID,
  "categoryId" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "currentStep" INTEGER NOT NULL DEFAULT 1,
  "businessData" JSONB,
  "previewConfig" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WebsiteProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DomainCheck" (
  "id" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "domain" TEXT NOT NULL,
  "available" BOOLEAN NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'stub',
  "status" TEXT NOT NULL DEFAULT 'checked',
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DomainCheck_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Checkout" (
  "id" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'IDR',
  "priceSnapshot" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Checkout_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
  "id" UUID NOT NULL,
  "checkoutId" UUID NOT NULL,
  "method" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'stub',
  "reference" TEXT,
  "amount" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Checkout_projectId_key" ON "Checkout"("projectId");
CREATE INDEX "WebsiteTemplate_categoryId_active_idx" ON "WebsiteTemplate"("categoryId", "active");
CREATE INDEX "WebsiteProject_sessionId_idx" ON "WebsiteProject"("sessionId");
CREATE INDEX "WebsiteProject_categoryId_idx" ON "WebsiteProject"("categoryId");
CREATE INDEX "WebsiteProject_templateId_idx" ON "WebsiteProject"("templateId");
CREATE INDEX "DomainCheck_projectId_idx" ON "DomainCheck"("projectId");
CREATE INDEX "DomainCheck_domain_idx" ON "DomainCheck"("domain");
CREATE INDEX "Payment_checkoutId_idx" ON "Payment"("checkoutId");

ALTER TABLE "WebsiteTemplate" ADD CONSTRAINT "WebsiteTemplate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BusinessCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WebsiteProject" ADD CONSTRAINT "WebsiteProject_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PlannerSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteProject" ADD CONSTRAINT "WebsiteProject_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WebsiteProject" ADD CONSTRAINT "WebsiteProject_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BusinessCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WebsiteProject" ADD CONSTRAINT "WebsiteProject_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WebsiteTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DomainCheck" ADD CONSTRAINT "DomainCheck_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "WebsiteProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Checkout" ADD CONSTRAINT "Checkout_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "WebsiteProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "Checkout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "BusinessCategory" ("id", "name", "description", "icon", "sortOrder", "updatedAt") VALUES
('kuliner', 'Kuliner', 'Restoran, katering, kedai, bakery, dan usaha makanan.', 'utensils', 1, CURRENT_TIMESTAMP),
('fashion', 'Fashion', 'Pakaian, hijab, sepatu, aksesoris, dan butik.', 'shirt', 2, CURRENT_TIMESTAMP),
('kecantikan-kesehatan', 'Kecantikan & Kesehatan', 'Salon, barbershop, skincare, klinik, dan wellness.', 'heart-pulse', 3, CURRENT_TIMESTAMP),
('jasa', 'Jasa', 'Konsultan, fotografi, desain, servis, dan tenaga profesional.', 'briefcase-business', 4, CURRENT_TIMESTAMP),
('kerajinan', 'Kerajinan', 'Produk handmade, dekorasi, souvenir, dan karya lokal.', 'palette', 5, CURRENT_TIMESTAMP),
('properti', 'Properti', 'Kos, kontrakan, agen properti, dan sewa ruang.', 'building-2', 6, CURRENT_TIMESTAMP),
('pendidikan', 'Pendidikan', 'Les privat, kursus, komunitas, dan lembaga belajar.', 'graduation-cap', 7, CURRENT_TIMESTAMP),
('agrikultur', 'Agrikultur', 'Petani, kebun, peternakan, dan produk hasil bumi.', 'sprout', 8, CURRENT_TIMESTAMP),
('otomotif', 'Otomotif', 'Bengkel, detailing, spare part, dan jual beli kendaraan.', 'car-front', 9, CURRENT_TIMESTAMP),
('lainnya', 'Lainnya', 'Untuk usaha yang belum masuk kategori di atas.', 'sparkles', 10, CURRENT_TIMESTAMP);

INSERT INTO "WebsiteTemplate" ("id", "categoryId", "name", "description", "config", "pricePlan", "updatedAt")
SELECT c."id" || '-story', c."id", 'Story-led', 'Menonjolkan cerita, kepercayaan, dan identitas usaha.', '{"layout":"story","accent":"#0b2545"}'::jsonb, 'business', CURRENT_TIMESTAMP FROM "BusinessCategory" c;
INSERT INTO "WebsiteTemplate" ("id", "categoryId", "name", "description", "config", "pricePlan", "updatedAt")
SELECT c."id" || '-catalog', c."id", 'Catalog-first', 'Membuat produk atau layanan mudah dipilih dan dipesan.', '{"layout":"catalog","accent":"#e8442a"}'::jsonb, 'business', CURRENT_TIMESTAMP FROM "BusinessCategory" c;
