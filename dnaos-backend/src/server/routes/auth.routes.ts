import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createOpaqueToken } from "../../core/auth/token.js";
import { verifyPassword } from "../../core/auth/password.js";
import { env } from "../../config/env.js";
import { getPrisma } from "../db/prisma.js";
import { writeAuditLog } from "../services/auditService.js";
import {
  buildFrontendRedirect,
  completeLineAccountLink,
  completeLineLogin,
  createLineAuthorizeUrl,
  createLineLinkToken,
  exchangeLineCodeForToken,
  getLineProfile,
  normalizeInternalPath
} from "../services/lineAuthService.js";
import {
  adminSessionCookieName,
  clearCookie,
  createAdminSession,
  createOAuthCookie,
  lineOAuthLinkTokenCookieName,
  lineOAuthNextCookieName,
  lineOAuthStateCookieName,
  lineSessionCookieName,
  parseCookieHeader,
  revokeAdminSession,
  revokeLineSession
} from "../services/sessionService.js";

const superadminLoginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

const adminLoginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

const lineStartQuerySchema = z.object({
  next: z.string().optional(),
  token: z.string().optional()
});

const lineCallbackQuerySchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional()
});

const lineLinkSchema = z.object({
  userId: z.string().uuid("userId must be a UUID")
});

export async function registerAuthRoutes(app: FastifyInstance) {
  app.get("/line/start", async (request, reply) => {
    const query = lineStartQuerySchema.parse(request.query);
    const state = createOpaqueToken(24);
    const nextPath = normalizeInternalPath(query.next);
    const cookies = [
      createOAuthCookie(lineOAuthStateCookieName, state),
      createOAuthCookie(lineOAuthNextCookieName, nextPath)
    ];

    if (query.token) {
      cookies.push(createOAuthCookie(lineOAuthLinkTokenCookieName, query.token));
    }

    reply.header("Set-Cookie", cookies);

    try {
      return reply.redirect(createLineAuthorizeUrl({ state }));
    } catch {
      return reply.redirect(buildFrontendRedirect("/line/error?reason=line_not_configured"));
    }
  });

  app.get("/line/callback", async (request, reply) => {
    const query = lineCallbackQuerySchema.parse(request.query);
    const cookies = parseCookieHeader(request.headers.cookie);
    const expectedState = cookies.get(lineOAuthStateCookieName);
    const storedNextPath = cookies.get(lineOAuthNextCookieName);
    const nextPath = storedNextPath ? normalizeInternalPath(storedNextPath) : null;
    const linkToken = cookies.get(lineOAuthLinkTokenCookieName);
    const clearOAuthCookies = [
      clearCookie(lineOAuthStateCookieName),
      clearCookie(lineOAuthNextCookieName),
      clearCookie(lineOAuthLinkTokenCookieName)
    ];

    if (query.error) {
      reply.header("Set-Cookie", clearOAuthCookies);
      return reply.redirect(buildFrontendRedirect(`/line/error?reason=${query.error}`));
    }

    if (!query.code || !query.state || !expectedState || query.state !== expectedState) {
      reply.header("Set-Cookie", clearOAuthCookies);
      return reply.redirect(buildFrontendRedirect("/line/error?reason=invalid_state"));
    }

    try {
      const accessToken = await exchangeLineCodeForToken(query.code);
      const profile = await getLineProfile(accessToken);

      if (linkToken) {
        const linkResult = await completeLineAccountLink({
          rawToken: linkToken,
          profile
        });

        if (linkResult.status !== "SUCCESS") {
          reply.header("Set-Cookie", clearOAuthCookies);
          return reply.redirect(
            buildFrontendRedirect(`/line/error?reason=${linkResult.status.toLowerCase()}`)
          );
        }
      }

      const loginResult = await completeLineLogin(profile);

      if (loginResult.status !== "SUCCESS") {
        reply.header("Set-Cookie", clearOAuthCookies);
        return reply.redirect(
          buildFrontendRedirect(`/line/error?reason=${loginResult.status.toLowerCase()}`)
        );
      }

      reply.header("Set-Cookie", [...clearOAuthCookies, loginResult.sessionCookie]);
      return reply.redirect(buildFrontendRedirect(nextPath ?? loginResult.redirectPath));
    } catch (error) {
      request.log.error(error);
      reply.header("Set-Cookie", clearOAuthCookies);
      return reply.redirect(buildFrontendRedirect("/line/error?reason=line_callback_failed"));
    }
  });

  app.post("/line/link", async (request, reply) => {
    if (!env.SESSION_SECRET) {
      reply.code(503);
      return { error: "Internal auth key is not configured." };
    }

    if (request.headers["x-dnaos-internal-key"] !== env.SESSION_SECRET) {
      reply.code(403);
      return { error: "Forbidden" };
    }

    const input = lineLinkSchema.parse(request.body);
    const linkToken = await createLineLinkToken(input);

    return {
      linkUrl: linkToken.linkUrl,
      expiresAt: linkToken.expiresAt
    };
  });

  app.post("/logout", async (request, reply) => {
    const cookies = parseCookieHeader(request.headers.cookie);
    await revokeLineSession(cookies.get(lineSessionCookieName));
    await revokeAdminSession(cookies.get(adminSessionCookieName));
    reply.header("Set-Cookie", [
      clearCookie(lineSessionCookieName),
      clearCookie(adminSessionCookieName)
    ]);

    return {
      ok: true
    };
  });

  app.post("/admin/login", async (request, reply) => {
    const input = adminLoginSchema.parse(request.body);
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
        entityType: "admin_session",
        action: "ADMIN_LOGIN_FAILED",
        newValue: {
          username: input.username,
          reason: "not_found"
        }
      });

      return { error: "Invalid username or password" };
    }

    const passwordMatches = await verifyPassword(input.password, admin.passwordHash);

    if (!passwordMatches || admin.status !== "ACTIVE" || admin.role !== "ADMIN") {
      reply.code(401);
      await writeAuditLog({
        actorUserId: null,
        companyId: null,
        entityType: "admin_session",
        entityId: admin.id,
        action: "ADMIN_LOGIN_FAILED",
        newValue: {
          username: admin.username,
          reason: "invalid_credentials_role_or_status",
          role: admin.role,
          status: admin.status
        }
      });

      return { error: "Invalid username or password" };
    }

    const session = await createAdminSession({
      adminId: admin.id
    });

    await writeAuditLog({
      actorUserId: null,
      companyId: null,
      entityType: "admin_session",
      entityId: admin.id,
      action: "ADMIN_LOGIN",
      newValue: {
        username: admin.username,
        role: admin.role
      }
    });

    reply.header("Set-Cookie", session.cookie);

    return {
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        phoneNumber: admin.phoneNumber,
        role: admin.role
      }
    };
  });

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
