import { SupplierInventoryList } from "@/features/partner-products/supplier-inventory-list";

export default function SupplierInventoryPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <SupplierInventoryList />
      </div>
    </main>
  );
}
