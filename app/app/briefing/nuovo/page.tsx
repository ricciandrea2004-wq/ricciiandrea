import type { Metadata } from "next";
import BriefingComposer from "@/components/workspace/BriefingComposer";
import PageHead from "@/components/workspace/PageHead";
import Topbar from "@/components/workspace/Topbar";
import { competitors, organization, signals, sources } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Nuovo briefing" };

export default function NewBriefingPage() {
  return (
    <>
      <Topbar crumbs={[{ label: organization.name, href: "/app" }, { label: "Briefing", href: "/app/briefing" }, { label: "Nuovo briefing" }]} />
      <div className="ws-content">
        <PageHead icon="doc" title="Nuovo briefing" description="Scegli i segnali verificati: la bozza si compone mentre selezioni." />
        <BriefingComposer signals={signals} competitors={competitors} sources={sources} />
      </div>
    </>
  );
}
