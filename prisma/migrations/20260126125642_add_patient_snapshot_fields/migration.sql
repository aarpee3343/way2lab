-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "CouponScope" AS ENUM ('GLOBAL', 'LAB', 'TEST', 'PACKAGE', 'SPECIALTY');

-- CreateEnum
CREATE TYPE "LoginMethod" AS ENUM ('email', 'google');

-- CreateEnum
CREATE TYPE "LabStatus" AS ENUM ('Active', 'Pending', 'Disabled');

-- CreateEnum
CREATE TYPE "OrderBookingSource" AS ENUM ('Customer', 'Admin');

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "associates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "commissionPercent" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "associates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" SERIAL NOT NULL,
    "associateId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payoutDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionRef" TEXT,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "uhid" VARCHAR(20),
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "password" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "gender" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activation_token" TEXT,
    "reset_token_hash" TEXT,
    "reset_token_expires_at" TIMESTAMP(3),
    "google_id" TEXT,
    "avatar" TEXT,
    "login_method" "LoginMethod" NOT NULL DEFAULT 'email',

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_addresses" (
    "id" SERIAL NOT NULL,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "type" TEXT DEFAULT 'Home',
    "customerId" INTEGER NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_members" (
    "id" SERIAL NOT NULL,
    "uhid" TEXT,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "gender" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "phone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" INTEGER NOT NULL,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labs" (
    "id" SERIAL NOT NULL,
    "lab_name" TEXT NOT NULL,
    "city" TEXT,
    "pincode" TEXT,
    "address" TEXT,
    "contact_no" TEXT,
    "email" TEXT,
    "active_status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "home_collection_charges" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "state" TEXT DEFAULT 'HARYANA',
    "pan_no" TEXT DEFAULT 'AALCR3173P',
    "gst_no" TEXT DEFAULT '06AALCR3173P1ZR',
    "status" "LabStatus" NOT NULL DEFAULT 'Pending',
    "password" TEXT DEFAULT 'password123',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "rating" DECIMAL(2,1) NOT NULL DEFAULT 4.5,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "features" JSONB DEFAULT '[]',
    "timings" JSONB,

    CONSTRAINT "labs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_pincodes" (
    "id" SERIAL NOT NULL,
    "lab_id" INTEGER NOT NULL,
    "pincode" VARCHAR(10) NOT NULL,

    CONSTRAINT "lab_pincodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technicians" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "technicians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technician_labs" (
    "technicianId" INTEGER NOT NULL,
    "labId" INTEGER NOT NULL,

    CONSTRAINT "technician_labs_pkey" PRIMARY KEY ("technicianId","labId")
);

-- CreateTable
CREATE TABLE "specialties" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" SERIAL NOT NULL,
    "test_name" TEXT NOT NULL,
    "slug" TEXT,
    "category" TEXT,
    "specialty" TEXT,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "discount" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "schedule_reporting" TEXT,
    "preparation" TEXT,
    "special_instruction" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "show_on_homepage" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" SERIAL NOT NULL,
    "package_name" TEXT NOT NULL,
    "description" TEXT,
    "preparation" TEXT,
    "special_instruction" TEXT,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "discount" DECIMAL(65,30),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_tests" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "test_id" INTEGER NOT NULL,

    CONSTRAINT "package_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_tests" (
    "id" SERIAL NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "lab_id" INTEGER NOT NULL,
    "test_id" INTEGER NOT NULL,

    CONSTRAINT "lab_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_packages" (
    "id" SERIAL NOT NULL,
    "lab_id" INTEGER NOT NULL,
    "package_id" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lab_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" TEXT NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "minOrderValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "maxDiscountAmount" DECIMAL(10,2),
    "usageLimit" INTEGER,
    "userLimit" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "couponScope" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_usage" (
    "id" SERIAL NOT NULL,
    "coupon_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "order_id" INTEGER,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "order_number" TEXT,
    "collectionInstructions" TEXT,
    "patientName" TEXT NOT NULL,
    "patient_dob" TIMESTAMP(3),
    "patientGender" TEXT,
    "patientPhone" TEXT,
    "patient_uhid" TEXT,
    "patient_type" TEXT,
    "patient_relation" TEXT,
    "user_id" INTEGER NOT NULL,
    "lab_id" INTEGER,
    "address_id" INTEGER,
    "associate_id" INTEGER,
    "collection_type" TEXT,
    "preferred_date" TIMESTAMP(3),
    "preferred_time_slot" TEXT,
    "total_amount" DECIMAL(10,2),
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "home_collection_charges" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "final_amount" DECIMAL(10,2),
    "payment_mode" TEXT,
    "payment_status" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "booking_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "booking_source" "OrderBookingSource" NOT NULL DEFAULT 'Customer',
    "couponId" INTEGER,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" SERIAL NOT NULL,
    "item_type" TEXT NOT NULL,
    "item_name" TEXT,
    "base_price" DECIMAL(10,2),
    "price" DECIMAL(10,2),
    "discount" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "is_package" BOOLEAN NOT NULL DEFAULT false,
    "order_id" INTEGER NOT NULL,
    "test_id" INTEGER,
    "package_id" INTEGER,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "transaction_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'verified',
    "notes" TEXT,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_reports" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LabCoupons" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_TestCoupons" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_PackageCoupons" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_SpecialtyCoupons" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_uhid_key" ON "customers"("uhid");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_google_id_key" ON "customers"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "family_members_uhid_key" ON "family_members"("uhid");

-- CreateIndex
CREATE UNIQUE INDEX "technicians_username_key" ON "technicians"("username");

-- CreateIndex
CREATE UNIQUE INDEX "specialties_name_key" ON "specialties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "_LabCoupons_AB_unique" ON "_LabCoupons"("A", "B");

-- CreateIndex
CREATE INDEX "_LabCoupons_B_index" ON "_LabCoupons"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TestCoupons_AB_unique" ON "_TestCoupons"("A", "B");

-- CreateIndex
CREATE INDEX "_TestCoupons_B_index" ON "_TestCoupons"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PackageCoupons_AB_unique" ON "_PackageCoupons"("A", "B");

-- CreateIndex
CREATE INDEX "_PackageCoupons_B_index" ON "_PackageCoupons"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_SpecialtyCoupons_AB_unique" ON "_SpecialtyCoupons"("A", "B");

-- CreateIndex
CREATE INDEX "_SpecialtyCoupons_B_index" ON "_SpecialtyCoupons"("B");

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_associateId_fkey" FOREIGN KEY ("associateId") REFERENCES "associates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_pincodes" ADD CONSTRAINT "lab_pincodes_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "labs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_labs" ADD CONSTRAINT "technician_labs_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "technicians"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_labs" ADD CONSTRAINT "technician_labs_labId_fkey" FOREIGN KEY ("labId") REFERENCES "labs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_tests" ADD CONSTRAINT "package_tests_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_tests" ADD CONSTRAINT "package_tests_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_tests" ADD CONSTRAINT "lab_tests_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "labs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_tests" ADD CONSTRAINT "lab_tests_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_packages" ADD CONSTRAINT "lab_packages_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "labs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_packages" ADD CONSTRAINT "lab_packages_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "labs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "customer_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_associate_id_fkey" FOREIGN KEY ("associate_id") REFERENCES "associates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_reports" ADD CONSTRAINT "order_reports_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LabCoupons" ADD CONSTRAINT "_LabCoupons_A_fkey" FOREIGN KEY ("A") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LabCoupons" ADD CONSTRAINT "_LabCoupons_B_fkey" FOREIGN KEY ("B") REFERENCES "labs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TestCoupons" ADD CONSTRAINT "_TestCoupons_A_fkey" FOREIGN KEY ("A") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TestCoupons" ADD CONSTRAINT "_TestCoupons_B_fkey" FOREIGN KEY ("B") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageCoupons" ADD CONSTRAINT "_PackageCoupons_A_fkey" FOREIGN KEY ("A") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageCoupons" ADD CONSTRAINT "_PackageCoupons_B_fkey" FOREIGN KEY ("B") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpecialtyCoupons" ADD CONSTRAINT "_SpecialtyCoupons_A_fkey" FOREIGN KEY ("A") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpecialtyCoupons" ADD CONSTRAINT "_SpecialtyCoupons_B_fkey" FOREIGN KEY ("B") REFERENCES "specialties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
