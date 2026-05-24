import { ProductCategories } from "@/features/products/product-categories";

export default function ProductCategoriesPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <ProductCategories />
      </div>
    </main>
  );
}
