import { OrderDetail } from "@/features/orders/order-detail";

type OrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <OrderDetail orderId={id} />
      </div>
    </main>
  );
}
