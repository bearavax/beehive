import type { Metadata } from "next";
import { Newsreader, Public_Sans } from "next/font/google";
import { cookies, headers } from "next/headers";
import { SiteFrame } from "@/components/chrome";
import { LanguageProvider, type Lang } from "@/lib/i18n";
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

function readLang(value: string | null | undefined): Lang {
  return value === "en" || value === "mi" || value === "bi" ? value : "bi";
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const initial = readLang(headerStore.get("x-beehive-reo") ?? cookieStore.get("beehive-reo")?.value);
  const nonce = headerStore.get("x-nonce") ?? undefined;

  return (
    <html lang={initial === "mi" ? "mi" : "en"} nonce={nonce} className={`${serif.variable} ${sans.variable}`}>
      <body>
        <LanguageProvider initial={initial}>
          <SiteFrame>{children}</SiteFrame>
        </LanguageProvider>
      </body>
    </html>
  );
}
