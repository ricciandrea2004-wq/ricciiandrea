// Supabase Auth settings shared by the server client and the middleware. The keys stay server
// side (no NEXT_PUBLIC_): every sign-in step runs in a server action or a route handler.
export type SupabaseAuthConfig = { url: string; key: string };

export function supabaseAuthConfig(): SupabaseAuthConfig | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

/** Only paths inside the workspace (or the new-password page) are valid after signing in. */
export function safeNext(next: string | null | undefined, fallback = "/app") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next === "/app" || next.startsWith("/app/") || next.startsWith("/accedi/nuova-password") ? next : fallback;
}
