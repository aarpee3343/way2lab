CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT', 'EXPIRE', 'ADJUSTMENT');
CREATE TYPE "WalletSourceType" AS ENUM ('ADMIN_MANUAL', 'CAMPAIGN', 'ORDER_REWARD', 'ORDER_PAYMENT', 'REFUND_REVERSAL', 'SYSTEM_EXPIRY', 'SYSTEM_ADJUSTMENT');
CREATE TYPE "WalletCreditStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'EXPIRED');
CREATE TYPE "WalletCampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');
CREATE TYPE "WalletCampaignTriggerType" AS ENUM ('CORPORATE_BENEFIT_ORDER', 'NEW_USER_FIRST_ORDER', 'MANUAL_SEGMENT', 'DATE_RANGE_ORDER');

CREATE TABLE "wallet_accounts" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "total_credited" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "total_debited" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "total_expired" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "wallet_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wallet_campaigns" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "trigger_type" "WalletCampaignTriggerType" NOT NULL,
    "status" "WalletCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "reward_amount" DECIMAL(12,2) NOT NULL,
    "reward_validity_days" INTEGER NOT NULL DEFAULT 30,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "rules" JSONB,
    "total_awards" INTEGER NOT NULL DEFAULT 0,
    "total_award_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "last_run_at" TIMESTAMP(3),
    "last_run_note" TEXT,
    "created_by_admin_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "wallet_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wallet_transactions" (
    "id" SERIAL NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "source_type" "WalletSourceType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balance_after" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "expires_at" TIMESTAMP(3),
    "order_id" INTEGER,
    "campaign_id" INTEGER,
    "created_by_admin_id" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wallet_credit_lots" (
    "id" SERIAL NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "campaign_id" INTEGER,
    "created_by_admin_id" INTEGER,
    "original_amount" DECIMAL(12,2) NOT NULL,
    "remaining_amount" DECIMAL(12,2) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "status" "WalletCreditStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "wallet_credit_lots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wallet_campaign_awards" (
    "id" SERIAL NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "order_id" INTEGER,
    "wallet_transaction_id" INTEGER NOT NULL,
    "award_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wallet_campaign_awards_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wallet_accounts_customer_id_key" ON "wallet_accounts"("customer_id");
CREATE UNIQUE INDEX "wallet_campaigns_code_key" ON "wallet_campaigns"("code");
CREATE UNIQUE INDEX "wallet_campaign_awards_wallet_transaction_id_key" ON "wallet_campaign_awards"("wallet_transaction_id");
CREATE UNIQUE INDEX "wallet_campaign_awards_award_key_key" ON "wallet_campaign_awards"("award_key");

CREATE INDEX "wallet_transactions_customer_id_created_at_idx" ON "wallet_transactions"("customer_id", "created_at");
CREATE INDEX "wallet_transactions_wallet_id_created_at_idx" ON "wallet_transactions"("wallet_id", "created_at");
CREATE INDEX "wallet_transactions_campaign_id_created_at_idx" ON "wallet_transactions"("campaign_id", "created_at");
CREATE INDEX "wallet_credit_lots_wallet_id_status_expires_at_idx" ON "wallet_credit_lots"("wallet_id", "status", "expires_at");
CREATE INDEX "wallet_credit_lots_customer_id_status_expires_at_idx" ON "wallet_credit_lots"("customer_id", "status", "expires_at");
CREATE INDEX "wallet_campaigns_status_start_date_end_date_idx" ON "wallet_campaigns"("status", "start_date", "end_date");
CREATE INDEX "wallet_campaign_awards_campaign_id_customer_id_idx" ON "wallet_campaign_awards"("campaign_id", "customer_id");
CREATE INDEX "wallet_campaign_awards_customer_id_created_at_idx" ON "wallet_campaign_awards"("customer_id", "created_at");

ALTER TABLE "wallet_accounts"
ADD CONSTRAINT "wallet_accounts_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wallet_campaigns"
ADD CONSTRAINT "wallet_campaigns_created_by_admin_id_fkey"
FOREIGN KEY ("created_by_admin_id") REFERENCES "admins"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "wallet_transactions"
ADD CONSTRAINT "wallet_transactions_wallet_id_fkey"
FOREIGN KEY ("wallet_id") REFERENCES "wallet_accounts"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wallet_transactions"
ADD CONSTRAINT "wallet_transactions_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wallet_transactions"
ADD CONSTRAINT "wallet_transactions_order_id_fkey"
FOREIGN KEY ("order_id") REFERENCES "orders"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "wallet_transactions"
ADD CONSTRAINT "wallet_transactions_campaign_id_fkey"
FOREIGN KEY ("campaign_id") REFERENCES "wallet_campaigns"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "wallet_transactions"
ADD CONSTRAINT "wallet_transactions_created_by_admin_id_fkey"
FOREIGN KEY ("created_by_admin_id") REFERENCES "admins"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "wallet_credit_lots"
ADD CONSTRAINT "wallet_credit_lots_wallet_id_fkey"
FOREIGN KEY ("wallet_id") REFERENCES "wallet_accounts"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wallet_credit_lots"
ADD CONSTRAINT "wallet_credit_lots_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wallet_credit_lots"
ADD CONSTRAINT "wallet_credit_lots_transaction_id_fkey"
FOREIGN KEY ("transaction_id") REFERENCES "wallet_transactions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wallet_credit_lots"
ADD CONSTRAINT "wallet_credit_lots_campaign_id_fkey"
FOREIGN KEY ("campaign_id") REFERENCES "wallet_campaigns"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "wallet_credit_lots"
ADD CONSTRAINT "wallet_credit_lots_created_by_admin_id_fkey"
FOREIGN KEY ("created_by_admin_id") REFERENCES "admins"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "wallet_campaign_awards"
ADD CONSTRAINT "wallet_campaign_awards_campaign_id_fkey"
FOREIGN KEY ("campaign_id") REFERENCES "wallet_campaigns"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wallet_campaign_awards"
ADD CONSTRAINT "wallet_campaign_awards_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wallet_campaign_awards"
ADD CONSTRAINT "wallet_campaign_awards_order_id_fkey"
FOREIGN KEY ("order_id") REFERENCES "orders"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "wallet_campaign_awards"
ADD CONSTRAINT "wallet_campaign_awards_wallet_transaction_id_fkey"
FOREIGN KEY ("wallet_transaction_id") REFERENCES "wallet_transactions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
