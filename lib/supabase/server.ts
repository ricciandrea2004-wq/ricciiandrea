import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sessionCookieOptions } from "@/lib/auth/session";
import { supabaseAuthConfig } from "./config";

/** Supabase client bound to the request cookies. Null when SUPABASE_URL or the key is missing. */
export async function createSupabaseServer() {
  // Read cookies first, so pages that ask for the user are always rendered per request.
  const store = await cookies();
  const config = supabaseAuthConfig();
  if (!config) return null;
  return createServerClient(config.url, config.key, {
    cookieOptions: sessionCookieOptions,
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

export type CurrentUser = { id: string; email: string; admin: boolean };

/**
 * The signed-in person, verified from the session token, or null. `admin` comes from
 * app_metadata.role = "admin", which only the service role can set (people can't edit it).
 */
export async function currentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServer();
  if (!supabase) return null;
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  const appMeta = (claims.app_metadata ?? {}) as { role?: unknown };
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "", admin: appMeta.role === "admin" };
}
