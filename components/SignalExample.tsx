import SignalCard from "./motion/SignalCard";

// The example signal shown on the public pages, animated when it comes into view.
export default function SignalExample({
  kind = "Prezzo · Competitor A",
  title = "Il piano Pro scende da 52 a 48 euro al mese",
  before = "52 €",
  after = "48 €",
  source = "pagina prezzi pubblica del competitor",
  observed = "2 ottobre 2026",
  status = { label: "Verificato", color: "green" as const },
  startStatus,
  className = "",
}: {
  kind?: string;
  title?: string;
  before?: string;
  after?: string;
  source?: string;
  observed?: string;
  status?: { label: string; color: "green" | "yellow" | "blue" };
  /** If given, the card shows this status first and moves to `status` once the value has changed. */
  startStatus?: { label: string; color: "green" | "yellow" | "blue" };
  className?: string;
}) {
  return (
    <SignalCard
      kind={kind}
      title={title}
      before={before}
      after={after}
      source={source}
      observed={observed}
      status={status}
      startStatus={startStatus}
      className={className}
    />
  );
}
