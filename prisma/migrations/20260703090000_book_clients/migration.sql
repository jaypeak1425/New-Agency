-- Book-of-business import: per-client book records with avatar scoring
CREATE TABLE "book_clients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "businessOwner" BOOLEAN,
    "hasCoOwners" BOOLEAN,
    "netWorthEstimate" "NetWorthEstimate",
    "qualifiedFundsEstimate" "QualifiedFundsEstimate",
    "hasDependentsUnder18" BOOLEAN,
    "notes" TEXT,
    "avatar" "Avatar",
    "scoreY1" INTEGER NOT NULL DEFAULT 0,
    "scenarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "book_clients_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "book_clients_scenarioId_key" ON "book_clients"("scenarioId");
CREATE INDEX "book_clients_userId_idx" ON "book_clients"("userId");
ALTER TABLE "book_clients" ADD CONSTRAINT "book_clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "book_clients" ADD CONSTRAINT "book_clients_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
