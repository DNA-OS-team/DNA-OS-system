import { type PlatformRole, hasRole } from "./roles.js";

export const permissionResources = [
  "company",
  "customer",
  "product",
  "supplier",
  "fleet",
  "order",
  "document",
  "payment",
  "dashboard"
] as const;

export const permissionActions = [
  "read",
  "create",
  "update",
  "delete",
  "approve",
  "manage"
] as const;

export type PermissionResource = (typeof permissionResources)[number];
export type PermissionAction = (typeof permissionActions)[number];

export class PermissionDeniedError extends Error {
  constructor(role: PlatformRole, resource: PermissionResource, action: PermissionAction) {
    super(`Role ${role} cannot ${action} ${resource}`);
    this.name = "PermissionDeniedError";
  }
}

type PermissionMatrix = Record<
  PermissionResource,
  Partial<Record<PermissionAction, readonly PlatformRole[]>>
>;

export const permissionPolicies: PermissionMatrix = {
  company: {
    read: ["OWNER", "ADMIN", "ACCOUNTANT", "PROCUREMENT", "OPERATION", "VIEWER"],
    create: ["OWNER", "ADMIN"],
    update: ["OWNER", "ADMIN"],
    delete: ["OWNER"],
    approve: ["OWNER", "ADMIN"],
    manage: ["OWNER", "ADMIN"]
  },
  customer: {
    read: ["OWNER", "ADMIN", "ACCOUNTANT", "PROCUREMENT", "OPERATION", "CUSTOMER", "VIEWER"],
    create: ["OWNER", "ADMIN", "OPERATION"],
    update: ["OWNER", "ADMIN", "OPERATION"],
    delete: ["OWNER", "ADMIN"],
    manage: ["OWNER", "ADMIN"]
  },
  product: {
    read: ["OWNER", "ADMIN", "PROCUREMENT", "OPERATION", "CUSTOMER", "SUPPLIER", "VIEWER"],
    create: ["OWNER", "ADMIN", "PROCUREMENT"],
    update: ["OWNER", "ADMIN", "PROCUREMENT"],
    delete: ["OWNER", "ADMIN"],
    manage: ["OWNER", "ADMIN", "PROCUREMENT"]
  },
  supplier: {
    read: ["OWNER", "ADMIN", "ACCOUNTANT", "PROCUREMENT", "OPERATION", "SUPPLIER", "VIEWER"],
    create: ["OWNER", "ADMIN", "PROCUREMENT"],
    update: ["OWNER", "ADMIN", "PROCUREMENT", "SUPPLIER"],
    delete: ["OWNER", "ADMIN"],
    approve: ["OWNER", "ADMIN", "PROCUREMENT"],
    manage: ["OWNER", "ADMIN", "PROCUREMENT"]
  },
  fleet: {
    read: ["OWNER", "ADMIN", "ACCOUNTANT", "PROCUREMENT", "OPERATION", "FLEET_OWNER", "DRIVER", "VIEWER"],
    create: ["OWNER", "ADMIN", "OPERATION"],
    update: ["OWNER", "ADMIN", "OPERATION", "FLEET_OWNER", "DRIVER"],
    delete: ["OWNER", "ADMIN"],
    approve: ["OWNER", "ADMIN", "OPERATION"],
    manage: ["OWNER", "ADMIN", "OPERATION"]
  },
  order: {
    read: ["OWNER", "ADMIN", "ACCOUNTANT", "PROCUREMENT", "OPERATION", "CUSTOMER", "SUPPLIER", "FLEET_OWNER", "DRIVER", "VIEWER"],
    create: ["OWNER", "ADMIN", "PROCUREMENT", "OPERATION", "CUSTOMER"],
    update: ["OWNER", "ADMIN", "PROCUREMENT", "OPERATION", "CUSTOMER", "SUPPLIER", "FLEET_OWNER", "DRIVER"],
    delete: ["OWNER", "ADMIN"],
    approve: ["OWNER", "ADMIN", "PROCUREMENT", "OPERATION"],
    manage: ["OWNER", "ADMIN", "OPERATION"]
  },
  document: {
    read: ["OWNER", "ADMIN", "ACCOUNTANT", "PROCUREMENT", "OPERATION", "CUSTOMER", "SUPPLIER", "FLEET_OWNER", "VIEWER"],
    create: ["OWNER", "ADMIN", "ACCOUNTANT", "PROCUREMENT", "OPERATION"],
    update: ["OWNER", "ADMIN", "ACCOUNTANT", "PROCUREMENT", "OPERATION"],
    delete: ["OWNER", "ADMIN"],
    approve: ["OWNER", "ADMIN", "ACCOUNTANT"],
    manage: ["OWNER", "ADMIN", "ACCOUNTANT"]
  },
  payment: {
    read: ["OWNER", "ADMIN", "ACCOUNTANT", "CUSTOMER", "SUPPLIER", "FLEET_OWNER", "VIEWER"],
    create: ["OWNER", "ADMIN", "ACCOUNTANT"],
    update: ["OWNER", "ADMIN", "ACCOUNTANT"],
    delete: ["OWNER"],
    approve: ["OWNER", "ADMIN", "ACCOUNTANT"],
    manage: ["OWNER", "ADMIN", "ACCOUNTANT"]
  },
  dashboard: {
    read: ["OWNER", "ADMIN", "ACCOUNTANT", "PROCUREMENT", "OPERATION", "VIEWER"],
    manage: ["OWNER", "ADMIN"]
  }
};

export function canAccessResource(
  role: PlatformRole,
  resource: PermissionResource,
  action: PermissionAction
) {
  if (hasRole(role, ["OWNER", "ADMIN"])) {
    return true;
  }

  const allowedRoles = permissionPolicies[resource][action] ?? [];

  return hasRole(role, allowedRoles);
}

export function assertPermission(
  role: PlatformRole,
  resource: PermissionResource,
  action: PermissionAction
) {
  if (!canAccessResource(role, resource, action)) {
    throw new PermissionDeniedError(role, resource, action);
  }
}

export const rolePermissionSummary: Record<PlatformRole, string> = {
  OWNER: "Full system access, including delete and manage actions.",
  ADMIN: "Full operational access across all resources.",
  ACCOUNTANT: "Finance, document, payment, and dashboard access.",
  PROCUREMENT: "Product, supplier, order, and procurement document access.",
  OPERATION: "Customer, fleet, order, document, and dashboard access.",
  CUSTOMER: "Customer-facing read/create/update access for orders and related records.",
  SUPPLIER: "Supplier-facing read/update access for supplier and order workflows.",
  FLEET_OWNER: "Fleet-facing read/update access for fleet jobs and related documents.",
  DRIVER: "Driver-facing fleet and order status update access.",
  VIEWER: "Read-only internal access."
};

// Example:
// assertPermission(currentMember.role, "order", "approve");
