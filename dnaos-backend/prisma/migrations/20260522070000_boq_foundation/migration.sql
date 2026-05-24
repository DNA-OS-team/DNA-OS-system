-- CreateEnum
CREATE TYPE "BoqStatus" AS ENUM ('DRAFT', 'FINALIZED', 'CANCELLED');

-- CreateTable
CREATE TABLE "boqs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "boq_no" TEXT NOT NULL,
    "document_group_id" UUID NOT NULL,
    "customer_order_id" UUID NOT NULL,
    "customer_company_id" UUID NOT NULL,
    "pricing_snapshot_id" UUID NOT NULL,
    "status" "BoqStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(14,2) NOT NULL,
    "vat_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.07,
    "vat_amount" DECIMAL(14,2) NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boq_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "boq_id" UUID NOT NULL,
    "customer_order_item_id" UUID NOT NULL,
    "product_variant_id" UUID NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "supplier_unit_cost" DECIMAL(14,2) NOT NULL,
    "supplier_total_cost" DECIMAL(14,2) NOT NULL,
    "sell_unit_price" DECIMAL(14,2) NOT NULL,
    "sell_total_price" DECIMAL(14,2) NOT NULL,
    "margin_amount" DECIMAL(14,2) NOT NULL,
    "margin_percent" DECIMAL(8,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boq_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "boqs_boq_no_key" ON "boqs"("boq_no");

-- CreateIndex
CREATE INDEX "boqs_document_group_id_idx" ON "boqs"("document_group_id");

-- CreateIndex
CREATE INDEX "boqs_customer_order_id_idx" ON "boqs"("customer_order_id");

-- CreateIndex
CREATE INDEX "boqs_customer_company_id_idx" ON "boqs"("customer_company_id");

-- CreateIndex
CREATE INDEX "boqs_pricing_snapshot_id_idx" ON "boqs"("pricing_snapshot_id");

-- CreateIndex
CREATE INDEX "boqs_status_idx" ON "boqs"("status");

-- CreateIndex
CREATE INDEX "boq_items_boq_id_idx" ON "boq_items"("boq_id");

-- CreateIndex
CREATE INDEX "boq_items_customer_order_item_id_idx" ON "boq_items"("customer_order_item_id");

-- CreateIndex
CREATE INDEX "boq_items_product_variant_id_idx" ON "boq_items"("product_variant_id");

-- AddForeignKey
ALTER TABLE "boqs" ADD CONSTRAINT "boqs_document_group_id_fkey" FOREIGN KEY ("document_group_id") REFERENCES "document_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boqs" ADD CONSTRAINT "boqs_customer_order_id_fkey" FOREIGN KEY ("customer_order_id") REFERENCES "customer_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boqs" ADD CONSTRAINT "boqs_customer_company_id_fkey" FOREIGN KEY ("customer_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boqs" ADD CONSTRAINT "boqs_pricing_snapshot_id_fkey" FOREIGN KEY ("pricing_snapshot_id") REFERENCES "pricing_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boq_items" ADD CONSTRAINT "boq_items_boq_id_fkey" FOREIGN KEY ("boq_id") REFERENCES "boqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boq_items" ADD CONSTRAINT "boq_items_customer_order_item_id_fkey" FOREIGN KEY ("customer_order_item_id") REFERENCES "customer_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boq_items" ADD CONSTRAINT "boq_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
