-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('permanent_life', 'term_life', 'survivorship_life', 'annuity', 'coli_face_amount', 'executive_bonus_162', 'disability_income', 'ltc_hybrid');

-- AlterTable
ALTER TABLE "agent_profiles" ADD COLUMN     "commissionRateOverridePercent" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "scenario_strategy_estimates" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "productType" "ProductType" NOT NULL,
    "annualPremium" INTEGER,
    "faceAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenario_strategy_estimates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scenario_strategy_estimates_scenarioId_strategyId_key" ON "scenario_strategy_estimates"("scenarioId", "strategyId");

-- AddForeignKey
ALTER TABLE "scenario_strategy_estimates" ADD CONSTRAINT "scenario_strategy_estimates_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_strategy_estimates" ADD CONSTRAINT "scenario_strategy_estimates_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "strategies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
