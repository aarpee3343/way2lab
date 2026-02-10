-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('INITIATED', 'PROCESSED', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "payments"
ADD COLUMN "payment_type" TEXT NOT NULL DEFAULT 'PAYMENT',
ADD COLUMN "gateway" TEXT,
ADD COLUMN "refunded_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN "received_by_admin_id" INTEGER;

-- CreateTable
CREATE TABLE "payment_refunds" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "payment_id" INTEGER,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'Manual',
    "transaction_id" TEXT,
    "notes" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'INITIATED',
    "created_by_admin_id" INTEGER,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payments_order_id_payment_date_idx" ON "payments"("order_id", "payment_date");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payment_refunds_order_id_status_idx" ON "payment_refunds"("order_id", "status");

-- CreateIndex
CREATE INDEX "payment_refunds_created_at_idx" ON "payment_refunds"("created_at");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_received_by_admin_id_fkey" FOREIGN KEY ("received_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
