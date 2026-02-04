/*
  Warnings:

  - You are about to drop the column `commissionPercent` on the `associates` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `associates` table. All the data in the column will be lost.
  - You are about to drop the column `couponScope` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `discountType` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `discountValue` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `expiryDate` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `maxDiscountAmount` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `minOrderValue` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `usageLimit` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `usedCount` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `userLimit` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `customer_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `family_members` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `order_activities` table. All the data in the column will be lost.
  - You are about to drop the column `newValue` on the `order_activities` table. All the data in the column will be lost.
  - You are about to drop the column `oldValue` on the `order_activities` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `order_activities` table. All the data in the column will be lost.
  - You are about to drop the column `performedBy` on the `order_activities` table. All the data in the column will be lost.
  - You are about to drop the column `authTag` on the `order_reports` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `order_reports` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `order_reports` table. All the data in the column will be lost.
  - You are about to drop the column `reportType` on the `order_reports` table. All the data in the column will be lost.
  - You are about to drop the column `storagePath` on the `order_reports` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedBy` on the `order_reports` table. All the data in the column will be lost.
  - You are about to drop the column `collectionInstructions` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `couponId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `patientGender` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `patientName` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `patientPhone` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `technicianId` on the `orders` table. All the data in the column will be lost.
  - You are about to alter the column `discount` on the `packages` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(5,2)`.
  - You are about to drop the column `associateId` on the `payouts` table. All the data in the column will be lost.
  - You are about to drop the column `payoutDate` on the `payouts` table. All the data in the column will be lost.
  - You are about to drop the column `transactionRef` on the `payouts` table. All the data in the column will be lost.
  - The primary key for the `technician_labs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `labId` on the `technician_labs` table. All the data in the column will be lost.
  - You are about to drop the column `technicianId` on the `technician_labs` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `technicians` table. All the data in the column will be lost.
  - You are about to drop the `OrderReportSummary` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[phone]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `commission_percent` to the `associates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coupon_scope` to the `coupons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discount_type` to the `coupons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discount_value` to the `coupons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customer_id` to the `customer_addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customer_id` to the `family_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order_id` to the `order_activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `performed_by` to the `order_activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order_id` to the `order_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patient_name` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `associate_id` to the `payouts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lab_id` to the `technician_labs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `technician_id` to the `technician_labs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('USER_PAYS', 'CORPORATE_PAYS');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'LAB', 'TECHNICIAN', 'CORP_ADMIN', 'CORP_SUB_ADMIN');

-- CreateEnum
CREATE TYPE "CorporateRole" AS ENUM ('SUPER_ADMIN', 'DEPT_HEAD', 'LOCATION_MANAGER');

-- AlterEnum
ALTER TYPE "LoginMethod" ADD VALUE 'phone';

-- DropForeignKey
ALTER TABLE "OrderReportSummary" DROP CONSTRAINT "OrderReportSummary_orderId_fkey";

-- DropForeignKey
ALTER TABLE "customer_addresses" DROP CONSTRAINT "customer_addresses_customerId_fkey";

-- DropForeignKey
ALTER TABLE "family_members" DROP CONSTRAINT "family_members_customerId_fkey";

-- DropForeignKey
ALTER TABLE "order_activities" DROP CONSTRAINT "order_activities_orderId_fkey";

-- DropForeignKey
ALTER TABLE "order_reports" DROP CONSTRAINT "order_reports_orderId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_couponId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_technicianId_fkey";

-- DropForeignKey
ALTER TABLE "payouts" DROP CONSTRAINT "payouts_associateId_fkey";

-- DropForeignKey
ALTER TABLE "technician_labs" DROP CONSTRAINT "technician_labs_labId_fkey";

-- DropForeignKey
ALTER TABLE "technician_labs" DROP CONSTRAINT "technician_labs_technicianId_fkey";

-- AlterTable
ALTER TABLE "associates" DROP COLUMN "commissionPercent",
DROP COLUMN "isActive",
ADD COLUMN     "commission_percent" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "coupons" DROP COLUMN "couponScope",
DROP COLUMN "createdAt",
DROP COLUMN "discountType",
DROP COLUMN "discountValue",
DROP COLUMN "expiryDate",
DROP COLUMN "isActive",
DROP COLUMN "maxDiscountAmount",
DROP COLUMN "minOrderValue",
DROP COLUMN "startDate",
DROP COLUMN "usageLimit",
DROP COLUMN "usedCount",
DROP COLUMN "userLimit",
ADD COLUMN     "coupon_scope" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "discount_type" TEXT NOT NULL,
ADD COLUMN     "discount_value" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "expiry_date" TIMESTAMP(3),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "max_discount_amount" DECIMAL(10,2),
ADD COLUMN     "min_order_value" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "usage_limit" INTEGER,
ADD COLUMN     "used_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "user_limit" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "customer_addresses" DROP COLUMN "customerId",
ADD COLUMN     "customer_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "corporate_id" INTEGER,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "employee_id" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "family_members" DROP COLUMN "customerId",
ADD COLUMN     "customer_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "order_activities" DROP COLUMN "createdAt",
DROP COLUMN "newValue",
DROP COLUMN "oldValue",
DROP COLUMN "orderId",
DROP COLUMN "performedBy",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "new_value" TEXT,
ADD COLUMN     "old_value" TEXT,
ADD COLUMN     "order_id" INTEGER NOT NULL,
ADD COLUMN     "performed_by" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "order_reports" DROP COLUMN "authTag",
DROP COLUMN "createdAt",
DROP COLUMN "orderId",
DROP COLUMN "reportType",
DROP COLUMN "storagePath",
DROP COLUMN "uploadedBy",
ADD COLUMN     "auth_tag" BYTEA,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "order_id" INTEGER NOT NULL,
ADD COLUMN     "report_type" TEXT,
ADD COLUMN     "storage_path" TEXT,
ADD COLUMN     "uploaded_by" TEXT;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "collectionInstructions",
DROP COLUMN "couponId",
DROP COLUMN "patientGender",
DROP COLUMN "patientName",
DROP COLUMN "patientPhone",
DROP COLUMN "technicianId",
ADD COLUMN     "collection_instructions" TEXT,
ADD COLUMN     "coupon_id" INTEGER,
ADD COLUMN     "is_report_shared_with_corp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "package_id" INTEGER,
ADD COLUMN     "patient_gender" TEXT,
ADD COLUMN     "patient_name" TEXT NOT NULL,
ADD COLUMN     "patient_phone" TEXT,
ADD COLUMN     "technician_id" INTEGER;

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "category" TEXT,
ADD COLUMN     "corporate_id" INTEGER,
ADD COLUMN     "is_corporate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_pre_employment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payment_type" "PaymentType" DEFAULT 'USER_PAYS',
ADD COLUMN     "show_on_homepage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tag" TEXT,
ALTER COLUMN "discount" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "payouts" DROP COLUMN "associateId",
DROP COLUMN "payoutDate",
DROP COLUMN "transactionRef",
ADD COLUMN     "associate_id" INTEGER NOT NULL,
ADD COLUMN     "payout_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "transaction_ref" TEXT;

-- AlterTable
ALTER TABLE "technician_labs" DROP CONSTRAINT "technician_labs_pkey",
DROP COLUMN "labId",
DROP COLUMN "technicianId",
ADD COLUMN     "lab_id" INTEGER NOT NULL,
ADD COLUMN     "technician_id" INTEGER NOT NULL,
ADD CONSTRAINT "technician_labs_pkey" PRIMARY KEY ("technician_id", "lab_id");

-- AlterTable
ALTER TABLE "technicians" DROP COLUMN "isActive",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "OrderReportSummary";

-- CreateTable
CREATE TABLE "verification_codes" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_relations" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "related_package_id" INTEGER NOT NULL,

    CONSTRAINT "package_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_report_summaries" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_report_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporates" (
    "id" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "panNumber" TEXT,
    "gstin" TEXT,
    "employeeCount" INTEGER NOT NULL DEFAULT 0,
    "domains" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "corporates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_services" (
    "id" SERIAL NOT NULL,
    "corporate_id" INTEGER NOT NULL,
    "package_id" INTEGER,
    "coupon_id" INTEGER,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_till" TIMESTAMP(3) NOT NULL,
    "self_payment_type" "PaymentType" NOT NULL DEFAULT 'CORPORATE_PAYS',
    "family_payment_type" "PaymentType" NOT NULL DEFAULT 'USER_PAYS',
    "self_usage_limit" INTEGER NOT NULL DEFAULT 1,
    "family_usage_limit" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "corporate_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_users" (
    "id" SERIAL NOT NULL,
    "corporateId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "CorporateRole" NOT NULL DEFAULT 'SUPER_ADMIN',
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "maskContactInfo" BOOLEAN NOT NULL DEFAULT true,
    "accessDept" TEXT,
    "accessLocation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "corporate_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_packages" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "package_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "availed_at" TIMESTAMP(3),
    "paid_by" "PaymentType" NOT NULL,

    CONSTRAINT "employee_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateTicket" (
    "id" SERIAL NOT NULL,
    "corporateId" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_requests" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateActivity" (
    "id" SERIAL NOT NULL,
    "corporateId" INTEGER NOT NULL,
    "performedBy" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorporateActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "senderType" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "cover_image" TEXT,
    "seo_title" TEXT,
    "seo_desc" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "State" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pincode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "cityId" INTEGER NOT NULL,

    CONSTRAINT "Pincode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verification_codes_phone_key" ON "verification_codes"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_key_key" ON "app_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "package_relations_package_id_related_package_id_key" ON "package_relations"("package_id", "related_package_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_report_summaries_order_id_key" ON "order_report_summaries"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "corporates_email_key" ON "corporates"("email");

-- CreateIndex
CREATE UNIQUE INDEX "corporate_users_email_key" ON "corporate_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "State_name_key" ON "State"("name");

-- CreateIndex
CREATE UNIQUE INDEX "City_name_stateId_key" ON "City"("name", "stateId");

-- CreateIndex
CREATE INDEX "Pincode_code_idx" ON "Pincode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "orders_user_id_status_idx" ON "orders"("user_id", "status");

-- CreateIndex
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_associate_id_fkey" FOREIGN KEY ("associate_id") REFERENCES "associates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_corporate_id_fkey" FOREIGN KEY ("corporate_id") REFERENCES "corporates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_labs" ADD CONSTRAINT "technician_labs_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technicians"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_labs" ADD CONSTRAINT "technician_labs_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "labs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_corporate_id_fkey" FOREIGN KEY ("corporate_id") REFERENCES "corporates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_relations" ADD CONSTRAINT "package_relations_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_relations" ADD CONSTRAINT "package_relations_related_package_id_fkey" FOREIGN KEY ("related_package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technicians"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_reports" ADD CONSTRAINT "order_reports_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_report_summaries" ADD CONSTRAINT "order_report_summaries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_activities" ADD CONSTRAINT "order_activities_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corporate_services" ADD CONSTRAINT "corporate_services_corporate_id_fkey" FOREIGN KEY ("corporate_id") REFERENCES "corporates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corporate_services" ADD CONSTRAINT "corporate_services_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corporate_services" ADD CONSTRAINT "corporate_services_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corporate_users" ADD CONSTRAINT "corporate_users_corporateId_fkey" FOREIGN KEY ("corporateId") REFERENCES "corporates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_packages" ADD CONSTRAINT "employee_packages_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_packages" ADD CONSTRAINT "employee_packages_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateTicket" ADD CONSTRAINT "CorporateTicket_corporateId_fkey" FOREIGN KEY ("corporateId") REFERENCES "corporates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateActivity" ADD CONSTRAINT "CorporateActivity_corporateId_fkey" FOREIGN KEY ("corporateId") REFERENCES "corporates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "CorporateTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pincode" ADD CONSTRAINT "Pincode_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;
