-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('married', 'single');

-- CreateEnum
CREATE TYPE "BeneficiaryStructure" AS ENUM ('spouse_only', 'children', 'grandchildren_multigenerational', 'charity');

-- CreateEnum
CREATE TYPE "ControlPreference" AS ENUM ('relinquish_control', 'retained_access_or_control');

-- CreateEnum
CREATE TYPE "FundingPreference" AS ENUM ('gift_or_exemption', 'financing_or_loan', 'employer_funded');

-- CreateEnum
CREATE TYPE "ExistingStructure" AS ENUM ('ilit', 'grantor_trust', 'qualified_plan', 'business_entity');

-- CreateEnum
CREATE TYPE "UrgencyDriver" AS ENUM ('legislative_exemption_sunset', 'liquidity_event', 'health_change', 'business_sale', 'generational_transfer_event', 'none');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "IntakeGoal" ADD VALUE 'minimize_estate_tax';
ALTER TYPE "IntakeGoal" ADD VALUE 'charitable_intent';
ALTER TYPE "IntakeGoal" ADD VALUE 'estate_liquidity';

-- AlterTable
ALTER TABLE "scenarios" ADD COLUMN     "beneficiaryStructure" "BeneficiaryStructure",
ADD COLUMN     "concentratedLowBasisPosition" BOOLEAN,
ADD COLUMN     "controlPreference" "ControlPreference",
ADD COLUMN     "estateExceedsExemption" BOOLEAN,
ADD COLUMN     "existingStructures" "ExistingStructure"[] DEFAULT ARRAY[]::"ExistingStructure"[],
ADD COLUMN     "fundingPreference" "FundingPreference",
ADD COLUMN     "illiquidNetWorth" BOOLEAN,
ADD COLUMN     "maritalStatus" "MaritalStatus",
ADD COLUMN     "stateOfResidence" TEXT,
ADD COLUMN     "urgencyDriver" "UrgencyDriver";
