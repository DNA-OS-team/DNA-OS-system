export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "APPROVE"
  | "REJECT"
  | "LOGIN"
  | "LOGOUT"
  | "INVITE"
  | "STATUS_CHANGE"
  | "PERMISSION_DENIED"
  | "EXPORT"
  | "IMPORT"
  | "GENERATE_DOCUMENT"
  | "SEND_NOTIFICATION";

export type AuditValue =
  | string
  | number
  | boolean
  | bigint
  | Date
  | null
  | undefined
  | Record<string, unknown>
  | unknown[];

export type AuditEntryInput = {
  actorUserId?: string | null;
  companyId?: string | null;
  entityType: string;
  entityId?: string | null;
  action: AuditAction;
  field?: string | null;
  oldValue?: AuditValue;
  newValue?: AuditValue;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type AuditEntry = {
  actorUserId: string | null;
  companyId: string | null;
  entityType: string;
  entityId: string | null;
  action: AuditAction;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
};

const redactedValue = "[REDACTED]";
const maxAuditValueLength = 10_000;
const sensitiveFieldPattern =
  /(password|passcode|token|secret|credential|authorization|cookie|session|api[_-]?key|service[_-]?role)/i;

export function isSensitiveAuditField(field?: string | null) {
  return Boolean(field && sensitiveFieldPattern.test(field));
}

export function formatAuditValue(value: AuditValue): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "string") {
    return trimAuditValue(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return trimAuditValue(stringifyAuditObject(value));
}

export function createAuditEntry(input: AuditEntryInput): AuditEntry {
  const shouldRedact = isSensitiveAuditField(input.field);

  return {
    actorUserId: input.actorUserId ?? null,
    companyId: input.companyId ?? null,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    action: input.action,
    field: input.field ?? null,
    oldValue: shouldRedact ? redactedValue : formatAuditValue(input.oldValue),
    newValue: shouldRedact ? redactedValue : formatAuditValue(input.newValue),
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    createdAt: new Date()
  };
}

function trimAuditValue(value: string) {
  if (value.length <= maxAuditValueLength) {
    return value;
  }

  return `${value.slice(0, maxAuditValueLength)}...`;
}

function stringifyAuditObject(value: Record<string, unknown> | unknown[]) {
  const seen = new WeakSet<object>();

  return JSON.stringify(value, (_key, nestedValue: unknown) => {
    if (typeof nestedValue === "bigint") {
      return nestedValue.toString();
    }

    if (nestedValue instanceof Date) {
      return nestedValue.toISOString();
    }

    if (typeof nestedValue === "object" && nestedValue !== null) {
      if (seen.has(nestedValue)) {
        return "[Circular]";
      }

      seen.add(nestedValue);
    }

    return nestedValue;
  });
}
