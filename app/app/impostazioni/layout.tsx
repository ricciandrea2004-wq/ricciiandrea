import SettingsTabs from "@/components/workspace/SettingsTabs";
import PageHead from "@/components/workspace/PageHead";
import Topbar from "@/components/workspace/Topbar";
import { getWorkspace } from "@/lib/workspace/data";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { organization } = await getWorkspace();
  return (
    <>
      <Topbar crumbs={[{ label: organization.name, href: "/app" }, { label: "Impostazioni" }]} />
      <div className="ws-content ws-content--doc">
        <PageHead eyebrow="Workspace" icon="settings" title="Impostazioni" />
        <SettingsTabs />
        {children}
      </div>
    </>
  );
}
