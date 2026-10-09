"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "../Icon";

const tabs: { href: string; label: string; icon: IconName }[] = [
  { href: "/app/impostazioni/profilo", label: "Profilo", icon: "user" },
  { href: "/app/impostazioni/organizzazione", label: "Organizzazione", icon: "building" },
  { href: "/app/impostazioni/membri", label: "Membri", icon: "users" },
];

export default function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav className="db-toolbar" aria-label="Impostazioni" style={{ marginBottom: 32 }}>
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className="view-tab" aria-current={pathname === t.href ? "page" : undefined}>
          <Icon name={t.icon} />
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
