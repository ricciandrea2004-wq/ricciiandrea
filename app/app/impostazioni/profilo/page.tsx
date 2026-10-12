import type { Metadata } from "next";
import ThemeSwitch from "@/components/ThemeSwitch";
import SettingsForm from "@/components/workspace/SettingsForm";
import Link from "next/link";
import { getWorkspace } from "@/lib/workspace/data";
import { currentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profilo" };

export default async function ProfilePage() {
  const ws = await getWorkspace();
  const user = await currentUser();
  const me = ws.live ? { name: "", email: user?.email ?? "" } : ws.members[0];
  return (
    <div className="stack ds-page" style={{ gap: 40 }}>
      <section>
        <h2 className="block-title">Il tuo profilo</h2>
        <SettingsForm>
          <div className="form-grid">
            <div className="field">
              <label className="label" htmlFor="p-name">
                Nome
              </label>
              <input id="p-name" className="input" defaultValue={me.name} />
            </div>
            <div className="field">
              <label className="label" htmlFor="p-email">
                Email
              </label>
              <input id="p-email" className="input" type="email" defaultValue={user?.email || me.email} readOnly aria-describedby="p-email-hint" />
              <span className="hint" id="p-email-hint">
                È l&apos;indirizzo con cui entri e a cui arrivano i codici di accesso.
              </span>
            </div>
          </div>
        </SettingsForm>
      </section>
      <hr className="divider" />
      <section>
        <h2 className="block-title">Password</h2>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <p className="small muted">La usi per entrare insieme all&apos;email. Se la dimentichi, puoi sempre entrare con un codice via email.</p>
          <Link href="/accedi/nuova-password" className="btn btn-secondary">
            Cambia password
          </Link>
        </div>
      </section>
      <hr className="divider" />
      <section>
        <h2 className="block-title">Aspetto</h2>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <p className="small muted">Tema chiaro, scuro o uguale a quello del sistema. Si applica subito.</p>
          <ThemeSwitch />
        </div>
      </section>
    </div>
  );
}
