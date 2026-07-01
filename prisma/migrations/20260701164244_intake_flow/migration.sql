-- CreateEnum
CREATE TYPE "HealthRating" AS ENUM ('good', 'average', 'health_issues');

-- CreateEnum
CREATE TYPE "TobaccoUse" AS ENUM ('none', 'occasional', 'regular');

-- CreateEnum
CREATE TYPE "BusinessOwnerStatus" AS ENUM ('business_owner', 'employee', 'neither');

-- CreateEnum
CREATE TYPE "BusinessStructure" AS ENUM ('c_corp', 's_corp', 'partnership', 'llc', 'sole_prop');

-- CreateEnum
CREATE TYPE "IntakeGoal" AS ENUM ('retirement_income', 'business_continuity', 'key_employee_retention', 'estate_planning', 'legacy', 'other');

-- CreateEnum
CREATE TYPE "ExistingRelationship" AS ENUM ('existing', 'new_prospect');

-- CreateEnum
CREATE TYPE "IncomeRevenueRange" AS ENUM ('under_250k', 'range_250k_1m', 'range_1m_5m', 'over_5m');

-- AlterTable
ALTER TABLE "scenarios" ADD COLUMN     "businessOwnerStatus" "BusinessOwnerStatus",
ADD COLUMN     "businessStructure" "BusinessStructure",
ADD COLUMN     "clientDescription" TEXT,
ADD COLUMN     "coOwnersNotes" TEXT,
ADD COLUMN     "existingRelationship" "ExistingRelationship",
ADD COLUMN     "goalsNotes" TEXT,
ADD COLUMN     "healthNotes" TEXT,
ADD COLUMN     "healthRating" "HealthRating",
ADD COLUMN     "incomeRevenueRange" "IncomeRevenueRange",
ADD COLUMN     "intakeCompletedAt" TIMESTAMP(3),
ADD COLUMN     "keyEmployeesCount" INTEGER,
ADD COLUMN     "keyEmployeesNotes" TEXT,
ADD COLUMN     "primaryAge" INTEGER,
ADD COLUMN     "primaryGoals" "IntakeGoal"[] DEFAULT ARRAY[]::"IntakeGoal"[],
ADD COLUMN     "tobaccoNotes" TEXT,
ADD COLUMN     "tobaccoUse" "TobaccoUse";
