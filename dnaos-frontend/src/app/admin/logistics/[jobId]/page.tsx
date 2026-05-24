import { TransportJobDetail } from "@/features/logistics/transport-job-detail";

type Props = { params: Promise<{ jobId: string }> };

export default async function LogisticsJobDetailPage({ params }: Props) {
  const { jobId } = await params;
  return <TransportJobDetail jobId={jobId} />;
}
