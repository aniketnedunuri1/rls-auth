/*
  Warnings:

  - Added the required column `categoryId` to the `Test` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryName` to the `Test` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "supabaseAnonKey" TEXT,
ADD COLUMN     "supabaseUrl" TEXT,
ALTER COLUMN "dbSchema" DROP NOT NULL,
ALTER COLUMN "rlsSchema" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "categoryName" TEXT NOT NULL,
ADD COLUMN     "solution" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "selectedProjectId" TEXT;
