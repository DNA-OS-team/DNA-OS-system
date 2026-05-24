-- Add firstContactAt and debtStartAt to debt_snapshots (24h debt timer rule)
ALTER TABLE "debt_snapshots" ADD COLUMN "first_contact_at" TIMESTAMP(3);
ALTER TABLE "debt_snapshots" ADD COLUMN "debt_start_at" TIMESTAMP(3);

-- Add totalTrips and deliveredTrips to customer_order_items (auto-invoice trigger)
ALTER TABLE "customer_order_items" ADD COLUMN "total_trips" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "customer_order_items" ADD COLUMN "delivered_trips" INTEGER NOT NULL DEFAULT 0;
