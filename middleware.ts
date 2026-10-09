import { NextResponse, type NextRequest } from "next/server";

// /analytics is internal. It is protected with HTTP Basic auth (ANALYTICS_USER, ANALYTICS_PASSWORD)
// until the workspace has real accounts. Without a password set, the page is closed.
export function middleware(request: NextRequest) {
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

export const config = { matcher: ["/analytics", "/analytics/:path*"] };
