import type { Metadata } from "next";
import { FleetJobDetail } from "@/features/fleet-portal/fleet-job-detail";

export const metadata: Metadata = { title: "รายละเอียดงาน | DNA OS" };

export default async function FleetJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FleetJobDetail jobId={id} />;
}
