/*
  Warnings:

  - Added the required column `type` to the `Leave` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Leave" ADD COLUMN     "adminNote" TEXT,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'pending';
