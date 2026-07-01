-- CreateTable
CREATE TABLE "weekly_call_queue_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_call_queue_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_call_queue_entries_userId_weekStart_scenarioId_key" ON "weekly_call_queue_entries"("userId", "weekStart", "scenarioId");

-- AddForeignKey
ALTER TABLE "weekly_call_queue_entries" ADD CONSTRAINT "weekly_call_queue_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_call_queue_entries" ADD CONSTRAINT "weekly_call_queue_entries_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
