// How long a session lasts. Supabase refreshes the access token every hour on its own; on top of
// that Competia closes the session after a week from sign-in, or after 12 hours without opening
// the workspace. Both are checked in middleware.ts on every /app request.
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
export const SESSION_IDLE_SECONDS = 12 * 60 * 60;
export const LAST_SEEN_COOKIE = "competia-attivita";

/** Cookie options for the Supabase session cookies: gone from the browser after a week. */
export const sessionCookieOptions = {
  maxAge: SESSION_MAX_AGE_SECONDS,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
};

type Amr = { method?: string; timestamp?: number };

/** When the person signed in (seconds), from the token's `amr`; falls back to `iat`. */
export function signedInAt(claims: { amr?: unknown; iat?: number }) {
  const times = Array.isArray(claims.amr) ? (claims.amr as Amr[]).map((a) => a.timestamp).filter((t): t is number => typeof t === "number") : [];
  return times.length > 0 ? Math.min(...times) : (claims.iat ?? 0);
}
