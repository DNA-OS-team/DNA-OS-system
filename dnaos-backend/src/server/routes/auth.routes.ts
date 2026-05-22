import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { verifyPassword } from "../../core/auth/password.js";
import { getPrisma } from "../db/prisma.js";
import { writeAuditLog } from "../services/auditService.js";

const superadminLoginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/superadmin/login", async (request, reply) => {
    const input = superadminLoginSchema.parse(request.body);
    const prisma = getPrisma();
    const admin = await prisma.admin.findUnique({
      where: {
        username: input.username
      }
    });

    if (!admin) {
      reply.code(401);
      await writeAuditLog({
        actorUserId: null,
        companyId: null,
        entityType: "superadmin_session",
        action: "SUPERADMIN_LOGIN_FAILED",
        newValue: {
          username: input.username,
          reason: "not_found"
        }
      });

      return { error: "Invalid username or password" };
    }

    const passwordMatches = await verifyPassword(input.password, admin.passwordHash);

    if (
      !passwordMatches ||
      admin.status !== "ACTIVE" ||
      (admin.role !== "ADMIN" && admin.role !== "OWNER")
    ) {
      reply.code(401);
      await writeAuditLog({
        actorUserId: null,
        companyId: null,
        entityType: "superadmin_session",
        entityId: admin.id,
        action: "SUPERADMIN_LOGIN_FAILED",
        newValue: {
          username: admin.username,
          reason: "invalid_credentials_or_status"
        }
      });

      return { error: "Invalid username or password" };
    }

    await writeAuditLog({
      actorUserId: null,
      companyId: null,
      entityType: "superadmin_session",
      entityId: admin.id,
      action: "SUPERADMIN_LOGIN",
      newValue: {
        username: admin.username,
        role: admin.role
      }
    });

    return {
      superadmin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        phoneNumber: admin.phoneNumber,
        role: admin.role
      }
    };
  });
}
