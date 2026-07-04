-- CreateEnum
CREATE TYPE "StrategyTier" AS ENUM ('core', 'supporting');

-- CreateEnum
CREATE TYPE "StrategyStatus" AS ENUM ('documented', 'pending_content');

-- CreateTable
CREATE TABLE "strategies" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "StrategyTier" NOT NULL,
    "status" "StrategyStatus" NOT NULL DEFAULT 'pending_content',
    "avatarTags" "Avatar"[] DEFAULT ARRAY[]::"Avatar"[],
    "clientTriggerProfile" TEXT,
    "legalBasis" TEXT,
    "mechanics" TEXT,
    "whyUsed" TEXT,
    "matchingParameters" JSONB,
    "uplineQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceDoc" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "strategies_slug_key" ON "strategies"("slug");
