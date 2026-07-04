-- CreateEnum
CREATE TYPE "ScenarioStatus" AS ENUM ('draft', 'active', 'in_underwriting', 'closed_won', 'closed_lost');

-- AlterTable
ALTER TABLE "scenarios" ADD COLUMN     "closedAt" TIMESTAMP(3),
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" SET DATA TYPE "ScenarioStatus" USING (
  CASE WHEN "status" IN ('draft', 'active', 'in_underwriting', 'closed_won', 'closed_lost')
    THEN "status"::"ScenarioStatus"
    ELSE 'draft'::"ScenarioStatus"
  END
),
ALTER COLUMN "status" SET DEFAULT 'draft';
