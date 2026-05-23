-- CreateTable
CREATE TABLE "standalone_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_no" TEXT NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "document_date" TIMESTAMP(3) NOT NULL,
    "customer_company_id" UUID,
    "partner_company_id" UUID,
    "project_id" UUID,
    "customer_order_id" UUID,
    "reference_no" TEXT,
    "recipient_address" TEXT,
    "notes" TEXT,
    "vat_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.07,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "vat_amount" DECIMAL(14,2) NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standalone_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standalone_document_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "total_price" DECIMAL(14,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "standalone_document_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "standalone_documents_document_no_key" ON "standalone_documents"("document_no");

-- CreateIndex
CREATE INDEX "standalone_documents_customer_company_id_idx" ON "standalone_documents"("customer_company_id");

-- CreateIndex
CREATE INDEX "standalone_documents_partner_company_id_idx" ON "standalone_documents"("partner_company_id");

-- CreateIndex
CREATE INDEX "standalone_documents_project_id_idx" ON "standalone_documents"("project_id");

-- CreateIndex
CREATE INDEX "standalone_documents_customer_order_id_idx" ON "standalone_documents"("customer_order_id");

-- CreateIndex
CREATE INDEX "standalone_documents_document_type_idx" ON "standalone_documents"("document_type");

-- CreateIndex
CREATE INDEX "standalone_document_items_document_id_idx" ON "standalone_document_items"("document_id");

-- AddForeignKey
ALTER TABLE "standalone_documents" ADD CONSTRAINT "standalone_documents_customer_company_id_fkey" FOREIGN KEY ("customer_company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standalone_documents" ADD CONSTRAINT "standalone_documents_partner_company_id_fkey" FOREIGN KEY ("partner_company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standalone_documents" ADD CONSTRAINT "standalone_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standalone_documents" ADD CONSTRAINT "standalone_documents_customer_order_id_fkey" FOREIGN KEY ("customer_order_id") REFERENCES "customer_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standalone_document_items" ADD CONSTRAINT "standalone_document_items_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "standalone_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
