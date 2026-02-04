-- CreateEnum
CREATE TYPE "OnsiteCampStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED');

-- AlterTable
ALTER TABLE "corporates" ADD COLUMN     "logo_url" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "onsite_lab_name" TEXT;

-- CreateTable
CREATE TABLE "onsite_camps" (
    "id" SERIAL NOT NULL,
    "corporate_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" "OnsiteCampStatus" NOT NULL DEFAULT 'PLANNED',
    "expected_headcount" INTEGER,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_admin_id" INTEGER,

    CONSTRAINT "onsite_camps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onsite_camp_packages" (
    "id" SERIAL NOT NULL,
    "camp_id" INTEGER NOT NULL,
    "package_id" INTEGER NOT NULL,

    CONSTRAINT "onsite_camp_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onsite_templates" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onsite_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onsite_entries" (
    "id" SERIAL NOT NULL,
    "camp_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "package_id" INTEGER NOT NULL,
    "order_id" INTEGER,
    "template_id" INTEGER,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_admin_id" INTEGER,

    CONSTRAINT "onsite_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "onsite_camp_packages_camp_id_package_id_key" ON "onsite_camp_packages"("camp_id", "package_id");

-- CreateIndex
CREATE UNIQUE INDEX "onsite_entries_order_id_key" ON "onsite_entries"("order_id");

-- AddForeignKey
ALTER TABLE "onsite_camps" ADD CONSTRAINT "onsite_camps_corporate_id_fkey" FOREIGN KEY ("corporate_id") REFERENCES "corporates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onsite_camps" ADD CONSTRAINT "onsite_camps_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onsite_camp_packages" ADD CONSTRAINT "onsite_camp_packages_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "onsite_camps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onsite_camp_packages" ADD CONSTRAINT "onsite_camp_packages_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onsite_templates" ADD CONSTRAINT "onsite_templates_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onsite_entries" ADD CONSTRAINT "onsite_entries_camp_id_fkey" FOREIGN KEY ("camp_id") REFERENCES "onsite_camps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onsite_entries" ADD CONSTRAINT "onsite_entries_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onsite_entries" ADD CONSTRAINT "onsite_entries_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onsite_entries" ADD CONSTRAINT "onsite_entries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onsite_entries" ADD CONSTRAINT "onsite_entries_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onsite_entries" ADD CONSTRAINT "onsite_entries_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "onsite_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
