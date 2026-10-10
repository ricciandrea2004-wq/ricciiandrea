import type { Metadata } from "next";
import Tag from "@/components/Tag";
import { InviteForm } from "@/components/workspace/DataForms";
import SettingsForm from "@/components/workspace/SettingsForm";
import { currentUser } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/workspace/data";
import { listMembers } from "@/lib/workspace/members";
import { roleLabel } from "@/lib/domain";

export const metadata: Metadata = { title: "Membri" };

export default async function MembersPage() {
  const ws = await getWorkspace();
  const user = await currentUser();
  const real = ws.live ? await listMembers() : null;
  const members = real ?? ws.members;
  return (
    <div className="stack ds-page" style={{ gap: 40 }}>
      <section>
        <h2 className="block-title">Invita una persona</h2>
        {real ? (
          user?.admin ? (
            <>
              <p className="small muted" style={{ marginBottom: 16 }}>
                Riceve un&apos;email con il link per entrare e scegliere la password. Il link vale 1 ora.
              </p>
              <InviteForm />
            </>
          ) : (
            <p className="small muted">Solo chi amministra lo spazio può invitare. Chiedilo a un amministratore.</p>
          )
        ) : (
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
        )}
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
