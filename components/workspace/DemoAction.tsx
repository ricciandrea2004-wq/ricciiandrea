"use client";

import Icon, { type IconName } from "../Icon";
import { useShell } from "./WorkspaceShell";

// A button for an action that needs the database. It tells the user plainly that it is not active yet.
export default function DemoAction({
  label,
  icon,
  variant = "secondary",
  message = "Questa azione si attiva quando colleghiamo il database. Per ora i dati sono di esempio.",
  iconOnly = false,
}: {
  label: string;
  icon?: IconName;
  variant?: "primary" | "secondary" | "ghost";
  message?: string;
  iconOnly?: boolean;
}) {
  const { toast } = useShell();
  if (iconOnly && icon) {
    return (
      <button type="button" className="icon-btn" aria-label={label} title={label} onClick={() => toast(message)}>
        <Icon name={icon} />
      </button>
    );
  }
  return (
    <button type="button" className={`btn btn-${variant}`} onClick={() => toast(message)}>
      {icon && <Icon name={icon} />}
      {label}
    </button>
  );
}
