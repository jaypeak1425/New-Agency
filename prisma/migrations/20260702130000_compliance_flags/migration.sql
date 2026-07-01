-- CreateEnum
CREATE TYPE "ComplianceFlagTrigger" AS ENUM ('filter_caught', 'pre_launch', 'periodic_audit');

-- CreateEnum
CREATE TYPE "ComplianceFlagStatus" AS ENUM ('open', 'cleared', 'rejected', 'escalated');

-- CreateTable
CREATE TABLE "compliance_flags" (
    "id" TEXT NOT NULL,
    "triggerType" "ComplianceFlagTrigger" NOT NULL,
    "status" "ComplianceFlagStatus" NOT NULL DEFAULT 'open',
    "content" TEXT NOT NULL,
    "scenarioId" TEXT,
    "strategyId" TEXT,
    "resolverId" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "compliance_flags_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "compliance_flags" ADD CONSTRAINT "compliance_flags_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_flags" ADD CONSTRAINT "compliance_flags_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "strategies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_flags" ADD CONSTRAINT "compliance_flags_resolverId_fkey" FOREIGN KEY ("resolverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
