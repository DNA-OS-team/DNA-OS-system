import {
  createAuditEntry,
  type AuditEntryInput
} from "../../core/engines/auditEngine.js";
import { getPrisma } from "../db/prisma.js";

export async function writeAuditLog(input: AuditEntryInput) {
  const prisma = getPrisma();
  const auditEntry = createAuditEntry(input);

  return prisma.auditLog.create({
    data: auditEntry
  });
}
