import { CustomerSites } from "@/features/customers/customer-sites";

type CustomerSitesPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CustomerSitesPage({ params }: CustomerSitesPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <CustomerSites customerId={id} />
      </div>
    </main>
  );
}
