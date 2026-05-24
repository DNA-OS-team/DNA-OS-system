import type { Metadata } from "next";
import { FleetJobList } from "@/features/fleet-portal/fleet-job-list";

export const metadata: Metadata = { title: "งานขนส่ง | DNA OS" };

export default function FleetJobsPage() {
  return <FleetJobList />;
}
