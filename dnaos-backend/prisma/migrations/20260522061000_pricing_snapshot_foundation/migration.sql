-- CreateEnum
CREATE TYPE "PricingSnapshotStatus" AS ENUM ('CALCULATED', 'NEEDS_REVIEW');

-- CreateTable
CREATE TABLE "pricing_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_order_id" UUID NOT NULL,
    "status" "PricingSnapshotStatus" NOT NULL DEFAULT 'CALCULATED',
    "total_supplier_cost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_sell_price" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_margin" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "margin_percent" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_snapshot_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pricing_snapshot_id" UUID NOT NULL,
    "customer_order_item_id" UUID NOT NULL,
    "product_variant_id" UUID NOT NULL,
    "supplier_product_id" UUID,
    "supplier_company_id" UUID,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "supplier_unit_cost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "supplier_total_cost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sell_unit_price" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sell_total_price" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "margin_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "margin_percent" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "is_available" BOOLEAN NOT NULL DEFAULT false,
    "has_enough_stock" BOOLEAN NOT NULL DEFAULT false,
    "warning" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_snapshot_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pricing_snapshots_customer_order_id_idx" ON "pricing_snapshots"("customer_order_id");

-- CreateIndex
CREATE INDEX "pricing_snapshots_status_idx" ON "pricing_snapshots"("status");

-- CreateIndex
CREATE INDEX "pricing_snapshot_items_pricing_snapshot_id_idx" ON "pricing_snapshot_items"("pricing_snapshot_id");

-- CreateIndex
CREATE INDEX "pricing_snapshot_items_customer_order_item_id_idx" ON "pricing_snapshot_items"("customer_order_item_id");

-- CreateIndex
CREATE INDEX "pricing_snapshot_items_product_variant_id_idx" ON "pricing_snapshot_items"("product_variant_id");

-- CreateIndex
CREATE INDEX "pricing_snapshot_items_supplier_product_id_idx" ON "pricing_snapshot_items"("supplier_product_id");

-- CreateIndex
CREATE INDEX "pricing_snapshot_items_supplier_company_id_idx" ON "pricing_snapshot_items"("supplier_company_id");

-- AddForeignKey
ALTER TABLE "pricing_snapshots" ADD CONSTRAINT "pricing_snapshots_customer_order_id_fkey" FOREIGN KEY ("customer_order_id") REFERENCES "customer_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_snapshot_items" ADD CONSTRAINT "pricing_snapshot_items_pricing_snapshot_id_fkey" FOREIGN KEY ("pricing_snapshot_id") REFERENCES "pricing_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_snapshot_items" ADD CONSTRAINT "pricing_snapshot_items_customer_order_item_id_fkey" FOREIGN KEY ("customer_order_item_id") REFERENCES "customer_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_snapshot_items" ADD CONSTRAINT "pricing_snapshot_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_snapshot_items" ADD CONSTRAINT "pricing_snapshot_items_supplier_product_id_fkey" FOREIGN KEY ("supplier_product_id") REFERENCES "supplier_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_snapshot_items" ADD CONSTRAINT "pricing_snapshot_items_supplier_company_id_fkey" FOREIGN KEY ("supplier_company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
