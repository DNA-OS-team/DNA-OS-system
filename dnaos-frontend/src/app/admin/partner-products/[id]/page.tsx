import { PartnerProductDetail } from "@/features/partner-products/partner-product-detail";

type PartnerProductDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PartnerProductDetailPage({
  params,
}: PartnerProductDetailPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <PartnerProductDetail submissionId={id} />
      </div>
    </main>
  );
}
