-- CreateEnum
CREATE TYPE "TenureBand" AS ENUM ('under_1yr', 'yr_1_3', 'yr_3_5', 'yr_5_10', 'yr_10_plus');

-- CreateEnum
CREATE TYPE "IncomeBand" AS ENUM ('under_50k', 'band_50k_100k', 'band_100k_250k', 'band_250k_500k', 'over_500k');

-- CreateEnum
CREATE TYPE "InteractionPreference" AS ENUM ('type', 'voice');

-- CreateEnum
CREATE TYPE "OutputPreference" AS ENUM ('pdf', 'slide_deck', 'one_pager');

-- CreateEnum
CREATE TYPE "ReminderFrequency" AS ENUM ('none', 'weekly', 'daily');

-- CreateEnum
CREATE TYPE "Avatar" AS ENUM ('high_net_worth', 'business_owner', 'qualified_fund_heavy', 'family_legacy');

-- CreateTable
CREATE TABLE "agent_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenureBand" "TenureBand",
    "currentIncomeBand" "IncomeBand",
    "goalIncome" INTEGER,
    "avatarMix" "Avatar"[] DEFAULT ARRAY[]::"Avatar"[],
    "interactionPreference" "InteractionPreference" NOT NULL DEFAULT 'type',
    "outputPreference" "OutputPreference" NOT NULL DEFAULT 'pdf',
    "reminderFrequency" "ReminderFrequency" NOT NULL DEFAULT 'weekly',
    "hasCpaRelationship" BOOLEAN NOT NULL DEFAULT false,
    "hasAttorneyRelationship" BOOLEAN NOT NULL DEFAULT false,
    "imoAffiliation" TEXT,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_profiles_userId_key" ON "agent_profiles"("userId");

-- AddForeignKey
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
