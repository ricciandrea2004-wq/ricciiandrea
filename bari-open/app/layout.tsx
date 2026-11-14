import type { Metadata } from "next";
import { Fraunces, Sora } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Vista Bari — cruscotto open data",
    template: "%s · Vista Bari",
  },
  description:
    "Cruscotto civico sulla mobilità di Bari: centraline semaforiche, flussi di traffico e incidenti stradali da open data comunali.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${fraunces.variable} ${sora.variable}`}>
      <body
        style={
          {
            ["--font-display" as string]: "var(--font-fraunces), Georgia, serif",
            ["--font-body" as string]: "var(--font-sora), Segoe UI, sans-serif",
          } as React.CSSProperties
        }
      >
        <div className="site-shell">
          <SiteHeader />
          <main className="site-main">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
