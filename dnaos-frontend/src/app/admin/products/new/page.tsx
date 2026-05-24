import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ProductForm } from "@/features/products/product-form";

export default function NewProductPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <Link
          className={buttonVariants({ variant: "ghost", size: "sm" })}
          href="/admin/products"
        >
          <ArrowLeft />
          Products
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">New product</h1>
          <p className="text-sm text-muted-foreground">
            Create product master data. Supplier pricing is handled later.
          </p>
        </div>
        <ProductForm />
      </div>
    </main>
  );
}
