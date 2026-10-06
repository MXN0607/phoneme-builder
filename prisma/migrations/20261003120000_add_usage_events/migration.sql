-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "activityType" TEXT,
    "durationMs" INTEGER,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "UsageEvent_type_createdAt_idx" ON "UsageEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "UsageEvent_activityType_idx" ON "UsageEvent"("activityType");
