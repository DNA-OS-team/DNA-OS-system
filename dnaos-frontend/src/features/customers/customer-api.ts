import { apiFetch } from "@/lib/api";
import type {
  Customer,
  CustomerCreditProfile,
  CustomerSite,
} from "./types";
import type {
  CustomerCreditFormValues,
  CustomerFormValues,
  CustomerSiteFormValues,
} from "./schemas";

export function listCustomers() {
  return apiFetch<{ customers: Customer[] }>("/admin/customers");
}

export function getCustomer(customerId: string) {
  return apiFetch<{ customer: Customer }>(`/admin/customers/${customerId}`);
}

export function createCustomer(input: CustomerFormValues) {
  return apiFetch<{ customer: Customer }>("/admin/customers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCustomer(customerId: string, input: CustomerFormValues) {
  return apiFetch<{ customer: Customer }>(`/admin/customers/${customerId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listCustomerSites(customerId: string) {
  return apiFetch<{ customer: Customer; sites: CustomerSite[] }>(
    `/admin/customers/${customerId}/sites`
  );
}

export function createCustomerSite(
  customerId: string,
  input: CustomerSiteFormValues
) {
  return apiFetch<{ site: CustomerSite }>(`/admin/customers/${customerId}/sites`, {
    method: "POST",
    body: JSON.stringify(sanitizeSiteInput(input)),
  });
}

export function getCustomerCredit(customerId: string) {
  return apiFetch<{
    customer: Customer;
    creditProfile: CustomerCreditProfile | null;
  }>(`/admin/customers/${customerId}/credit`);
}

export function upsertCustomerCredit(
  customerId: string,
  input: CustomerCreditFormValues
) {
  return apiFetch<{ creditProfile: CustomerCreditProfile }>(
    `/admin/customers/${customerId}/credit`,
    {
      method: "PUT",
      body: JSON.stringify(sanitizeCreditInput(input)),
    }
  );
}

function sanitizeSiteInput(input: CustomerSiteFormValues) {
  return {
    ...input,
    gpsLat: input.gpsLat ? Number(input.gpsLat) : null,
    gpsLng: input.gpsLng ? Number(input.gpsLng) : null,
  };
}

function sanitizeCreditInput(input: CustomerCreditFormValues) {
  return {
    ...input,
    creditLimit: Number(input.creditLimit),
    creditTermDays: Number(input.creditTermDays),
    currentOutstanding: Number(input.currentOutstanding),
    overdueAmount: Number(input.overdueAmount),
    paymentBehaviorScore: Number(input.paymentBehaviorScore),
  };
}
