"use client";

import { ArrowLeft, Boxes } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getProduct } from "./product-api";
import { ProductForm } from "./product-form";
import type { Product } from "./types";

type ProductDetailProps = {
  productId: string;
};

export function ProductDetail({ productId }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getProduct(productId)
      .then((result) => {
        if (isMounted) {
          setProduct(result.product);
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load product"
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  return (
    <div className="space-y-5">
      <Link
        className={buttonVariants({ variant: "ghost", size: "sm" })}
        href="/admin/products"
      >
        <ArrowLeft />
        Products
      </Link>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Product unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading product...</p>
      ) : null}

      {product ? (
        <>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant={product.isActive ? "secondary" : "outline"}>
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline">{product.category?.name}</Badge>
              </div>
              <h1 className="text-2xl font-semibold tracking-normal">
                {product.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Maintain product master data without supplier pricing.
              </p>
            </div>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/admin/products/${product.id}/variants`}
            >
              <Boxes />
              Variants
            </Link>
          </div>
          <Separator />
          <ProductForm product={product} />
        </>
      ) : null}
    </div>
  );
}
