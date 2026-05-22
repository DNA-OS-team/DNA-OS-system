import { NextRequest, NextResponse } from "next/server";

const backendBaseUrl =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_BACKEND_API_URL ??
  "http://localhost:5100";

type BackendProxyContext = {
  params: Promise<{
    path: string[];
  }>;
};

export async function GET(request: NextRequest, context: BackendProxyContext) {
  return proxyBackendRequest(request, context);
}

export async function POST(request: NextRequest, context: BackendProxyContext) {
  return proxyBackendRequest(request, context);
}

export async function PATCH(request: NextRequest, context: BackendProxyContext) {
  return proxyBackendRequest(request, context);
}

export async function PUT(request: NextRequest, context: BackendProxyContext) {
  return proxyBackendRequest(request, context);
}

export async function DELETE(request: NextRequest, context: BackendProxyContext) {
  return proxyBackendRequest(request, context);
}

async function proxyBackendRequest(
  request: NextRequest,
  context: BackendProxyContext
) {
  const { path } = await context.params;
  const targetUrl = new URL(path.join("/"), `${backendBaseUrl}/`);
  targetUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.set("host", targetUrl.host);
  headers.delete("content-length");

  const backendResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method)
      ? undefined
      : await request.arrayBuffer(),
    redirect: "manual",
  });
  const responseHeaders = new Headers(backendResponse.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
}
