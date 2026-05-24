import { addDays } from "date-fns";
import { createOpaqueToken, hashOpaqueToken } from "../../core/auth/token.js";
import type { Role } from "../../generated/prisma/enums.js";
import { env } from "../../config/env.js";
import { getPrisma } from "../db/prisma.js";
import { writeAuditLog } from "./auditService.js";
import { createLineSession } from "./sessionService.js";

export type LineProfile = {
  userId: string;
  displayName?: string;
  pictureUrl?: string;
};

export type PendingRoleMembership = {
  companyId: string;
  companyName: string;
  companyType: string;
  role: string;
};

export type LineLoginResult =
  | { status: "SUCCESS"; sessionCookie: string; redirectPath: string }
  | { status: "UNKNOWN_LINE_USER" | "USER_NOT_ACTIVE" | "NO_ACTIVE_MEMBERSHIP" }
  | { status: "MULTI_ROLE"; userId: string; lineUserId: string; memberships: PendingRoleMembership[] };

export type LineLinkResult =
  | {
      status: "SUCCESS";
      userId: string;
    }
  | {
      status: "INVALID_TOKEN" | "LINE_ALREADY_LINKED" | "USER_ALREADY_LINKED";
    };

const allowedUserStatuses = new Set(["ACTIVE", "LINE_LINKED"]);

export type LineChannelConfig = {
  channelId: string;
  channelSecret: string;
  callbackUrl: string;
};

export function getChannelConfig(channel: "customer" | "fleet" | "supplier"): LineChannelConfig {
  if (!env.LINE_CHANNEL_ID || !env.LINE_CHANNEL_SECRET)
    throw new Error("LINE auth is not configured.");

  if (channel === "fleet") {
    return {
      channelId: env.LINE_FLEET_CHANNEL_ID || env.LINE_CHANNEL_ID,
      channelSecret: env.LINE_FLEET_CHANNEL_SECRET || env.LINE_CHANNEL_SECRET,
      callbackUrl: env.LINE_FLEET_CALLBACK_URL,
    };
  }
  if (channel === "supplier") {
    return {
      channelId: env.LINE_SUPPLIER_CHANNEL_ID || env.LINE_CHANNEL_ID,
      channelSecret: env.LINE_SUPPLIER_CHANNEL_SECRET || env.LINE_CHANNEL_SECRET,
      callbackUrl: env.LINE_SUPPLIER_CALLBACK_URL,
    };
  }
  return {
    channelId: env.LINE_CHANNEL_ID,
    channelSecret: env.LINE_CHANNEL_SECRET,
    callbackUrl: env.LINE_CALLBACK_URL,
  };
}

export function createLineAuthorizeUrl(input: { state: string; channel?: "customer" | "fleet" | "supplier" }) {
  const cfg = getChannelConfig(input.channel ?? "customer");
  const authorizeUrl = new URL("https://access.line.me/oauth2/v2.1/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", cfg.channelId);
  authorizeUrl.searchParams.set("redirect_uri", cfg.callbackUrl);
  authorizeUrl.searchParams.set("state", input.state);
  authorizeUrl.searchParams.set("scope", "profile openid");
  return authorizeUrl.toString();
}

export function createLineAuthorizeUrlFor(cfg: LineChannelConfig, state: string) {
  const authorizeUrl = new URL("https://access.line.me/oauth2/v2.1/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", cfg.channelId);
  authorizeUrl.searchParams.set("redirect_uri", cfg.callbackUrl);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("scope", "profile openid");
  return authorizeUrl.toString();
}

