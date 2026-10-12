// The button goes straight to our /auth/confirm, which checks the token on the server and sets the
// session cookie (it works even if the link is opened in another browser). The site comes from
// redirect_to, which Supabase has already checked against its list of allowed URLs, so previews
// get links to themselves; `next` inside it says where to go afterwards.
export function confirmLink(tokenHash: string, type: string, redirectTo?: string, siteUrl?: string) {
  let base: URL;
  try {
    base = new URL(redirectTo || siteUrl || "https://www.competia.work");
  } catch {
    base = new URL("https://www.competia.work");
  }
  const link = new URL("/auth/confirm", base.origin);
  const next = base.searchParams.get("next");
  link.searchParams.set("token_hash", tokenHash);
  link.searchParams.set("type", type);
  if (next) link.searchParams.set("next", next);
  return link.toString();
}
