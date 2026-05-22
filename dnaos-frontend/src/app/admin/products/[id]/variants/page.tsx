import { ProductVariants } from "@/features/products/product-variants";

type ProductVariantsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductVariantsPage({
  params,
}: ProductVariantsPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <ProductVariants productId={id} />
      </div>
    </main>
  );
}
