import type { Metadata } from "next";
import Link from "next/link";
import { NewPasswordForm } from "@/components/auth/AuthForms";
import { currentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nuova password", robots: { index: false } };
export const dynamic = "force-dynamic";

// Reached from the reset email (the link signs the person in first) or from the profile.
export default async function NewPasswordPage() {
  const user = await currentUser();
  return (
    <div className="auth-card ds-dialog">
      <div>
        <h1>Scegli una nuova password</h1>
        <p className="muted small" style={{ marginTop: 6 }}>
          {user ? (
            <>
              Per <strong>{user.email}</strong>. Potrai entrare con email e password oppure, come sempre, con il link via email.
            </>
          ) : (
            "Per cambiare la password serve prima il link che ti mandiamo via email."
          )}
        </p>
      </div>
      {user ? (
        <NewPasswordForm />
      ) : (
        <Link href="/accedi/password-dimenticata" className="btn btn-primary btn-lg">
          Richiedi il link
        </Link>
      )}
    </div>
  );
}
