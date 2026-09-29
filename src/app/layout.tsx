import type { Metadata } from "next";
import { Instrument_Serif, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_LOADED_KEY } from "@/components/siteLoaded";
import PageTransition from "@/components/PageTransition";

// Runs before the first paint: if the loading screen already played this
// visit, flag <html> so CSS hides it instead of flashing it again.
const siteLoadedScript = `try{if(sessionStorage.getItem(${JSON.stringify(SITE_LOADED_KEY)}))document.documentElement.dataset.siteLoaded=""}catch(e){}`;

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Adriel Colaço — UI Design, Direção de Arte & Front-end",
  description:
    "Especialista em UI design, Direção de Arte & Desenvolvimento Front-end. Design guiado por estratégia & usabilidade.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${instrumentSerif.variable} ${geistMono.variable} antialiased`}
      // The inline script below may add data-site-loaded before hydration.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: siteLoadedScript }} />
      </head>
      <body>
        {children}
        {/* The blue curtain that carries you from page to page. */}
        <PageTransition />
      </body>
    </html>
  );
}
