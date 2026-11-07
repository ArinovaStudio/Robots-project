CREATE TABLE "CompanyPitch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tagline" TEXT,
    "type" TEXT NOT NULL DEFAULT 'PITCH',
    "summary" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'Seed',
    "targetAmount" TEXT,
    "equityOffered" TEXT,
    "highlights" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "pitchDeckUrl" TEXT,
    "websiteUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isSharedWithCompanies" BOOLEAN NOT NULL DEFAULT false,
    "feedPostId" TEXT,
    "collabRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyPitch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompanyPitchView" (
    "id" TEXT NOT NULL,
    "pitchId" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyPitchView_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompanyPitchOffer" (
    "id" TEXT NOT NULL,
    "pitchId" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "amountValue" DOUBLE PRECISION NOT NULL,
    "terms" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyPitchOffer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompanyPitchRating" (
    "id" TEXT NOT NULL,
    "pitchId" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyPitchRating_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CompanyPitchRating_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

CREATE INDEX "CompanyPitch_userId_createdAt_idx" ON "CompanyPitch"("userId", "createdAt");
CREATE INDEX "CompanyPitch_status_createdAt_idx" ON "CompanyPitch"("status", "createdAt");
CREATE UNIQUE INDEX "CompanyPitchView_pitchId_investorId_key" ON "CompanyPitchView"("pitchId", "investorId");
CREATE INDEX "CompanyPitchView_investorId_idx" ON "CompanyPitchView"("investorId");
CREATE INDEX "CompanyPitchOffer_pitchId_createdAt_idx" ON "CompanyPitchOffer"("pitchId", "createdAt");
CREATE INDEX "CompanyPitchOffer_investorId_createdAt_idx" ON "CompanyPitchOffer"("investorId", "createdAt");
CREATE UNIQUE INDEX "CompanyPitchRating_pitchId_investorId_key" ON "CompanyPitchRating"("pitchId", "investorId");
CREATE INDEX "CompanyPitchRating_investorId_createdAt_idx" ON "CompanyPitchRating"("investorId", "createdAt");

ALTER TABLE "CompanyPitch"
ADD CONSTRAINT "CompanyPitch_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CompanyPitchView"
ADD CONSTRAINT "CompanyPitchView_pitchId_fkey"
FOREIGN KEY ("pitchId") REFERENCES "CompanyPitch"("id")
ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "CompanyPitchView_investorId_fkey"
FOREIGN KEY ("investorId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CompanyPitchOffer"
ADD CONSTRAINT "CompanyPitchOffer_pitchId_fkey"
FOREIGN KEY ("pitchId") REFERENCES "CompanyPitch"("id")
ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "CompanyPitchOffer_investorId_fkey"
FOREIGN KEY ("investorId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CompanyPitchRating"
ADD CONSTRAINT "CompanyPitchRating_pitchId_fkey"
FOREIGN KEY ("pitchId") REFERENCES "CompanyPitch"("id")
ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "CompanyPitchRating_investorId_fkey"
FOREIGN KEY ("investorId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
