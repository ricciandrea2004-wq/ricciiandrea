import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAuthConfig } from "@/lib/supabase/config";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/analytics" || pathname.startsWith("/analytics/")) return analytics(request);
  return workspace(request);
}

// /app is for signed-in people only. The session lives in Supabase Auth cookies; this refreshes
// the token when it expires and sends everyone else to /accedi, keeping where they were going.
async function workspace(request: NextRequest) {
  const login = request.nextUrl.clone();
  login.pathname = "/accedi";
  login.search = "";
  login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);

  const config = supabaseAuthConfig();
  if (!config) return NextResponse.redirect(login);

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub) return response;

  const redirect = NextResponse.redirect(login);
  // Keep any cookie changes (an expired session being cleared) on the redirect too.
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
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
