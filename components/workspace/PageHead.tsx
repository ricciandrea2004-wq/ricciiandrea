import Icon, { type IconName } from "../Icon";

export default function PageHead({
  icon,
  title,
  description,
  actions,
}: {
  icon: IconName;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="page-head ds-page">
      <Icon name={icon} className="page-head__icon" />
      <div className="page-head__row">
        <h1>{title}</h1>
        {actions && <div className="row">{actions}</div>}
      </div>
      {description && <p className="muted">{description}</p>}
    </header>
  );
}
