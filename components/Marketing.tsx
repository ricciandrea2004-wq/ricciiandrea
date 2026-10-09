import Link from "next/link";
import Icon, { type IconName } from "./Icon";

export function PageHero({ eyebrow, title, lead, children }: { eyebrow?: string; title: string; lead?: string; children?: React.ReactNode }) {
  return (
    <section className="page-hero">
      <div className="container ds-stagger">
        {eyebrow && (
          <p className="eyebrow" style={{ "--i": 0 } as React.CSSProperties}>
            {eyebrow}
          </p>
        )}
        <h1 className="display" style={{ "--i": 1, maxWidth: 860, marginTop: 12 } as React.CSSProperties}>
          {title}
        </h1>
        {lead && (
          <p className="lead" style={{ "--i": 2 } as React.CSSProperties}>
            {lead}
          </p>
        )}
        {children && <div style={{ "--i": 3, marginTop: 28 } as React.CSSProperties}>{children}</div>}
      </div>
    </section>
  );
}

export function Feature({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  return (
    <div className="feature reveal">
      <span className="feature__icon">
        <Icon name={icon} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export function SectionHead({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="section__head reveal">
      <h2>{title}</h2>
      {lead && <p className="lead">{lead}</p>}
    </div>
  );
}

export function CtaBand({ title = "Porta il prossimo briefing su segnali verificati.", text }: { title?: string; text?: string }) {
  return (
    <section className="section">
      <div className="container">
        <div className="cta-band reveal">
          <h2>{title}</h2>
          {text && (
            <p className="muted" style={{ marginTop: 12, maxWidth: 560 }}>
              {text}
            </p>
          )}
          <div className="hero__actions" style={{ marginTop: 24 }}>
            <Link href="/richiedi-accesso" className="btn btn-primary btn-lg">
              Richiedi accesso
            </Link>
            <Link href="/contatti" className="btn btn-secondary btn-lg">
              Parla con noi
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
