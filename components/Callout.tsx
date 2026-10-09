import Icon, { type IconName } from "./Icon";

export default function Callout({ icon = "info", children }: { icon?: IconName; children: React.ReactNode }) {
  return (
    <div className="callout">
      <Icon name={icon} />
      <div>{children}</div>
    </div>
  );
}
