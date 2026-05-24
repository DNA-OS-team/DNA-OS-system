import { redirect } from "next/navigation";

export default async function LineSupplierCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; state?: string; error?: string }>;
}) {
  const { code, state, error } = await searchParams;
  const qs = new URLSearchParams();
  if (code) qs.set("code", code);
  if (state) qs.set("state", state);
  if (error) qs.set("error", error);
  redirect(`/api/backend/auth/line-supplier/callback?${qs.toString()}`);
}
