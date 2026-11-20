import type { Metadata } from "next";
import { headers } from "next/headers";
import { Newsreader, Public_Sans } from "next/font/google";
import { htmlLang } from "@/lib/lang";
import "./globals.css";

const serif = Newsreader({
  subsets: ["latin", "latin-ext"],
  variable: "--font-newsreader",
  display: "swap",
});

const sans = Public_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-public",
  display: "swap",
});

const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://beehive.local";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: "Beehive — Ngā whakataunga o Te Kaunihera o Pōneke",
    template: "%s — Beehive",
  },
  description:
    "A bilingual record of Wellington City Council decisions for the 2025–2028 triennium. Plain language, named votes only when Mātai Manapori publishes them, and a standing place for Tākai Here Pouiwi.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const lang = htmlLang((await headers()).get("x-beehive-lang"));
  return (
    <html lang={lang} className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
