/*
  Warnings:

  - Added the required column `label` to the `scenarios` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `scenarios` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminActionType" ADD VALUE 'create_wholesaler';
ALTER TYPE "AdminActionType" ADD VALUE 'assign_wholesaler';
ALTER TYPE "AdminActionType" ADD VALUE 'unassign_wholesaler';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'wholesaler';

-- AlterTable
ALTER TABLE "scenarios" ADD COLUMN     "label" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "wholesalerNotifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "assignedWholesalerId" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_assignedWholesalerId_fkey" FOREIGN KEY ("assignedWholesalerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
