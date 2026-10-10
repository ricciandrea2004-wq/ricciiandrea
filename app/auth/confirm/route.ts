import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TYPES: EmailOtpType[] = ["email", "magiclink", "signup", "invite", "recovery", "email_change"];

// Where the links in our emails land. `token_hash` comes from the links we build in
// /api/email/auth-hook; `code` from Supabase's own emails (if the hook is off). Either way the
// session is stored in cookies and the person goes on to `next`.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const recovery = type === "recovery";
  const next = safeNext(url.searchParams.get("next"), recovery ? "/accedi/nuova-password" : "/app");

  const supabase = await createSupabaseServer();
  if (supabase) {
    const { error } = tokenHash && type && TYPES.includes(type)
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : code
        ? await supabase.auth.exchangeCodeForSession(code)
        : { error: { message: "missing token" } };
    if (!error) return NextResponse.redirect(new URL(recovery ? "/accedi/nuova-password" : next, url.origin));
    console.warn(`[auth] link non valido: ${error.message}`);
  }
  const fail = new URL(recovery ? "/accedi/password-dimenticata" : "/accedi", url.origin);
  fail.searchParams.set("errore", "link");
  return NextResponse.redirect(fail);
}
