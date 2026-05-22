-- CreateEnum
CREATE TYPE "PartnerProductSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('INITIAL', 'ADJUST', 'RESERVE', 'RELEASE', 'FULFILL', 'CANCEL');

-- CreateTable
CREATE TABLE "partner_product_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "supplier_company_id" UUID NOT NULL,
    "product_variant_id" UUID,
    "supplier_product_id" UUID,
    "requested_product_name" TEXT NOT NULL,
    "requested_category_name" TEXT,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "stock_qty" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "min_qty" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "service_area" TEXT,
    "status" "PartnerProductSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "admin_review_note" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_product_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_inventory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "supplier_product_id" UUID NOT NULL,
    "stock_qty" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "reserved_qty" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "available_qty" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "low_stock_threshold" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "updated_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_inventory_movements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "supplier_product_id" UUID NOT NULL,
    "movement_type" "InventoryMovementType" NOT NULL,
    "qty" DECIMAL(14,3) NOT NULL,
    "before_qty" DECIMAL(14,3) NOT NULL,
    "after_qty" DECIMAL(14,3) NOT NULL,
    "source_type" TEXT,
    "source_id" TEXT,
    "note" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "partner_product_submissions_supplier_company_id_idx" ON "partner_product_submissions"("supplier_company_id");

-- CreateIndex
CREATE INDEX "partner_product_submissions_product_variant_id_idx" ON "partner_product_submissions"("product_variant_id");

-- CreateIndex
CREATE INDEX "partner_product_submissions_supplier_product_id_idx" ON "partner_product_submissions"("supplier_product_id");

-- CreateIndex
CREATE INDEX "partner_product_submissions_status_idx" ON "partner_product_submissions"("status");

-- CreateIndex
CREATE INDEX "partner_product_submissions_reviewed_by_idx" ON "partner_product_submissions"("reviewed_by");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_inventory_supplier_product_id_key" ON "supplier_inventory"("supplier_product_id");

-- CreateIndex
CREATE INDEX "supplier_inventory_available_qty_idx" ON "supplier_inventory"("available_qty");

-- CreateIndex
CREATE INDEX "supplier_inventory_updated_by_idx" ON "supplier_inventory"("updated_by");

-- CreateIndex
CREATE INDEX "supplier_inventory_movements_supplier_product_id_idx" ON "supplier_inventory_movements"("supplier_product_id");

-- CreateIndex
CREATE INDEX "supplier_inventory_movements_movement_type_idx" ON "supplier_inventory_movements"("movement_type");

-- CreateIndex
CREATE INDEX "supplier_inventory_movements_source_type_source_id_idx" ON "supplier_inventory_movements"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "supplier_inventory_movements_created_by_idx" ON "supplier_inventory_movements"("created_by");

-- AddForeignKey
ALTER TABLE "partner_product_submissions" ADD CONSTRAINT "partner_product_submissions_supplier_company_id_fkey" FOREIGN KEY ("supplier_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_product_submissions" ADD CONSTRAINT "partner_product_submissions_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_product_submissions" ADD CONSTRAINT "partner_product_submissions_supplier_product_id_fkey" FOREIGN KEY ("supplier_product_id") REFERENCES "supplier_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_product_submissions" ADD CONSTRAINT "partner_product_submissions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_inventory" ADD CONSTRAINT "supplier_inventory_supplier_product_id_fkey" FOREIGN KEY ("supplier_product_id") REFERENCES "supplier_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_inventory_movements" ADD CONSTRAINT "supplier_inventory_movements_supplier_product_id_fkey" FOREIGN KEY ("supplier_product_id") REFERENCES "supplier_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
