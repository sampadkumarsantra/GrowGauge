/*
  Warnings:

  - You are about to drop the column `claimedAt` on the `FPOSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `FPOSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Facilitator` table. All the data in the column will be lost.
  - You are about to drop the column `userAccountId` on the `Facilitator` table. All the data in the column will be lost.
  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AuthAttempt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AuthToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "FPOSubmission" DROP CONSTRAINT "FPOSubmission_userId_fkey";

-- DropForeignKey
ALTER TABLE "Facilitator" DROP CONSTRAINT "Facilitator_userAccountId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropIndex
DROP INDEX "FPOSubmission_userId_idx";

-- DropIndex
DROP INDEX "Facilitator_userAccountId_key";

-- AlterTable
ALTER TABLE "FPOSubmission" DROP COLUMN "claimedAt",
DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "Facilitator" DROP COLUMN "email",
DROP COLUMN "userAccountId";

-- DropTable
DROP TABLE "Account";

-- DropTable
DROP TABLE "AuthAttempt";

-- DropTable
DROP TABLE "AuthToken";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "UserRole";
