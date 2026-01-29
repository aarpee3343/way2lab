/*
  Warnings:

  - You are about to drop the column `created_at` on the `order_reports` table. All the data in the column will be lost.
  - You are about to drop the column `file_url` on the `order_reports` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `order_reports` table. All the data in the column will be lost.
  - You are about to drop the column `report_type` on the `order_reports` table. All the data in the column will be lost.
  - You are about to drop the column `uploaded_by` on the `order_reports` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "order_reports" DROP COLUMN "created_at",
DROP COLUMN "file_url",
DROP COLUMN "notes",
DROP COLUMN "report_type",
DROP COLUMN "uploaded_by",
ADD COLUMN     "authTag" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "encrypted" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "iv" TEXT,
ADD COLUMN     "reportType" TEXT,
ADD COLUMN     "storagePath" TEXT,
ADD COLUMN     "uploadedBy" TEXT;

-- CreateTable
CREATE TABLE "OrderReportSummary" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderReportSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderReportSummary_orderId_key" ON "OrderReportSummary"("orderId");

-- AddForeignKey
ALTER TABLE "OrderReportSummary" ADD CONSTRAINT "OrderReportSummary_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
