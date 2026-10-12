import Icon, { type IconName } from "../Icon";

export default function PageHead({
  icon,
  eyebrow,
  title,
  description,
  actions,
}: {
  icon: IconName;
  // Occhiello nel colore d'accento sopra il titolo, come nelle sezioni della landing.
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="page-head ds-page">
      <div className="page-head__top">
        <span className="page-head__tile" aria-hidden="true">
          <Icon name={icon} className="page-head__icon" />
        </span>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      </div>
      <div className="page-head__row">
        <h1>{title}</h1>
        {actions && <div className="row">{actions}</div>}
      </div>
      {description && <p className="muted">{description}</p>}
    </header>
  );
}
