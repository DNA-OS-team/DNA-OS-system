import { SettlementDetail } from "@/features/settlements/settlement-detail";

export default async function SettlementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SettlementDetail id={id} />;
}
