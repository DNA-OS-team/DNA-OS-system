import type { FastifyReply, FastifyRequest } from "fastify";
import {
  adminSessionCookieName,
  getAdminSessionByToken,
  getLineSessionByToken,
  lineSessionCookieName,
  parseCookieHeader
} from "./sessionService.js";

export async function getCurrentLineSession(request: FastifyRequest) {
  const cookies = parseCookieHeader(request.headers.cookie);

  return getLineSessionByToken(cookies.get(lineSessionCookieName));
}

export async function getCurrentAdminSession(request: FastifyRequest) {
  const cookies = parseCookieHeader(request.headers.cookie);

  return getAdminSessionByToken(cookies.get(adminSessionCookieName));
}

export async function requireAdminAccess(request: FastifyRequest, reply: FastifyReply) {
  const adminSession = await getCurrentAdminSession(request);

  if (adminSession?.admin.status === "ACTIVE" && adminSession.admin.role === "ADMIN") {
    return;
  }

  const lineSession = await getCurrentLineSession(request);

  if (lineSession?.user.status === "ACTIVE" && lineSession.role === "ADMIN") {
    return;
  }

  return reply.code(401).send({
    error: "Admin authentication required"
  });
}
