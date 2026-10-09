import SettingsTabs from "@/components/workspace/SettingsTabs";
import PageHead from "@/components/workspace/PageHead";
import Topbar from "@/components/workspace/Topbar";
import { organization } from "@/lib/demo-data";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Topbar crumbs={[{ label: organization.name, href: "/app" }, { label: "Impostazioni" }]} />
      <div className="ws-content ws-content--doc">
        <PageHead icon="settings" title="Impostazioni" />
        <SettingsTabs />
        {children}
      </div>
    </>
  );
}
