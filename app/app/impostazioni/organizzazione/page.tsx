import type { Metadata } from "next";
import SettingsForm from "@/components/workspace/SettingsForm";
import { organization } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Organizzazione" };

export default function OrganizationPage() {
  return (
    <section className="ds-page">
      <h2 className="block-title">Organizzazione</h2>
      <SettingsForm>
        <div className="field">
          <label className="label" htmlFor="o-name">
            Nome
          </label>
          <input id="o-name" className="input" defaultValue={organization.name} />
        </div>
        <div className="field">
          <span className="label">Logo</span>
          <div className="row" style={{ gap: 12 }}>
            <span className="ws-org__badge" aria-hidden="true" style={{ width: 40, height: 40, fontSize: 18 }}>
              {organization.name.charAt(0)}
            </span>
            <label className="btn btn-secondary" htmlFor="o-logo">
              Carica un&apos;immagine
            </label>
            <input id="o-logo" type="file" accept="image/png,image/jpeg,image/svg+xml" className="visually-hidden" />
          </div>
          <span className="hint">PNG, JPG o SVG, quadrato, almeno 128 × 128 px.</span>
        </div>
      </SettingsForm>
    </section>
  );
}
