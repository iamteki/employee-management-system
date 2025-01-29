/*
  Warnings:

  - You are about to drop the `Leave` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Leave" DROP CONSTRAINT "Leave_employeeId_fkey";

-- DropTable
DROP TABLE "Leave";
