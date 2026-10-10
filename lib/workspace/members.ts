import type { Member } from "@/lib/domain";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

/** People with an account (Supabase Auth). Null when the service role key is not on this site. */
export async function listMembers(): Promise<Member[] | null> {
  const admin = createSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) {
    console.error(`[workspace] membri: ${error.message}`);
    return null;
  }
  return data.users
    .map((u) => ({
      id: u.id,
      name: typeof u.user_metadata?.name === "string" ? u.user_metadata.name : "",
      email: u.email ?? "",
      role: (u.app_metadata?.role === "admin" ? "owner" : "editor") as Member["role"],
      // Invited people who never signed in show as "Invito in attesa".
      joinedAt: u.last_sign_in_at ?? null,
    }))
    .sort((a, b) => a.email.localeCompare(b.email));
}
