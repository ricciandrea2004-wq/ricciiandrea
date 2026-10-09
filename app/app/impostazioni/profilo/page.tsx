import type { Metadata } from "next";
import ThemeSwitch from "@/components/ThemeSwitch";
import SettingsForm from "@/components/workspace/SettingsForm";
import { members } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Profilo" };

export default function ProfilePage() {
  const me = members[0];
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
              <input id="p-email" className="input" type="email" defaultValue={me.email} readOnly aria-describedby="p-email-hint" />
              <span className="hint" id="p-email-hint">
                È l&apos;indirizzo a cui arriva il link di accesso.
              </span>
            </div>
          </div>
        </SettingsForm>
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
