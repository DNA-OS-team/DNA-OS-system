import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../../config/env.js";

let adminClient: SupabaseClient | undefined;

export function getSupabaseAdmin() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase admin client requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  adminClient ??= createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return adminClient;
}
