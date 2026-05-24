import { DebtDetail } from "@/features/debt/debt-detail";

export default async function DebtDetailPage({
  params,
}: {
  params: Promise<{ customerCompanyId: string }>;
}) {
  const { customerCompanyId } = await params;
  return <DebtDetail customerCompanyId={customerCompanyId} />;
}
