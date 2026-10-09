import type { Metadata } from "next";
import Tag from "@/components/Tag";
import SettingsForm from "@/components/workspace/SettingsForm";
import { members } from "@/lib/demo-data";
import { roleLabel } from "@/lib/domain";

export const metadata: Metadata = { title: "Membri" };

export default function MembersPage() {
  return (
    <div className="stack ds-page" style={{ gap: 40 }}>
      <section>
        <h2 className="block-title">Invita una persona</h2>
        <SettingsForm submitLabel="Invia invito">
          <div className="form-grid">
            <div className="field">
              <label className="label" htmlFor="m-email">
                Email
              </label>
              <input id="m-email" className="input" type="email" required placeholder="nome@azienda.it" />
            </div>
            <div className="field">
              <label className="label" htmlFor="m-role">
                Ruolo
              </label>
              <select id="m-role" className="select" defaultValue="editor">
                <option value="editor">{roleLabel.editor}</option>
                <option value="viewer">{roleLabel.viewer}</option>
              </select>
            </div>
          </div>
        </SettingsForm>
      </section>
      <section>
        <h2 className="block-title">Membri</h2>
        <ul className="list">
          {members.map((m) => (
            <li key={m.id}>
              <div className="list__item">
                <span className="ws-org__badge" aria-hidden="true" style={{ width: 28, height: 28, borderRadius: 999 }}>
                  {(m.name || m.email).charAt(0).toUpperCase()}
                </span>
                <span className="list__main">
                  <strong>{m.name || m.email}</strong>
                  {m.name && <span className="xs muted">{m.email}</span>}
                </span>
                <span className="list__aside">
                  {m.joinedAt ? <span>{roleLabel[m.role]}</span> : <Tag color="yellow">Invito in attesa</Tag>}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
