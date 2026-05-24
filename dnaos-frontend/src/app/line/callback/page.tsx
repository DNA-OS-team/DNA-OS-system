import { redirect } from "next/navigation";

// LINE OAuth redirects here after user approves.
// We forward code+state to the backend via the Next.js proxy so that
// the OAuth state cookie (set on this domain) is included in the request.
export default async function LineCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; state?: string; error?: string }>;
}) {
  const { code, state, error } = await searchParams;
  const qs = new URLSearchParams();
  if (code) qs.set("code", code);
  if (state) qs.set("state", state);
  if (error) qs.set("error", error);
  redirect(`/api/backend/auth/line/callback?${qs.toString()}`);
}
