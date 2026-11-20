import type { Metadata } from "next";
import { Newsreader, Public_Sans } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "Beehive — Ngā whakataunga o Te Kaunihera o Pōneke",
    template: "%s — Beehive",
  },
  description:
    "A bilingual record of Wellington City Council decisions for the 2025–2028 triennium. Plain language, named votes only when Mātai Manapori publishes them, and a standing place for Tākai Here Pouiwi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
