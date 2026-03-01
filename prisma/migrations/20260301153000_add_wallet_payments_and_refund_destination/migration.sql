DO $$
BEGIN
  CREATE TYPE "RefundDestination" AS ENUM ('SOURCE', 'WALLET');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "wallet_amount_used" DECIMAL(10,2) NOT NULL DEFAULT 0.00;

ALTER TABLE "payment_refunds"
ADD COLUMN IF NOT EXISTS "destination" "RefundDestination" NOT NULL DEFAULT 'SOURCE';

ALTER TABLE "payment_refunds"
ADD COLUMN IF NOT EXISTS "wallet_transaction_id" INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS "payment_refunds_wallet_transaction_id_key"
ON "payment_refunds"("wallet_transaction_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payment_refunds_wallet_transaction_id_fkey'
  ) THEN
    ALTER TABLE "payment_refunds"
    ADD CONSTRAINT "payment_refunds_wallet_transaction_id_fkey"
    FOREIGN KEY ("wallet_transaction_id") REFERENCES "wallet_transactions"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;
