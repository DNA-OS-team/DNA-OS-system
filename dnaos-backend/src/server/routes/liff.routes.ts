import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getPrisma } from "../db/prisma.js";
import { createLineSession } from "../services/sessionService.js";
import { getLineProfile, completeLineLogin } from "../services/lineAuthService.js";
import type { Role } from "../../generated/prisma/enums.js";

function roleHomePath(role: string): string {
  if (role === "SUPPLIER") return "/liff/supplier/po";
  if (role === "FLEET") return "/liff/fleet/jobs";
  return "/liff/shop";
}

const authSchema = z.object({
  accessToken: z.string().min(1),
});

export async function registerLiffRoutes(app: FastifyInstance) {
  // Exchange LINE access token (from LIFF) for a session cookie
  app.post("/auth", async (request, reply) => {
    const { accessToken } = authSchema.parse(request.body);

    let profile;
    try {
      profile = await getLineProfile(accessToken);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[LIFF auth] getLineProfile failed:", msg);
      reply.code(401);
      return { error: `Invalid LINE access token: ${msg}` };
    }

    const result = await completeLineLogin(profile);

    if (result.status === "SUCCESS") {
      reply.header("Set-Cookie", result.sessionCookie);
      return { ok: true, redirectPath: result.redirectPath };
    }

    if (result.status === "UNKNOWN_LINE_USER") {
      // Auto-register new customer
      const prisma = getPrisma();
      const displayName = profile.displayName ?? "ลูกค้า";
      const { session, homePath } = await prisma.$transaction(async (tx) => {
        const email = `line.${profile.userId}@dnaos.internal`;
        let user = await tx.user.findFirst({ where: { email } });
        if (!user) {
          user = await tx.user.create({
            data: { email, name: displayName, status: "ACTIVE" },
          });
        }
        let identity = await tx.userIdentity.findFirst({
          where: { provider: "LINE", providerUserId: profile.userId },
        });
        if (!identity) {
          identity = await tx.userIdentity.create({
            data: {
              userId: user.id,
              provider: "LINE",
              providerUserId: profile.userId,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl,
              lastLoginAt: new Date(),
            },
          });
        }
        const company = await tx.company.create({
          data: { name: displayName, type: "CUSTOMER", isIndividual: true, status: "ACTIVE" },
        });
        await tx.companyMember.create({
          data: { companyId: company.id, userId: user.id, role: "CUSTOMER", status: "ACTIVE" },
        });
        const sess = await createLineSession({
          userId: user.id,
          companyId: company.id,
          role: "CUSTOMER" as Role,
          lineUserId: profile.userId,
        });
        return { session: sess, homePath: "/liff/shop" };
      });
      reply.header("Set-Cookie", session.cookie);
      return { ok: true, redirectPath: homePath };
    }

    if (result.status === "NO_ACTIVE_MEMBERSHIP") {
      // Create new company membership
      const prisma = getPrisma();
      const identity = await prisma.userIdentity.findUnique({
        where: { provider_providerUserId: { provider: "LINE", providerUserId: profile.userId } },
      });
      if (!identity) {
        reply.code(401);
        return { error: "User identity not found" };
      }
      const company = await prisma.company.create({
        data: {
          name: profile.displayName ?? "ลูกค้า",
          type: "CUSTOMER",
          isIndividual: true,
          status: "ACTIVE",
        },
      });
      await prisma.companyMember.create({
        data: { companyId: company.id, userId: identity.userId, role: "CUSTOMER", status: "ACTIVE" },
      });
      const sess = await createLineSession({
        userId: identity.userId,
        companyId: company.id,
        role: "CUSTOMER" as Role,
        lineUserId: profile.userId,
      });
      reply.header("Set-Cookie", sess.cookie);
      return { ok: true, redirectPath: "/liff/shop" };
    }

    if (result.status === "MULTI_ROLE") {
      // Pick customer membership if available, else first one
      const customer = result.memberships.find((m) => m.role === "CUSTOMER");
      const membership = customer ?? result.memberships[0];
      if (!membership) {
        reply.code(403);
        return { error: "No membership found" };
      }
      const sess = await createLineSession({
        userId: result.userId,
        companyId: membership.companyId,
        role: membership.role as Role,
        lineUserId: result.lineUserId,
      });
      reply.header("Set-Cookie", sess.cookie);
      return { ok: true, redirectPath: roleHomePath(membership.role) };
    }

    reply.code(403);
    return { error: result.status };
  });
}
