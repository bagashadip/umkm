-- Freeze the order at checkout: the generator must build from what was ordered,
-- not from the live catalog after a later template edit.
CREATE TABLE IF NOT EXISTS "OrderSnapshot" (
    "id" TEXT NOT NULL,
    "projectId" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrderSnapshot_projectId_key" ON "OrderSnapshot"("projectId");
CREATE INDEX IF NOT EXISTS "OrderSnapshot_createdAt_idx" ON "OrderSnapshot"("createdAt");

ALTER TABLE "OrderSnapshot"
  ADD CONSTRAINT "OrderSnapshot_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "WebsiteProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
