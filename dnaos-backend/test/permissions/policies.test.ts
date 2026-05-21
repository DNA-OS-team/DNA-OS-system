import { describe, expect, it } from "vitest";

import { hasRole } from "../../src/core/permissions/roles.js";
import {
  PermissionDeniedError,
  assertPermission,
  canAccessResource
} from "../../src/core/permissions/policies.js";

describe("permission policies", () => {
  it("checks allowed roles", () => {
    expect(hasRole("ADMIN", ["OWNER", "ADMIN"])).toBe(true);
    expect(hasRole("VIEWER", ["OWNER", "ADMIN"])).toBe(false);
  });

  it("allows owners and admins to manage every resource", () => {
    expect(canAccessResource("OWNER", "payment", "delete")).toBe(true);
    expect(canAccessResource("ADMIN", "dashboard", "manage")).toBe(true);
  });

  it("allows accountants to approve payments", () => {
    expect(canAccessResource("ACCOUNTANT", "payment", "approve")).toBe(true);
  });

  it("does not allow viewers to create orders", () => {
    expect(canAccessResource("VIEWER", "order", "create")).toBe(false);
  });

  it("throws when permission is denied", () => {
    expect(() => assertPermission("SUPPLIER", "payment", "approve")).toThrow(
      PermissionDeniedError
    );
  });
});
