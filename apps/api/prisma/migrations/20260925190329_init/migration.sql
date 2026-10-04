-- CreateTable
CREATE TABLE "PlannerSession" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannerAnswer" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "step" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannerAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannerReport" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "leadId" UUID,
    "pricingVersion" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlannerReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" UUID NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "consentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlannerAnswer_sessionId_idx" ON "PlannerAnswer"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "PlannerAnswer_sessionId_step_key" ON "PlannerAnswer"("sessionId", "step");

-- CreateIndex
CREATE INDEX "PlannerReport_sessionId_idx" ON "PlannerReport"("sessionId");

-- CreateIndex
CREATE INDEX "PlannerReport_leadId_idx" ON "PlannerReport"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_whatsapp_key" ON "Lead"("whatsapp");

-- AddForeignKey
ALTER TABLE "PlannerAnswer" ADD CONSTRAINT "PlannerAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PlannerSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerReport" ADD CONSTRAINT "PlannerReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PlannerSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerReport" ADD CONSTRAINT "PlannerReport_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
