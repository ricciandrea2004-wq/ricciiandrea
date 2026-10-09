"use client";

// Last-resort error page when the root layout itself fails. Plain styles: tokens.css may not have loaded.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="it">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, padding: 16, textAlign: "center" }}>
        <div>
          <h1 style={{ fontSize: 28 }}>Qualcosa non ha funzionato.</h1>
          <p>Ricarica la pagina tra qualche istante.</p>
          <button type="button" onClick={reset} style={{ marginTop: 16, padding: "8px 14px", cursor: "pointer" }}>
            Riprova
          </button>
        </div>
      </body>
    </html>
  );
}
