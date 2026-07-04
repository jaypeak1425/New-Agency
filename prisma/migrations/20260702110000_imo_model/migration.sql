-- CreateEnum
CREATE TYPE "ImoOrgType" AS ENUM ('imo', 'fmo', 'bga', 'ga');

-- CreateTable
CREATE TABLE "imos" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationType" "ImoOrgType" NOT NULL,
    "primaryContactName" TEXT,
    "primaryContactEmail" TEXT,
    "seatsPurchased" INTEGER NOT NULL,
    "contractTerms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imos_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "imoId" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_imoId_fkey" FOREIGN KEY ("imoId") REFERENCES "imos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
