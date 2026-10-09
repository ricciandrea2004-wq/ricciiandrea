import type { Metadata } from "next";
import NewSignalForm from "@/components/workspace/NewSignalForm";
import PageHead from "@/components/workspace/PageHead";
import Topbar from "@/components/workspace/Topbar";
import { competitors, organization, sources } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Nuovo segnale" };

export default function NewSignalPage() {
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
        <PageHead icon="plus" title="Nuovo segnale" description="Registra un cambiamento. Resta da verificare finché un collega non lo conferma." />
        <NewSignalForm competitors={competitors} sources={sources} />
      </div>
    </>
  );
}
