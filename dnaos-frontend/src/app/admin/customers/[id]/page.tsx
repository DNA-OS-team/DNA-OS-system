import { CustomerDetail } from "@/features/customers/customer-detail";

type CustomerDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <CustomerDetail customerId={id} />
      </div>
    </main>
  );
}
