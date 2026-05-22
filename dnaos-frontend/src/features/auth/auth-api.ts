import { apiFetch } from "@/lib/api";
import type { SuperadminLoginValues } from "./schemas";

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

export async function loginSuperadmin(values: SuperadminLoginValues) {
  return apiFetch<SuperadminLoginResponse>("/auth/superadmin/login", {
    method: "POST",
    body: JSON.stringify(values),
  });
}
