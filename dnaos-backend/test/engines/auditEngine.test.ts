import { describe, expect, it } from "vitest";

import {
  createAuditEntry,
  formatAuditValue,
  isSensitiveAuditField
} from "../../src/core/engines/auditEngine.js";

describe("auditEngine", () => {
  it("formats primitives and dates", () => {
    expect(formatAuditValue(1200)).toBe("1200");
    expect(formatAuditValue(true)).toBe("true");
    expect(formatAuditValue(new Date("2026-05-22T00:00:00.000Z"))).toBe(
      "2026-05-22T00:00:00.000Z"
    );
  });

  it("formats objects safely", () => {
    expect(formatAuditValue({ status: "ACTIVE" })).toBe('{"status":"ACTIVE"}');
  });

  it("detects sensitive field names", () => {
    expect(isSensitiveAuditField("password")).toBe(true);
    expect(isSensitiveAuditField("serviceRoleKey")).toBe(true);
    expect(isSensitiveAuditField("name")).toBe(false);
  });

  it("redacts sensitive values in audit entries", () => {
    const entry = createAuditEntry({
      action: "UPDATE",
      entityType: "user",
      entityId: "user-1",
      field: "password",
      oldValue: "old-secret",
      newValue: "new-secret"
    });

    expect(entry.oldValue).toBe("[REDACTED]");
    expect(entry.newValue).toBe("[REDACTED]");
  });
});
