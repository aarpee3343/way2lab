/*
  Warnings:

  - The `authTag` column on the `order_reports` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `iv` column on the `order_reports` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "order_reports" DROP COLUMN "authTag",
ADD COLUMN     "authTag" BYTEA,
DROP COLUMN "iv",
ADD COLUMN     "iv" BYTEA;
