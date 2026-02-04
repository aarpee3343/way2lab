/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `admins` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `admins` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN');

-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "phone" VARCHAR(20),
ADD COLUMN     "role" "AdminRole" NOT NULL DEFAULT 'SUPER_ADMIN',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "admins_phone_key" ON "admins"("phone");
