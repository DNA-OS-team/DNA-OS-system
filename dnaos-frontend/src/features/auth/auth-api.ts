import { apiFetch } from "@/lib/api";
import type { AdminLoginValues, SuperadminLoginValues } from "./schemas";

export type SuperadminLoginResponse = {
  superadmin: {
    id: string;
    username: string;
    email: string;
    name: string;
    phoneNumber: string | null;
    role: string;
  };
};

export type AdminLoginResponse = {
  admin: {
    id: string;
    username: string;
    email: string;
    name: string;
    phoneNumber: string | null;
    role: string;
  };
};

export async function loginSuperadmin(values: SuperadminLoginValues) {
  return apiFetch<SuperadminLoginResponse>("/auth/superadmin/login", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export async function loginAdmin(values: AdminLoginValues) {
  return apiFetch<AdminLoginResponse>("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify(values),
  });
}
