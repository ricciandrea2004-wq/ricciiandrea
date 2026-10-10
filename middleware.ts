import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LAST_SEEN_COOKIE, SESSION_IDLE_SECONDS, SESSION_MAX_AGE_SECONDS, sessionCookieOptions, signedInAt } from "@/lib/auth/session";
import { supabaseAuthConfig } from "@/lib/supabase/config";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/analytics" || pathname.startsWith("/analytics/")) return analytics(request);
  return workspace(request);
}

// /app is for signed-in people only. The session lives in Supabase Auth cookies; this refreshes
// the token when it expires, closes sessions that are too old or idle (lib/auth/session.ts) and
// sends everyone else to /accedi, keeping where they were going.
async function workspace(request: NextRequest) {
  const login = (reason?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = "/accedi";
    url.search = "";
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    if (reason) url.searchParams.set("scaduta", reason);
    return url;
  };

  const config = supabaseAuthConfig();
  if (!config) return NextResponse.redirect(login());

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.key, {
    cookieOptions: sessionCookieOptions,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  const redirectKeepingCookies = (url: URL) => {
    const redirect = NextResponse.redirect(url);
    // Keep cookie changes (a refreshed or cleared session) on the redirect too.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return redirectKeepingCookies(login());

  const now = Math.floor(Date.now() / 1000);
  // Set at every sign-in (lib/auth/session-cookie.ts): a session without it is treated as idle.
  const lastSeen = Number(request.cookies.get(LAST_SEEN_COOKIE)?.value ?? 0);
  const expired = now - signedInAt(claims) > SESSION_MAX_AGE_SECONDS ? "1" : now - lastSeen > SESSION_IDLE_SECONDS ? "inattiva" : null;
  if (expired) {
    await supabase.auth.signOut({ scope: "local" });
    const redirect = redirectKeepingCookies(login(expired));
    redirect.cookies.delete(LAST_SEEN_COOKIE);
    return redirect;
  }
  response.cookies.set(LAST_SEEN_COOKIE, String(now), sessionCookieOptions);
  return response;
}

// /analytics is internal. It is protected with HTTP Basic auth (ANALYTICS_USER, ANALYTICS_PASSWORD).
// Without a password set, the page is closed.
function analytics(request: NextRequest) {
  const user = process.env.ANALYTICS_USER;
  const password = process.env.ANALYTICS_PASSWORD;
  if (!user || !password) {
    return new NextResponse("Analytics non configurata.", { status: 503 });
  }
  const header = request.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = atob(encoded);
    const i = decoded.indexOf(":");
    if (i > 0 && decoded.slice(0, i) === user && decoded.slice(i + 1) === password) {
      return NextResponse.next();
    }
  }
  return new NextResponse("Accesso richiesto.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Competia analytics", charset="UTF-8"' },
  });
}

export const config = { matcher: ["/analytics", "/analytics/:path*", "/app", "/app/:path*"] };
