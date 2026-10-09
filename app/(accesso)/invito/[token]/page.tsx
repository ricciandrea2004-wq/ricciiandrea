import type { Metadata } from "next";
import Icon from "@/components/Icon";
import MagicLinkForm from "@/components/MagicLinkForm";

export const metadata: Metadata = { title: "Invito", robots: { index: false } };

// The token will be checked against Supabase once invites are stored there.
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  await params;
  return (
    <div className="auth-card ds-dialog">
      <Icon name="users" className="page-head__icon" />
      <div>
        <h1>Ti hanno invitato su Competia</h1>
        <p className="muted small" style={{ marginTop: 6 }}>
          Entra con l&apos;email a cui è arrivato l&apos;invito: ti aggiungiamo al team e ti mandiamo il link di accesso.
        </p>
      </div>
      <MagicLinkForm submitLabel="Accetta l'invito" />
    </div>
  );
}
