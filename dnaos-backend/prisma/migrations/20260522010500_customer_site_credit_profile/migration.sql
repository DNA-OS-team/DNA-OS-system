-- CreateEnum
CREATE TYPE "CreditStatus" AS ENUM ('NORMAL', 'WATCH', 'HOLD', 'BLOCKED');

-- CreateTable
CREATE TABLE "customer_sites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_company_id" UUID NOT NULL,
    "site_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "subdistrict" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "gps_lat" DECIMAL(10,7),
    "gps_lng" DECIMAL(10,7),
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "delivery_note" TEXT,
    "access_restriction" TEXT,
    "preferred_delivery_time" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_credit_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_company_id" UUID NOT NULL,
    "credit_limit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "credit_term_days" INTEGER NOT NULL DEFAULT 0,
    "current_outstanding" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "overdue_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "credit_status" "CreditStatus" NOT NULL DEFAULT 'NORMAL',
    "payment_behavior_score" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_credit_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_sites_customer_company_id_idx" ON "customer_sites"("customer_company_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_credit_profiles_customer_company_id_key" ON "customer_credit_profiles"("customer_company_id");

-- AddForeignKey
ALTER TABLE "customer_sites" ADD CONSTRAINT "customer_sites_customer_company_id_fkey" FOREIGN KEY ("customer_company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_credit_profiles" ADD CONSTRAINT "customer_credit_profiles_customer_company_id_fkey" FOREIGN KEY ("customer_company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
