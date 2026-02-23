-- AlterTable
ALTER TABLE "order_reports"
ADD COLUMN "file_name" TEXT,
ADD COLUMN "file_size_bytes" INTEGER,
ADD COLUMN "optimized_size_bytes" INTEGER,
ADD COLUMN "covered_order_item_ids" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];

-- CreateIndex
CREATE INDEX "order_reports_order_id_report_type_idx" ON "order_reports"("order_id", "report_type");
