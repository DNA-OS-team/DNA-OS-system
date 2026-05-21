export const platformRoles = [
  "OWNER",
  "ADMIN",
  "ACCOUNTANT",
  "PROCUREMENT",
  "OPERATION",
  "CUSTOMER",
  "SUPPLIER",
  "FLEET_OWNER",
  "DRIVER",
  "VIEWER"
] as const;

export type PlatformRole = (typeof platformRoles)[number];

export function isAdminRole(role: PlatformRole) {
  return role === "OWNER" || role === "ADMIN";
}
