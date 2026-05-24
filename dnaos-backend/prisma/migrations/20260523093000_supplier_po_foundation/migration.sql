-- AlterEnum
ALTER TYPE "CustomerOrderStatus" ADD VALUE 'PROCUREMENT';

-- CreateEnum
CREATE TYPE "SupplierPoStatus" AS ENUM ('DRAFT', 'SENT', 'ACKNOWLEDGED', 'CONFIRMED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'BILLED', 'PAID', 'CANCELLED', 'REJECTED');

-- CreateTable
CREATE TABLE "supplier_purchase_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "po_no" TEXT NOT NULL,
    "document_group_id" UUID NOT NULL,
    "customer_order_id" UUID NOT NULL,
    "supplier_company_id" UUID NOT NULL,
    "status" "SupplierPoStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(14,2) NOT NULL,
    "vat_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.07,
    "vat_amount" DECIMAL(14,2) NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "supplier_responded_at" TIMESTAMP(3),
    "supplier_response_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_purchase_order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "supplier_purchase_order_id" UUID NOT NULL,
    "customer_order_item_id" UUID NOT NULL,
    "product_variant_id" UUID NOT NULL,
    "supplier_product_id" UUID,
    "description" TEXT,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "unit_cost" DECIMAL(14,2) NOT NULL,
    "total_cost" DECIMAL(14,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "supplier_purchase_orders_po_no_key" ON "supplier_purchase_orders"("po_no");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_purchase_orders_customer_order_id_supplier_company_id_key" ON "supplier_purchase_orders"("customer_order_id", "supplier_company_id");

-- CreateIndex
CREATE INDEX "supplier_purchase_orders_document_group_id_idx" ON "supplier_purchase_orders"("document_group_id");

-- CreateIndex
CREATE INDEX "supplier_purchase_orders_customer_order_id_idx" ON "supplier_purchase_orders"("customer_order_id");

-- CreateIndex
CREATE INDEX "supplier_purchase_orders_supplier_company_id_idx" ON "supplier_purchase_orders"("supplier_company_id");

-- CreateIndex
CREATE INDEX "supplier_purchase_orders_status_idx" ON "supplier_purchase_orders"("status");

-- CreateIndex
CREATE INDEX "supplier_purchase_order_items_supplier_purchase_order_id_idx" ON "supplier_purchase_order_items"("supplier_purchase_order_id");

-- CreateIndex
CREATE INDEX "supplier_purchase_order_items_customer_order_item_id_idx" ON "supplier_purchase_order_items"("customer_order_item_id");

-- CreateIndex
CREATE INDEX "supplier_purchase_order_items_product_variant_id_idx" ON "supplier_purchase_order_items"("product_variant_id");

-- CreateIndex
CREATE INDEX "supplier_purchase_order_items_supplier_product_id_idx" ON "supplier_purchase_order_items"("supplier_product_id");

-- AddForeignKey
ALTER TABLE "supplier_purchase_orders" ADD CONSTRAINT "supplier_purchase_orders_document_group_id_fkey" FOREIGN KEY ("document_group_id") REFERENCES "document_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_purchase_orders" ADD CONSTRAINT "supplier_purchase_orders_customer_order_id_fkey" FOREIGN KEY ("customer_order_id") REFERENCES "customer_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_purchase_orders" ADD CONSTRAINT "supplier_purchase_orders_supplier_company_id_fkey" FOREIGN KEY ("supplier_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_purchase_order_items" ADD CONSTRAINT "supplier_purchase_order_items_supplier_purchase_order_id_fkey" FOREIGN KEY ("supplier_purchase_order_id") REFERENCES "supplier_purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_purchase_order_items" ADD CONSTRAINT "supplier_purchase_order_items_customer_order_item_id_fkey" FOREIGN KEY ("customer_order_item_id") REFERENCES "customer_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_purchase_order_items" ADD CONSTRAINT "supplier_purchase_order_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_purchase_order_items" ADD CONSTRAINT "supplier_purchase_order_items_supplier_product_id_fkey" FOREIGN KEY ("supplier_product_id") REFERENCES "supplier_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
