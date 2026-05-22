import { CustomerCredit } from "@/features/customers/customer-credit";

type CustomerCreditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CustomerCreditPage({ params }: CustomerCreditPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <CustomerCredit customerId={id} />
      </div>
    </main>
  );
}
