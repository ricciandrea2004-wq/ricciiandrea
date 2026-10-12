import { createClient } from "@supabase/supabase-js";

/**
 * Supabase with the service role key, for the few admin steps (inviting, listing members).
 * Server only, and only after checking that the signed-in person is an admin. Null without the key.
 */
export function createSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
