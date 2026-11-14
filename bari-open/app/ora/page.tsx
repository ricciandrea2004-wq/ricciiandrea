import type { Metadata } from "next";
import { LiveBusMap } from "@/components/LiveBusMap";

export const metadata: Metadata = {
  title: "Ora in città",
};

export default function OraPage() {
  return (
    <section className="section" style={{ paddingTop: "2rem" }}>
      <div className="container">
        <div className="page-hero">
          <p className="section__eyebrow">Live</p>
          <h1>Ora in città</h1>
          <p className="section__lead">
            Posizioni mezzi AMTAB in tempo reale (GTFS-RT pubblico). Nessuna telecamera: solo
            veicoli del trasporto pubblico. La qualità dell’aria ARPA è in prova via{" "}
            <code>/api/live/aria</code>.
          </p>
        </div>
        <LiveBusMap />
      </div>
    </section>
  );
}
