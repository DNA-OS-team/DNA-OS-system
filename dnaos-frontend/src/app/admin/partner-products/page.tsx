import { PartnerProductList } from "@/features/partner-products/partner-product-list";

export default function PartnerProductsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <PartnerProductList />
      </div>
    </main>
  );
}
