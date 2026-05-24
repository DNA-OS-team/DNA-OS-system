import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { CustomerForm } from "@/features/customers/customer-form";

export default function NewCustomerPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <Link
          className={buttonVariants({ variant: "ghost", size: "sm" })}
          href="/admin/customers"
        >
          <ArrowLeft />
          Customers
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">New customer</h1>
          <p className="text-sm text-muted-foreground">
            Create a customer company record. Supplier and order setup stay separate.
          </p>
        </div>
        <CustomerForm />
      </div>
    </main>
  );
}
