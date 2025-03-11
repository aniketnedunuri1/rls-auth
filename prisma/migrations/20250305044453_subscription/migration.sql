/*
  Warnings:

  - You are about to drop the column `subscription_status` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "subscription_status",
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "subscriptionExpiry" TIMESTAMP(3),
ADD COLUMN     "subscriptionStatus" TEXT DEFAULT 'free';
