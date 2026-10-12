import type { Metadata } from "next";
import NewSignalForm from "@/components/workspace/NewSignalForm";
import PageHead from "@/components/workspace/PageHead";
import Topbar from "@/components/workspace/Topbar";
import { getWorkspace } from "@/lib/workspace/data";

export const metadata: Metadata = { title: "Nuovo segnale" };

export default async function NewSignalPage() {
  const { competitors, organization, sources } = await getWorkspace();
  return (
    <>
      <Topbar
        crumbs={[
          { label: organization.name, href: "/app" },
          { label: "Segnali", href: "/app/segnali" },
          { label: "Nuovo segnale" },
        ]}
      />
      <div className="ws-content ws-content--doc">
        <PageHead eyebrow="Segnali" icon="plus" title="Nuovo segnale" description="Registra un cambiamento. Resta da verificare finché un collega non lo conferma." />
        <NewSignalForm competitors={competitors} sources={sources} />
      </div>
    </>
  );
}
