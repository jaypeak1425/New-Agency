-- AlterTable
ALTER TABLE "agent_profiles" ADD COLUMN     "bookAddressableFilterOverridePercent" DOUBLE PRECISION,
ADD COLUMN     "businessOwnersSoloCount" INTEGER,
ADD COLUMN     "businessOwnersWithCoOwnersCount" INTEGER,
ADD COLUMN     "familyLegacyCount" INTEGER,
ADD COLUMN     "hnwIndividualsCount" INTEGER,
ADD COLUMN     "qualifiedFundHeavyCount" INTEGER;
