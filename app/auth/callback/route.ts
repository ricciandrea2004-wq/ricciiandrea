import { NextResponse } from "next/server";

// Supabase Auth callback. Once auth is wired, this exchanges the `code` for a session
// (supabase.auth.exchangeCodeForSession) before redirecting. For now it only redirects.
export function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next");
  const target = next && next.startsWith("/app") ? next : "/app";
  return NextResponse.redirect(new URL(target, url.origin));
}
