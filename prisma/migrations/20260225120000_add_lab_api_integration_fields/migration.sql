-- Add optional API integration fields for partner labs.
-- These remain nullable so existing manual lab flows continue unchanged.
ALTER TABLE "labs"
ADD COLUMN "is_api_integrated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "api_provider" TEXT,
ADD COLUMN "api_base_url" TEXT,
ADD COLUMN "api_auth_type" TEXT,
ADD COLUMN "api_username" TEXT,
ADD COLUMN "api_password" TEXT,
ADD COLUMN "api_key" TEXT,
ADD COLUMN "api_secret" TEXT;
