import type { Metadata, Viewport } from "next";
import { Fraunces, Sora } from "next/font/google";
import { KeyboardHelp } from "@/components/KeyboardHelp";
import { OnboardingTips } from "@/components/OnboardingTips";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { I18nProvider } from "@/lib/i18n";
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
  manifest: "/manifest.webmanifest",
  applicationName: "Vista Bari",
  appleWebApp: {
    title: "Vista Bari",
    capable: true,
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icon-192.png", sizes: "192x192" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0d5c6e",
  width: "device-width",
  initialScale: 1,
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
        <I18nProvider>
          <a className="skip-link" href="#contenuto-principale">
            Vai al contenuto
          </a>
          <div className="site-shell">
            <SiteHeader />
            <main id="contenuto-principale" className="site-main" tabIndex={-1}>
              {children}
            </main>
            <SiteFooter />
          </div>
          <OnboardingTips />
          <KeyboardHelp />
        </I18nProvider>
      </body>
    </html>
  );
}
