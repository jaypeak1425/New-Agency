-- CreateEnum
CREATE TYPE "NetWorthEstimate" AS ENUM ('under_500k', 'range_500k_2m', 'range_2m_5m', 'over_5m');

-- CreateEnum
CREATE TYPE "QualifiedFundsEstimate" AS ENUM ('under_500k', 'over_500k');

-- AlterTable
ALTER TABLE "scenarios" ADD COLUMN     "hasDependentsUnder18" BOOLEAN,
ADD COLUMN     "netWorthEstimate" "NetWorthEstimate",
ADD COLUMN     "qualifiedFundsEstimate" "QualifiedFundsEstimate";
