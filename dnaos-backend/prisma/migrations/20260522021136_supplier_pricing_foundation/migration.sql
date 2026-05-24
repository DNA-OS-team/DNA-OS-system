-- CreateEnum
CREATE TYPE "SupplierContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED');

-- CreateTable
CREATE TABLE "supplier_products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "supplier_company_id" UUID NOT NULL,
    "product_variant_id" UUID NOT NULL,
    "sku" TEXT,
    "price" DECIMAL(14,2) NOT NULL,
    "min_qty" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "service_area" TEXT,
    "lead_time_hours" INTEGER NOT NULL DEFAULT 0,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_contracts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "supplier_company_id" UUID NOT NULL,
    "contract_no" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "payment_term_days" INTEGER NOT NULL DEFAULT 0,
    "delivery_term" TEXT,
    "price_validity" TEXT,
    "status" "SupplierContractStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_contract_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "supplier_contract_id" UUID NOT NULL,
    "product_variant_id" UUID NOT NULL,
    "unit_cost" DECIMAL(14,2) NOT NULL,
    "min_qty" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "max_qty" DECIMAL(14,3),
    "service_area" TEXT,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_contract_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_histories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "old_price" DECIMAL(14,2),
    "new_price" DECIMAL(14,2) NOT NULL,
    "changed_by" UUID,
    "reason" TEXT,
    "effective_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supplier_products_supplier_company_id_idx" ON "supplier_products"("supplier_company_id");

-- CreateIndex
CREATE INDEX "supplier_products_product_variant_id_idx" ON "supplier_products"("product_variant_id");

-- CreateIndex
CREATE INDEX "supplier_products_is_available_idx" ON "supplier_products"("is_available");

-- CreateIndex
CREATE INDEX "supplier_contracts_supplier_company_id_idx" ON "supplier_contracts"("supplier_company_id");

-- CreateIndex
CREATE INDEX "supplier_contracts_status_idx" ON "supplier_contracts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_contracts_supplier_company_id_contract_no_key" ON "supplier_contracts"("supplier_company_id", "contract_no");

-- CreateIndex
CREATE INDEX "supplier_contract_items_supplier_contract_id_idx" ON "supplier_contract_items"("supplier_contract_id");

-- CreateIndex
CREATE INDEX "supplier_contract_items_product_variant_id_idx" ON "supplier_contract_items"("product_variant_id");

-- CreateIndex
CREATE INDEX "supplier_contract_items_effective_from_effective_to_idx" ON "supplier_contract_items"("effective_from", "effective_to");

-- CreateIndex
CREATE INDEX "price_histories_entity_type_entity_id_idx" ON "price_histories"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "price_histories_changed_by_idx" ON "price_histories"("changed_by");

-- CreateIndex
CREATE INDEX "price_histories_effective_at_idx" ON "price_histories"("effective_at");

-- AddForeignKey
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_supplier_company_id_fkey" FOREIGN KEY ("supplier_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_contracts" ADD CONSTRAINT "supplier_contracts_supplier_company_id_fkey" FOREIGN KEY ("supplier_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_contract_items" ADD CONSTRAINT "supplier_contract_items_supplier_contract_id_fkey" FOREIGN KEY ("supplier_contract_id") REFERENCES "supplier_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_contract_items" ADD CONSTRAINT "supplier_contract_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_histories" ADD CONSTRAINT "price_histories_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
