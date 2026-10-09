import type { Metadata, Viewport } from "next";
import { themeScript } from "@/components/ThemeSwitch";
import "./tokens.css";
import "./globals.css";

const description = "Segnali competitivi verificabili su prezzi, assortimento e promozioni, collegati alle fonti.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.competia.work"),
  title: { default: "competia.work · Intelligence commerciale B2B", template: "%s · competia.work" },
  description,
  applicationName: "competia.work",
  openGraph: { type: "website", locale: "it_IT", siteName: "competia.work", description },
  // The Open Graph image is app/opengraph-image.png (built by scripts/brand/render.mjs).
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#191919" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
