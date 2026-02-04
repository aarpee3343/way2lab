-- CreateEnum
CREATE TYPE "ReportVisibility" AS ENUM ('USER_ONLY', 'CORPORATE_ONLY', 'BOTH');

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "report_visibility" "ReportVisibility" NOT NULL DEFAULT 'USER_ONLY';

-- AlterTable
ALTER TABLE "corporate_services" ADD COLUMN     "report_visibility_override" "ReportVisibility";

-- AlterTable
ALTER TABLE "onsite_camps" ADD COLUMN     "lab_name" TEXT;
