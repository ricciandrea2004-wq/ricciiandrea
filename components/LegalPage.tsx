import Callout from "./Callout";

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="container-narrow" style={{ paddingBlock: "clamp(48px, 8vw, 96px)" }}>
      <p className="eyebrow">Legale</p>
      <h1 style={{ marginTop: 12 }}>{title}</h1>
      <p className="muted small" style={{ marginTop: 8 }}>
        Ultimo aggiornamento: {updated}
      </p>
      <div style={{ marginTop: 24 }}>
        <Callout icon="info">
          <strong>Bozza da far rivedere.</strong> Questo testo è una base di lavoro. Le parti tra parentesi quadre vanno
          completate e il documento va controllato da un consulente legale prima della pubblicazione.
        </Callout>
      </div>
      <div className="prose" style={{ marginTop: 32 }}>
        {children}
      </div>
    </div>
  );
}
