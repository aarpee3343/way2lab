/*
  Warnings:

  - You are about to drop the column `report_visibility_override` on the `corporate_services` table. All the data in the column will be lost.
  - You are about to drop the column `lab_name` on the `onsite_camps` table. All the data in the column will be lost.
  - You are about to drop the column `report_visibility` on the `packages` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "corporate_services" DROP COLUMN "report_visibility_override";

-- AlterTable
ALTER TABLE "onsite_camps" DROP COLUMN "lab_name";

-- AlterTable
ALTER TABLE "packages" DROP COLUMN "report_visibility";

-- DropEnum
DROP TYPE "ReportVisibility";
