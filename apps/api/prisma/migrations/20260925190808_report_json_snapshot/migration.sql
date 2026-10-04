/*
  Warnings:

  - You are about to drop the column `snapshot` on the `PlannerReport` table. All the data in the column will be lost.
  - Added the required column `excludedFeatures` to the `PlannerReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `normalizedAnswers` to the `PlannerReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceBreakdown` to the `PlannerReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prototypeConfig` to the `PlannerReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questionnaireVersion` to the `PlannerReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rawAnswers` to the `PlannerReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `selectedFeatures` to the `PlannerReport` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PlannerReport" DROP COLUMN "snapshot",
ADD COLUMN     "excludedFeatures" JSONB NOT NULL,
ADD COLUMN     "normalizedAnswers" JSONB NOT NULL,
ADD COLUMN     "priceBreakdown" JSONB NOT NULL,
ADD COLUMN     "prototypeConfig" JSONB NOT NULL,
ADD COLUMN     "questionnaireVersion" INTEGER NOT NULL,
ADD COLUMN     "rawAnswers" JSONB NOT NULL,
ADD COLUMN     "selectedFeatures" JSONB NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft';
