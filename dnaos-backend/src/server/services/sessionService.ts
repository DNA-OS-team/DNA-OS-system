import { addDays, addHours } from "date-fns";
import { createOpaqueToken, hashOpaqueToken } from "../../core/auth/token.js";
import { env } from "../../config/env.js";
import type { Role } from "../../generated/prisma/enums.js";
import { getPrisma } from "../db/prisma.js";

export const lineSessionCookieName = "dnaos_line_session";
export const adminSessionCookieName = "dnaos_admin_session";
export const lineOAuthStateCookieName = "dnaos_line_oauth_state";
export const lineOAuthNextCookieName = "dnaos_line_oauth_next";
export const lineOAuthLinkTokenCookieName = "dnaos_line_link_token";
export const lineRegProfileCookieName = "dnaos_line_reg_profile";

export type LineRegProfile = {
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
};

export function createLineRegProfileCookie(profile: LineRegProfile) {
  const value = Buffer.from(JSON.stringify(profile)).toString("base64");
  return serializeCookie(lineRegProfileCookieName, value, { maxAge: 15 * 60 });
}

export function parseLineRegProfileCookie(raw: string): LineRegProfile | null {
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf-8")) as LineRegProfile;
  } catch {
    return null;
  }
}

const lineSessionDays = 7;
const adminSessionHours = 12;
const oauthCookieMaxAgeSeconds = 10 * 60;

type CookieOptions = {
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
};

export type CreateLineSessionInput = {
  userId: string;
  companyId: string;
  role: Role;
  lineUserId: string;
};

export function parseCookieHeader(cookieHeader?: string) {
  const cookies = new Map<string, string>();

  if (!cookieHeader) {
    return cookies;
  }

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName) {
      continue;
    }

    cookies.set(rawName, decodeURIComponent(rawValue.join("=")));
  }

  return cookies;
}

export function serializeCookie(name: string, value: string, options: CookieOptions = {}) {
  const segments = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path ?? "/"}`,
    `SameSite=${options.sameSite ?? "Lax"}`
  ];

  if (options.httpOnly ?? true) {
    segments.push("HttpOnly");
  }

  if (options.secure ?? env.NODE_ENV === "production") {
    segments.push("Secure");
  }

  if (typeof options.maxAge === "number") {
    segments.push(`Max-Age=${options.maxAge}`);
  }

  return segments.join("; ");
}

export function clearCookie(name: string) {
  return serializeCookie(name, "", {
    maxAge: 0
  });
}

export function createOAuthCookie(name: string, value: string) {
  return serializeCookie(name, value, {
    maxAge: oauthCookieMaxAgeSeconds
  });
}

export async function createLineSession(input: CreateLineSessionInput) {
  const prisma = getPrisma();
  const token = createOpaqueToken();
  const expiresAt = addDays(new Date(), lineSessionDays);

  await prisma.appSession.create({
    data: {
      sessionTokenHash: hashOpaqueToken(token),
      userId: input.userId,
      companyId: input.companyId,
      role: input.role,
      lineUserId: input.lineUserId,
      sessionType: "LINE",
      expiresAt
    }
  });

  return {
    token,
    cookie: serializeCookie(lineSessionCookieName, token, {
      maxAge: lineSessionDays * 24 * 60 * 60
    }),
    expiresAt
  };
}

export async function createAdminSession(input: { adminId: string }) {
  const prisma = getPrisma();
  const token = createOpaqueToken();
  const expiresAt = addHours(new Date(), adminSessionHours);

  await prisma.adminSession.create({
    data: {
      sessionTokenHash: hashOpaqueToken(token),
      adminId: input.adminId,
      expiresAt
    }
  });

  return {
    token,
    cookie: serializeCookie(adminSessionCookieName, token, {
      maxAge: adminSessionHours * 60 * 60
    }),
    expiresAt
  };
}

export async function getLineSessionByToken(token?: string | null) {
  if (!token) {
    return null;
  }

  const prisma = getPrisma();

  return prisma.appSession.findFirst({
    where: {
      sessionTokenHash: hashOpaqueToken(token),
      sessionType: "LINE",
      revokedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: true,
      company: true
    }
  });
}

export async function revokeLineSession(token?: string | null) {
  if (!token) {
    return null;
  }

  const prisma = getPrisma();

  return prisma.appSession.updateMany({
    where: {
      sessionTokenHash: hashOpaqueToken(token),
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
}

export async function getAdminSessionByToken(token?: string | null) {
  if (!token) {
    return null;
  }

  const prisma = getPrisma();

  return prisma.adminSession.findFirst({
    where: {
      sessionTokenHash: hashOpaqueToken(token),
      revokedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      admin: true
    }
  });
}

export async function revokeAdminSession(token?: string | null) {
  if (!token) {
    return null;
  }

  const prisma = getPrisma();

  return prisma.adminSession.updateMany({
    where: {
      sessionTokenHash: hashOpaqueToken(token),
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
}
