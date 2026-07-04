-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'imo_principal';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "principalOfImoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_principalOfImoId_key" ON "users"("principalOfImoId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_principalOfImoId_fkey" FOREIGN KEY ("principalOfImoId") REFERENCES "imos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
