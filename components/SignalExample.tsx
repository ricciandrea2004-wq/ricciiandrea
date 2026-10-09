import SignalCard, { type SignalSample } from "./motion/SignalCard";

const priceSample: SignalSample = {
  category: "price",
  kind: "Prezzo · Competitor A",
  title: "Il piano Pro scende da 52 a 48 euro al mese",
  before: "52 €",
  after: "48 €",
  source: "pagina prezzi pubblica del competitor",
  observed: "2 ottobre 2026",
  status: { label: "Verificato", color: "green" },
};

// The three samples the home page rotates through, one per signal category.
export const heroSamples: SignalSample[] = [
  { ...priceSample, startStatus: { label: "Da verificare", color: "yellow" } },
  {
    category: "promotion",
    kind: "Promozione · Competitor B",
    title: "Spedizione gratuita sopra i 300 euro, fino al 31 ottobre",
    before: "500 €",
    after: "300 €",
    source: "banner della pagina carrello",
    observed: "4 ottobre 2026",
    status: { label: "Verificato", color: "green" },
    startStatus: { label: "Da verificare", color: "yellow" },
  },
  {
    category: "assortment",
    kind: "Assortimento · Competitor C",
    title: "Tre nuovi modelli nella linea professionale",
    before: "12 modelli",
    after: "15 modelli",
    source: "catalogo online del competitor",
    observed: "6 ottobre 2026",
    status: { label: "Nel briefing", color: "blue" },
    startStatus: { label: "Verificato", color: "green" },
  },
];

// The example signal shown on the public pages, animated when it comes into view.
// Pass `samples` to rotate through several; otherwise one sample is built from the
// price example, with any field overridden by the props.
export default function SignalExample({
  samples,
  className = "",
  ...sample
}: Partial<SignalSample> & { samples?: SignalSample[]; className?: string }) {
  return <SignalCard signals={samples ?? [{ ...priceSample, ...sample }]} className={className} />;
}
