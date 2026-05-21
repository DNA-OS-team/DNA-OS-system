export const platformRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "OPERATION",
  "FINANCE",
  "SALES",
  "CUSTOMER_USER",
  "SUPPLIER_USER",
  "FLEET_USER"
] as const;

export type PlatformRole = (typeof platformRoles)[number];

export function isAdminRole(role: PlatformRole) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}
