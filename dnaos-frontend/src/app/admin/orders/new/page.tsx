import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { OrderForm } from "@/features/orders/order-form";

export default function NewOrderPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <Link
          className={buttonVariants({ variant: "ghost", size: "sm" })}
          href="/admin/orders"
        >
          Orders
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">New order</h1>
          <p className="text-sm text-muted-foreground">
            Create an order tied to project documents before pricing.
          </p>
        </div>
        <OrderForm />
      </div>
    </main>
  );
}
