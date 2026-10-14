CREATE TYPE "AccountType" AS ENUM ('BUSINESS', 'INVESTOR');

ALTER TABLE "User"
ADD COLUMN "accountType" "AccountType" NOT NULL DEFAULT 'BUSINESS';

CREATE TABLE "InvestorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "investorType" TEXT NOT NULL,
    "firmName" TEXT,
    "sectors" TEXT[],
    "stages" TEXT[],
    "investmentRange" TEXT NOT NULL,
    "location" TEXT,
    "website" TEXT,
    "linkedInUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InvestorProfile_userId_key" ON "InvestorProfile"("userId");

ALTER TABLE "InvestorProfile"
ADD CONSTRAINT "InvestorProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
