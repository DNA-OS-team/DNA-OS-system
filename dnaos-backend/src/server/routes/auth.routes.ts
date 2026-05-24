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
  createLineLinkToken,
  exchangeLineCodeForToken,
  getChannelConfig,
  getLineProfile,
  getRoleHomePath,
  normalizeInternalPath
} from "../services/lineAuthService.js";
import {
  adminSessionCookieName,
  clearCookie,
  createAdminSession,
  createLineSession,
  createLinePendingRolesCookie,
  createOAuthCookie,
  linePendingRolesCookieName,
  lineOAuthLinkTokenCookieName,
  lineOAuthNextCookieName,
  lineOAuthStateCookieName,
  lineRegProfileCookieName,
  lineSessionCookieName,
  parseCookieHeader,
  parseLineRegProfileCookie,
  parseLinePendingRolesCookie,
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

// ─── Shared helpers ──────────────────────────────────────────────────────────

type Channel = "customer" | "fleet" | "supplier";

const CHANNEL_DEFAULTS: Record<Channel, { companyType: string; role: string; homePath: string }> = {
  customer: { companyType: "CUSTOMER", role: "CUSTOMER", homePath: "/customer/orders" },
  fleet:    { companyType: "FLEET",    role: "FLEET_OWNER", homePath: "/fleet/jobs" },
  supplier: { companyType: "SUPPLIER", role: "SUPPLIER",  homePath: "/supplier/orders" },
};

async function autoRegisterLine(profile: { userId: string; displayName?: string; pictureUrl?: string }, channel: Channel) {
  const { companyType, role, homePath } = CHANNEL_DEFAULTS[channel];
  const displayName = profile.displayName ?? "ผู้ใช้ใหม่";
  const prisma = getPrisma();

  const [company, user] = await prisma.$transaction(async (tx) => {
    const co = await tx.company.create({
      data: { name: displayName, type: companyType as "CUSTOMER" | "FLEET" | "SUPPLIER", isIndividual: true, status: "ACTIVE" }
    });
    const u = await tx.user.create({
      data: { email: `line.${profile.userId}@dnaos.internal`, name: displayName, status: "ACTIVE" }
    });
    await tx.userIdentity.create({
      data: {
        userId: u.id, provider: "LINE", providerUserId: profile.userId,
        displayName: profile.displayName, pictureUrl: profile.pictureUrl, lastLoginAt: new Date()
      }
    });
    await tx.companyMember.create({
      data: { companyId: co.id, userId: u.id, role: role as "CUSTOMER" | "FLEET_OWNER" | "SUPPLIER", status: "ACTIVE" }
    });
    return [co, u];
  });

  const session = await createLineSession({
    userId: user.id, companyId: company.id,
    role: role as "CUSTOMER" | "FLEET_OWNER" | "SUPPLIER",
    lineUserId: profile.userId
  });

  return { session, homePath };
}

// user มี LINE identity แล้วแต่ไม่มี active membership → สร้าง company + member ใหม่
async function autoAddMembership(profile: { userId: string; displayName?: string; pictureUrl?: string }, channel: Channel) {
  const { companyType, role, homePath } = CHANNEL_DEFAULTS[channel];
  const displayName = profile.displayName ?? "ผู้ใช้ใหม่";
  const prisma = getPrisma();

  const identity = await prisma.userIdentity.findUnique({
    where: { provider_providerUserId: { provider: "LINE", providerUserId: profile.userId } }
  });

  if (!identity) return autoRegisterLine(profile, channel);

  const company = await prisma.$transaction(async (tx) => {
    const co = await tx.company.create({
      data: { name: displayName, type: companyType as "CUSTOMER" | "FLEET" | "SUPPLIER", isIndividual: true, status: "ACTIVE" }
    });
    await tx.companyMember.create({
      data: { companyId: co.id, userId: identity.userId, role: role as "CUSTOMER" | "FLEET_OWNER" | "SUPPLIER", status: "ACTIVE" }
    });
    return co;
  });

  const session = await createLineSession({
    userId: identity.userId, companyId: company.id,
    role: role as "CUSTOMER" | "FLEET_OWNER" | "SUPPLIER",
    lineUserId: profile.userId
  });

  return { session, homePath };
}

function makeLineStartHandler(channel: Channel) {
  return async (request: import("fastify").FastifyRequest, reply: import("fastify").FastifyReply) => {
    const query = lineStartQuerySchema.parse(request.query);
    const state = createOpaqueToken(24);
    const nextPath = normalizeInternalPath(query.next);
    const cookies = [
      createOAuthCookie(lineOAuthStateCookieName, state),
      createOAuthCookie(lineOAuthNextCookieName, nextPath),
    ];
    if (query.token) cookies.push(createOAuthCookie(lineOAuthLinkTokenCookieName, query.token));
    reply.header("Set-Cookie", cookies);
    try {
      const cfg = getChannelConfig(channel);
      const authorizeUrl = new URL("https://access.line.me/oauth2/v2.1/authorize");
      authorizeUrl.searchParams.set("response_type", "code");
      authorizeUrl.searchParams.set("client_id", cfg.channelId);
      authorizeUrl.searchParams.set("redirect_uri", cfg.callbackUrl);
      authorizeUrl.searchParams.set("state", state);
      authorizeUrl.searchParams.set("scope", "profile openid");
      return reply.redirect(authorizeUrl.toString());
    } catch {
      return reply.redirect(buildFrontendRedirect("/line/error?reason=line_not_configured"));
    }
  };
}

function makeLineCallbackHandler(channel: Channel) {
  return async (request: import("fastify").FastifyRequest, reply: import("fastify").FastifyReply) => {
    const query = lineCallbackQuerySchema.parse(request.query);
    const cookies = parseCookieHeader(request.headers.cookie);
    const expectedState = cookies.get(lineOAuthStateCookieName);
    const storedNextPath = cookies.get(lineOAuthNextCookieName);
    const nextPath = storedNextPath ? normalizeInternalPath(storedNextPath) : null;
    const linkToken = cookies.get(lineOAuthLinkTokenCookieName);
    const clearOAuthCookies = [
      clearCookie(lineOAuthStateCookieName),
      clearCookie(lineOAuthNextCookieName),
      clearCookie(lineOAuthLinkTokenCookieName),
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
      const cfg = getChannelConfig(channel);
      const accessToken = await exchangeLineCodeForToken(query.code, cfg);
      const profile = await getLineProfile(accessToken);

      if (linkToken) {
        const linkResult = await completeLineAccountLink({ rawToken: linkToken, profile });
        if (linkResult.status !== "SUCCESS") {
          reply.header("Set-Cookie", clearOAuthCookies);
          return reply.redirect(buildFrontendRedirect(`/line/error?reason=${linkResult.status.toLowerCase()}`));
        }
      }

      const loginResult = await completeLineLogin(profile);

      if (loginResult.status === "UNKNOWN_LINE_USER") {
        const { session, homePath } = await autoRegisterLine(profile, channel);
        reply.header("Set-Cookie", [...clearOAuthCookies, session.cookie]);
        return reply.redirect(buildFrontendRedirect(nextPath ?? homePath));
      }

      if (loginResult.status === "NO_ACTIVE_MEMBERSHIP") {
        const { session, homePath } = await autoAddMembership(profile, channel);
        reply.header("Set-Cookie", [...clearOAuthCookies, session.cookie]);
        return reply.redirect(buildFrontendRedirect(nextPath ?? homePath));
      }

      if (loginResult.status === "MULTI_ROLE") {
        const pendingCookie = createLinePendingRolesCookie({
          userId: loginResult.userId,
          lineUserId: loginResult.lineUserId,
          memberships: loginResult.memberships
        });
        reply.header("Set-Cookie", [...clearOAuthCookies, pendingCookie]);
        return reply.redirect(buildFrontendRedirect(nextPath ?? "/line/choose-role"));
      }

      if (loginResult.status !== "SUCCESS") {
        reply.header("Set-Cookie", clearOAuthCookies);
        return reply.redirect(buildFrontendRedirect(`/line/error?reason=${loginResult.status.toLowerCase()}`));
      }

      reply.header("Set-Cookie", [...clearOAuthCookies, loginResult.sessionCookie]);
      return reply.redirect(buildFrontendRedirect(nextPath ?? loginResult.redirectPath));
    } catch (error) {
      request.log.error(error);
      reply.header("Set-Cookie", clearOAuthCookies);
      return reply.redirect(buildFrontendRedirect("/line/error?reason=line_callback_failed"));
    }
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function registerAuthRoutes(app: FastifyInstance) {
  // Customer (default channel)
  app.get("/line/start", makeLineStartHandler("customer"));
  app.get("/line/callback", makeLineCallbackHandler("customer"));

  // Fleet channel
  app.get("/line-fleet/start", makeLineStartHandler("fleet"));
  app.get("/line-fleet/callback", makeLineCallbackHandler("fleet"));

  // Supplier channel
  app.get("/line-supplier/start", makeLineStartHandler("supplier"));
  app.get("/line-supplier/callback", makeLineCallbackHandler("supplier"));

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

  app.post("/line/register", async (request, reply) => {
    const cookies = parseCookieHeader(request.headers.cookie);
    const rawProfile = cookies.get(lineRegProfileCookieName);
    const profile = rawProfile ? parseLineRegProfileCookie(rawProfile) : null;

    if (!profile) {
      reply.code(400);
      return { error: "Registration session expired. Please try logging in again." };
    }

    const body = z.object({
      name: z.string().trim().min(1),
      phone: z.string().trim().optional()
    }).parse(request.body);

    const prisma = getPrisma();

    const existing = await prisma.userIdentity.findUnique({
      where: { provider_providerUserId: { provider: "LINE", providerUserId: profile.lineUserId } }
    });
    if (existing) {
      reply.code(409);
      return { error: "LINE account is already registered." };
    }

    const placeholderEmail = `line.${profile.lineUserId}@dnaos.internal`;

    const [company, user] = await prisma.$transaction(async (tx) => {
      const co = await tx.company.create({
        data: { name: body.name, type: "CUSTOMER", isIndividual: true, status: "ACTIVE" }
      });
      const u = await tx.user.create({
        data: { email: placeholderEmail, name: body.name, phone: body.phone, status: "ACTIVE" }
      });
      await tx.userIdentity.create({
        data: {
          userId: u.id,
          provider: "LINE",
          providerUserId: profile.lineUserId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          lastLoginAt: new Date()
        }
      });
      await tx.companyMember.create({
        data: { companyId: co.id, userId: u.id, role: "CUSTOMER", status: "ACTIVE" }
      });
      return [co, u];
    });

    const session = await createLineSession({
      userId: user.id,
      companyId: company.id,
      role: "CUSTOMER",
      lineUserId: profile.lineUserId
    });

    reply.header("Set-Cookie", [clearCookie(lineRegProfileCookieName), session.cookie]);
    return { ok: true };
  });

  app.get("/line/pending-roles", async (request, reply) => {
    const cookies = parseCookieHeader(request.headers.cookie);
    const raw = cookies.get(linePendingRolesCookieName);
    const data = raw ? parseLinePendingRolesCookie(raw) : null;

    if (!data) {
      reply.code(400);
      return { error: "No pending role selection" };
    }

    return { memberships: data.memberships };
  });

  app.post("/line/select-role", async (request, reply) => {
    const cookies = parseCookieHeader(request.headers.cookie);
    const raw = cookies.get(linePendingRolesCookieName);
    const data = raw ? parseLinePendingRolesCookie(raw) : null;

    if (!data) {
      reply.code(400);
      return { error: "Role selection session expired. Please log in again." };
    }

    const { companyId } = z.object({ companyId: z.string().uuid() }).parse(request.body);
    const membership = data.memberships.find((m) => m.companyId === companyId);

    if (!membership) {
      reply.code(400);
      return { error: "Invalid company selection." };
    }

    const session = await createLineSession({
      userId: data.userId,
      companyId: membership.companyId,
      role: membership.role as import("../../generated/prisma/enums.js").Role,
      lineUserId: data.lineUserId
    });

    reply.header("Set-Cookie", [clearCookie(linePendingRolesCookieName), session.cookie]);
    return { redirectPath: getRoleHomePath(membership.role) };
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

    const session = await createAdminSession({
      adminId: admin.id
    });

    reply.header("Set-Cookie", session.cookie);

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
