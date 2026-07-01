-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('existing_strong', 'existing_first_meeting', 'existing_second_meeting', 'cold_first_meeting', 'cold_second_meeting', 'referral_warm');

-- AlterTable
ALTER TABLE "agent_profiles" ADD COLUMN     "closeRateOverridePercent" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "scenarios" ADD COLUMN     "relationshipType" "RelationshipType";
