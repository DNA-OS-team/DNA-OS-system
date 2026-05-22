import { apiFetch } from "@/lib/api";
import type { AdminDashboardData } from "./types";

export function getAdminDashboard() {
  return apiFetch<AdminDashboardData>("/admin/dashboard");
}
