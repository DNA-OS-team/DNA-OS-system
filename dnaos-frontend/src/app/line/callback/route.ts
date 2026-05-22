import { NextResponse, type NextRequest } from "next/server";

export function GET(request: NextRequest) {
  const apiBaseUrl =
    process.env.BACKEND_API_URL ??
    process.env.NEXT_PUBLIC_BACKEND_API_URL ??
    "http://localhost:5100";
  const callbackUrl = new URL("/auth/line/callback", apiBaseUrl);
  callbackUrl.search = request.nextUrl.search;

  return NextResponse.redirect(callbackUrl);
}
