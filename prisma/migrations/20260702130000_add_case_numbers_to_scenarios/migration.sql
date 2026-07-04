-- Agent-only case numbers for the quantified improvement analysis
ALTER TABLE "scenarios" ADD COLUMN "estimatedEstateValue" INTEGER;
ALTER TABLE "scenarios" ADD COLUMN "estimatedQualifiedBalance" INTEGER;
ALTER TABLE "scenarios" ADD COLUMN "estimatedTaxableIncome" INTEGER;
