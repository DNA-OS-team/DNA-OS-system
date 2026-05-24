-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'CASH', 'CHEQUE', 'CREDIT_CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoice_no" TEXT NOT NULL,
    "invoice_status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "customer_company_id" UUID NOT NULL,
    "customer_order_id" UUID,
    "project_id" UUID,
    "invoice_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3),
    "reference_no" TEXT,
    "recipient_address" TEXT,
    "notes" TEXT,
    "vat_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.07,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "vat_amount" DECIMAL(14,2) NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "paid_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "receipt_no" TEXT,
    "receipt_issued_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoice_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'รายการ',
    "unit_price" DECIMAL(14,2) NOT NULL,
    "total_price" DECIMAL(14,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoice_id" UUID NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL,
    "reference_no" TEXT,
    "bank_ref" TEXT,
    "slip_url" TEXT,
    "notes" TEXT,
    "confirmed_by" UUID,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_no_key" ON "invoices"("invoice_no");
CREATE UNIQUE INDEX "invoices_receipt_no_key" ON "invoices"("receipt_no");
CREATE INDEX "invoices_customer_company_id_idx" ON "invoices"("customer_company_id");
CREATE INDEX "invoices_customer_order_id_idx" ON "invoices"("customer_order_id");
CREATE INDEX "invoices_project_id_idx" ON "invoices"("project_id");
CREATE INDEX "invoices_invoice_status_idx" ON "invoices"("invoice_status");
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");
CREATE INDEX "payments_payment_status_idx" ON "payments"("payment_status");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_company_id_fkey"
    FOREIGN KEY ("customer_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_order_id_fkey"
    FOREIGN KEY ("customer_order_id") REFERENCES "customer_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey"
    FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey"
    FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_confirmed_by_fkey"
    FOREIGN KEY ("confirmed_by") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
