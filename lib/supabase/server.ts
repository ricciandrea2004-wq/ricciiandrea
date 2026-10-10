import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAuthConfig } from "./config";

/** Supabase client bound to the request cookies. Null when SUPABASE_URL or the key is missing. */
export async function createSupabaseServer() {
  // Read cookies first, so pages that ask for the user are always rendered per request.
  const store = await cookies();
  const config = supabaseAuthConfig();
  if (!config) return null;
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component, where cookies are read-only: the middleware refreshes the session.
        }
      },
    },
  });
}

/** The signed-in person's id and email, verified from the session token, or null. */
export async function currentUser(): Promise<{ id: string; email: string } | null> {
  const supabase = await createSupabaseServer();
  if (!supabase) return null;
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" };
}
