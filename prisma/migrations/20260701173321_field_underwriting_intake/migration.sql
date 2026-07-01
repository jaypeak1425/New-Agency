-- CreateEnum
CREATE TYPE "MajorDiagnosis" AS ENUM ('heart_attack_or_stroke', 'cancer', 'diabetes_type_1', 'diabetes_type_2_controlled', 'autoimmune', 'mental_health_hospitalization', 'none');

-- CreateEnum
CREATE TYPE "DuiHistory" AS ENUM ('none', 'single_5_plus_years_ago', 'within_3_years', 'multiple');

-- CreateEnum
CREATE TYPE "SourceOfFunds" AS ENUM ('qualified', 'non_qualified', 'mixed');

-- CreateEnum
CREATE TYPE "IncomeStartTiming" AS ENUM ('immediately', 'deferred_5_years', 'deferred_to_retirement_age', 'deferred_accumulation');

-- CreateEnum
CREATE TYPE "TaxBracket" AS ENUM ('under_22', 'range_22_32', 'range_32_37', 'above_37');

-- CreateEnum
CREATE TYPE "EstatePlanningIntent" AS ENUM ('legacy', 'income_only');

-- CreateTable
CREATE TABLE "life_underwriting_intakes" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "heightInches" INTEGER,
    "weightLbs" INTEGER,
    "majorDiagnoses" "MajorDiagnosis"[] DEFAULT ARRAY[]::"MajorDiagnosis"[],
    "hospitalizationsOrSurgeriesNotes" TEXT,
    "familyHistoryEarlyDeath" BOOLEAN,
    "occupation" TEXT,
    "hazardousOccupation" BOOLEAN,
    "hobbies" TEXT,
    "hazardousHobby" BOOLEAN,
    "duiHistory" "DuiHistory",
    "foreignTravelPlanned" BOOLEAN,
    "foreignTravelNotes" TEXT,
    "existingLifeInsuranceNotes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "life_underwriting_intakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annuity_intakes" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "liquidNetWorthRange" "IncomeRevenueRange",
    "sourceOfFunds" "SourceOfFunds",
    "allocationAmount" INTEGER,
    "desiredIncomeStartDate" "IncomeStartTiming",
    "existingAnnuityContractsNotes" TEXT,
    "taxBracket" "TaxBracket",
    "estatePlanningIntent" "EstatePlanningIntent",
    "needsLiquidityWithin5to7Years" BOOLEAN,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annuity_intakes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "life_underwriting_intakes_scenarioId_key" ON "life_underwriting_intakes"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "annuity_intakes_scenarioId_key" ON "annuity_intakes"("scenarioId");

-- AddForeignKey
ALTER TABLE "life_underwriting_intakes" ADD CONSTRAINT "life_underwriting_intakes_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annuity_intakes" ADD CONSTRAINT "annuity_intakes_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
