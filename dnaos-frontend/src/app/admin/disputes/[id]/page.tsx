import { DisputeDetail } from "@/features/logistics/dispute-detail";

type Props = { params: Promise<{ id: string }> };

export default async function DisputeDetailPage({ params }: Props) {
  const { id } = await params;
  return <DisputeDetail disputeId={id} />;
}
