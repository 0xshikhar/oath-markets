-- CreateEnum
CREATE TYPE "CommitmentCategory" AS ENUM ('FITNESS', 'LEARNING', 'CREATIVE', 'WORK', 'HEALTH', 'FINANCIAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ProofType" AS ENUM ('TEXT', 'PHOTO', 'LINK', 'GITHUB_COMMIT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SlashDest" AS ENUM ('BURN', 'DONATE', 'TREASURY');

-- CreateEnum
CREATE TYPE "CommitmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'FAILED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "BeliefStatus" AS ENUM ('ACTIVE', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('COACH', 'USER');

-- CreateEnum
CREATE TYPE "CoachTrigger" AS ENUM ('DAILY_CHECKIN', 'PROOF_SUBMITTED', 'STREAK_RISK', 'MILESTONE', 'COMPLETION', 'FAILURE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "username" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "worldIdVerified" BOOLEAN NOT NULL DEFAULT false,
    "worldIdNullifier" TEXT,
    "notifyPlatform" BOOLEAN NOT NULL DEFAULT true,
    "notifyTelegram" TEXT,
    "notifyEmail" TEXT,
    "notifyTime" TEXT NOT NULL DEFAULT '09:00',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commitment" (
    "id" TEXT NOT NULL,
    "onchainAddress" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "CommitmentCategory" NOT NULL,
    "proofType" "ProofType" NOT NULL,
    "stakeAmountLamports" BIGINT NOT NULL,
    "slashDestination" "SlashDest" NOT NULL DEFAULT 'TREASURY',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "requiredProofDays" INTEGER NOT NULL,
    "status" "CommitmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "proofCount" INTEGER NOT NULL DEFAULT 0,
    "completionRatio" DOUBLE PRECISION,
    "resolvedAt" TIMESTAMP(3),
    "makerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proof" (
    "id" TEXT NOT NULL,
    "commitmentId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "textContent" TEXT,
    "imageUrl" TEXT,
    "linkUrl" TEXT,
    "contentHash" TEXT,
    "onchainTxSig" TEXT,
    "publicNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Belief" (
    "id" TEXT NOT NULL,
    "commitmentId" TEXT NOT NULL,
    "believerId" TEXT NOT NULL,
    "stakeAmountLamports" BIGINT NOT NULL,
    "onchainAddress" TEXT,
    "onchainTxSig" TEXT NOT NULL,
    "status" "BeliefStatus" NOT NULL DEFAULT 'ACTIVE',
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Belief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachMessage" (
    "id" TEXT NOT NULL,
    "commitmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "dayNumber" INTEGER,
    "trigger" "CoachTrigger" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "commitmentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_worldIdNullifier_key" ON "User"("worldIdNullifier");

-- CreateIndex
CREATE UNIQUE INDEX "Commitment_onchainAddress_key" ON "Commitment"("onchainAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Commitment_slug_key" ON "Commitment"("slug");

-- CreateIndex
CREATE INDEX "Commitment_makerId_idx" ON "Commitment"("makerId");

-- CreateIndex
CREATE INDEX "Commitment_status_idx" ON "Commitment"("status");

-- CreateIndex
CREATE INDEX "Commitment_isPublic_idx" ON "Commitment"("isPublic");

-- CreateIndex
CREATE INDEX "Commitment_slug_idx" ON "Commitment"("slug");

-- CreateIndex
CREATE INDEX "Proof_commitmentId_idx" ON "Proof"("commitmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Proof_commitmentId_dayNumber_key" ON "Proof"("commitmentId", "dayNumber");

-- CreateIndex
CREATE INDEX "Belief_commitmentId_idx" ON "Belief"("commitmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Belief_commitmentId_believerId_key" ON "Belief"("commitmentId", "believerId");

-- CreateIndex
CREATE INDEX "CoachMessage_commitmentId_idx" ON "CoachMessage"("commitmentId");

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_makerId_fkey" FOREIGN KEY ("makerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proof" ADD CONSTRAINT "Proof_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Belief" ADD CONSTRAINT "Belief_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Belief" ADD CONSTRAINT "Belief_believerId_fkey" FOREIGN KEY ("believerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachMessage" ADD CONSTRAINT "CoachMessage_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachMessage" ADD CONSTRAINT "CoachMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