export async function exchangeLineCodeForToken(code: string, cfg?: LineChannelConfig) {
  const config = cfg ?? getChannelConfig("customer");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.callbackUrl,
    client_id: config.channelId,
    client_secret: config.channelSecret
  });

  const response = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    throw new Error(`LINE token exchange failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
  };

  if (!payload.access_token) {
    throw new Error("LINE token exchange did not return an access token.");
  }

  return payload.access_token;
}

export async function getLineProfile(accessToken: string): Promise<LineProfile> {
  const response = await fetch("https://api.line.me/v2/profile", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`LINE profile fetch failed: ${response.status}`);
  }

  const profile = (await response.json()) as LineProfile;

  if (!profile.userId) {
    throw new Error("LINE profile did not return userId.");
  }

  return profile;
}

export async function completeLineLogin(profile: LineProfile): Promise<LineLoginResult> {
  const prisma = getPrisma();
  const identity = await prisma.userIdentity.findUnique({
    where: {
      provider_providerUserId: {
        provider: "LINE",
        providerUserId: profile.userId
      }
    },
    include: {
      user: {
        include: {
          memberships: {
            where: {
              status: "ACTIVE",
              company: {
                status: "ACTIVE"
              }
            },
            include: {
              company: true
            },
            orderBy: {
              createdAt: "asc"
            }
          }
        }
      }
    }
  });

  if (!identity) {
    await writeAuditLog({
      actorUserId: null,
      companyId: null,
      entityType: "line_identity",
      action: "LINE_LOGIN_FAILED",
      newValue: {
        reason: "unknown_line_user",
        lineUserId: profile.userId,
        displayName: profile.displayName
      }
    });

    return {
      status: "UNKNOWN_LINE_USER"
    };
  }

  if (!allowedUserStatuses.has(identity.user.status)) {
    await writeAuditLog({
      actorUserId: identity.userId,
      companyId: null,
      entityType: "line_identity",
      entityId: identity.id,
      action: "LINE_LOGIN_FAILED",
      newValue: {
        reason: "user_not_active",
        status: identity.user.status
      }
    });

    return {
      status: "USER_NOT_ACTIVE"
    };
  }

  const memberships = identity.user.memberships;

  if (memberships.length === 0) {
    await writeAuditLog({
      actorUserId: identity.userId,
      companyId: null,
      entityType: "line_identity",
      entityId: identity.id,
      action: "LINE_LOGIN_FAILED",
      newValue: { reason: "no_active_membership" }
    });
    return { status: "NO_ACTIVE_MEMBERSHIP" };
  }

  await prisma.userIdentity.update({
    where: { id: identity.id },
    data: {
      displayName: profile.displayName ?? identity.displayName,
      pictureUrl: profile.pictureUrl ?? identity.pictureUrl,
      lastLoginAt: new Date()
    }
  });

  if (memberships.length > 1) {
    return {
      status: "MULTI_ROLE",
      userId: identity.userId,
      lineUserId: profile.userId,
      memberships: memberships.map((m) => ({
        companyId: m.companyId,
        companyName: m.company.name,
        companyType: m.company.type,
        role: m.role
      }))
    };
  }

  const membership = memberships[0];
  const session = await createLineSession({
    userId: identity.userId,
    companyId: membership.companyId,
    role: membership.role as Role,
    lineUserId: profile.userId
  });

  await writeAuditLog({
    actorUserId: identity.userId,
    companyId: membership.companyId,
    entityType: "line_session",
    action: "LINE_LOGIN",
    newValue: { role: membership.role, companyId: membership.companyId }
  });

  return {
    status: "SUCCESS",
    sessionCookie: session.cookie,
    redirectPath: getRoleHomePath(membership.role)
  };
}

export async function completeLineAccountLink(input: {
  rawToken: string;
  profile: LineProfile;
}): Promise<LineLinkResult> {
  const prisma = getPrisma();
  const tokenHash = hashOpaqueToken(input.rawToken);
  const now = new Date();

  const existingIdentity = await prisma.userIdentity.findUnique({
    where: {
      provider_providerUserId: {
        provider: "LINE",
        providerUserId: input.profile.userId
      }
    }
  });

  if (existingIdentity) {
    return {
      status: "LINE_ALREADY_LINKED"
    };
  }

  const linkToken = await prisma.lineLinkToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: {
        gt: now
      }
    }
  });

  if (!linkToken) {
    return {
      status: "INVALID_TOKEN"
    };
  }

  const existingUserLineIdentity = await prisma.userIdentity.findUnique({
    where: {
      userId_provider: {
        userId: linkToken.userId,
        provider: "LINE"
      }
    }
  });

  if (existingUserLineIdentity) {
    return {
      status: "USER_ALREADY_LINKED"
    };
  }

  await prisma.$transaction([
    prisma.userIdentity.create({
      data: {
        userId: linkToken.userId,
        provider: "LINE",
        providerUserId: input.profile.userId,
        displayName: input.profile.displayName,
        pictureUrl: input.profile.pictureUrl,
        lastLoginAt: now
      }
    }),
    prisma.lineLinkToken.update({
      where: {
        id: linkToken.id
      },
      data: {
        usedAt: now
      }
    }),
    prisma.user.updateMany({
      where: {
        id: linkToken.userId,
        status: "INVITED"
      },
      data: {
        status: "LINE_LINKED"
      }
    })
  ]);

  await writeAuditLog({
    actorUserId: linkToken.userId,
    companyId: null,
    entityType: "line_identity",
    action: "LINE_ACCOUNT_LINKED",
    newValue: {
      lineUserId: input.profile.userId,
      displayName: input.profile.displayName
    }
  });

  return {
    status: "SUCCESS",
    userId: linkToken.userId
  };
}

export async function createLineLinkToken(input: { userId: string }) {
  const prisma = getPrisma();
  const token = createOpaqueToken();
  const expiresAt = addDays(new Date(), 7);

  await prisma.lineLinkToken.create({
    data: {
      tokenHash: hashOpaqueToken(token),
      userId: input.userId,
      expiresAt
    }
  });

  await writeAuditLog({
    actorUserId: input.userId,
    companyId: null,
    entityType: "line_link_token",
    action: "LINE_LINK_TOKEN_CREATED",
    newValue: {
      expiresAt
    }
  });

  const linkUrl = new URL("/line/connect", env.FRONTEND_URL);
  linkUrl.searchParams.set("token", token);

  return {
    token,
    expiresAt,
    linkUrl: linkUrl.toString()
  };
}

export function normalizeInternalPath(path?: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/";
  }

  return path;
}

export function buildFrontendRedirect(path: string) {
  return new URL(normalizeInternalPath(path), env.FRONTEND_URL).toString();
}

export function getRoleHomePath(role: string) {
  if (role === "CUSTOMER") {
    return "/customer/orders";
  }

  if (role === "SUPPLIER") {
    return "/partner/products";
  }

  if (role === "FLEET_OWNER" || role === "DRIVER") {
    return "/fleet/jobs";
  }

  return "/admin/customers";
}
