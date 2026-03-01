DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallet_accounts_balance_non_negative_chk'
  ) THEN
    ALTER TABLE "wallet_accounts"
    ADD CONSTRAINT "wallet_accounts_balance_non_negative_chk"
    CHECK ("balance" >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallet_accounts_totals_non_negative_chk'
  ) THEN
    ALTER TABLE "wallet_accounts"
    ADD CONSTRAINT "wallet_accounts_totals_non_negative_chk"
    CHECK ("total_credited" >= 0 AND "total_debited" >= 0 AND "total_expired" >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallet_credit_lots_amounts_non_negative_chk'
  ) THEN
    ALTER TABLE "wallet_credit_lots"
    ADD CONSTRAINT "wallet_credit_lots_amounts_non_negative_chk"
    CHECK ("original_amount" >= 0 AND "remaining_amount" >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallet_credit_lots_remaining_le_original_chk'
  ) THEN
    ALTER TABLE "wallet_credit_lots"
    ADD CONSTRAINT "wallet_credit_lots_remaining_le_original_chk"
    CHECK ("remaining_amount" <= "original_amount");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallet_transactions_balance_after_non_negative_chk'
  ) THEN
    ALTER TABLE "wallet_transactions"
    ADD CONSTRAINT "wallet_transactions_balance_after_non_negative_chk"
    CHECK ("balance_after" >= 0);
  END IF;
END $$;
