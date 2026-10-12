import type { Metadata } from "next";
import { CompetitorForm } from "@/components/workspace/DataForms";
import PageHead from "@/components/workspace/PageHead";
import Topbar from "@/components/workspace/Topbar";
import { getWorkspace } from "@/lib/workspace/data";

export const metadata: Metadata = { title: "Nuovo competitor" };

export default async function NewCompetitorPage() {
  const { organization } = await getWorkspace();
  return (
    <>
      <Topbar
        crumbs={[
          { label: organization.name, href: "/app" },
          { label: "Competitor", href: "/app/competitor" },
          { label: "Nuovo competitor" },
        ]}
      />
      <div className="ws-content ws-content--doc">
        <PageHead eyebrow="Competitor" icon="plus" title="Nuovo competitor" description="Un'azienda da seguire. Dopo aggiungi le sue pagine pubbliche come fonti." />
        <CompetitorForm />
      </div>
    </>
  );
}
