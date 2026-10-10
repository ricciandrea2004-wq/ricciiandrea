import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { markSignedIn } from "@/lib/auth/session-cookie";
import { safeNext } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TYPES: EmailOtpType[] = ["email", "magiclink", "signup", "invite", "recovery", "email_change"];

// Where the links in our emails land. `token_hash` comes from the links we build in
// /api/email/auth-hook; `code` from Supabase's own emails (if the hook is off). Either way the
// session is stored in cookies and the person goes on to `next`.
// Supabase Auth limits how many links can be verified per IP; a link works once and expires.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const recovery = type === "recovery";
  // A reset goes to the new-password page; an accepted invite too, to choose the first password.
  const next =
    recovery ? "/accedi/nuova-password" : type === "invite" ? "/accedi/nuova-password?benvenuto=1" : safeNext(url.searchParams.get("next"));

  const supabase = await createSupabaseServer();
  if (supabase) {
    const { error } = tokenHash && type && TYPES.includes(type)
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : code
        ? await supabase.auth.exchangeCodeForSession(code)
        : { error: { message: "missing token" } };
    if (!error) {
      await markSignedIn();
      return NextResponse.redirect(new URL(next, url.origin));
    }
    console.warn(`[auth] link non valido: ${error.message}`);
  }
  const fail = new URL(recovery ? "/accedi/password-dimenticata" : "/accedi", url.origin);
  fail.searchParams.set("errore", "link");
  return NextResponse.redirect(fail);
}
