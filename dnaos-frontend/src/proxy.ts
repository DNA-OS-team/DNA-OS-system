import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const lineSessionCookieName = "dnaos_line_session";
const adminSessionCookieName = "dnaos_admin_session";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const hasLineSession = Boolean(request.cookies.get(lineSessionCookieName)?.value);
  const hasAdminSession = Boolean(request.cookies.get(adminSessionCookieName)?.value);

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (hasLineSession || hasAdminSession) {
      return NextResponse.next();
    }

    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);

    return NextResponse.redirect(loginUrl);
  }

  if (hasLineSession) {
    return NextResponse.next();
  }

  const connectUrl = new URL("/line/connect", request.url);
  connectUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);

  return NextResponse.redirect(connectUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/customer/:path*", "/partner/:path*", "/fleet/:path*"]
};
