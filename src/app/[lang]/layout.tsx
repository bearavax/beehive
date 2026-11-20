import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { SiteFrame } from "@/components/chrome";
import { LanguageProvider } from "@/lib/i18n";
import { isLang, stripLang, withLang } from "@/lib/lang";

// Next.js 15.5.29 prerendered /en with 245 inline scripts, no nonce, and 9
// parser-inserted /_next/static script tags. A hash policy that keeps
// strict-dynamic would block those tags. Stay on the per-request nonce.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const pathname = (await headers()).get("x-beehive-path") ?? `/${lang}`;
  const bare = stripLang(pathname);
  return {
    alternates: {
      canonical: withLang(lang, bare),
      languages: {
        en: withLang("en", bare),
        mi: withLang("mi", bare),
        "x-default": withLang("bi", bare),
      },
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <LanguageProvider initial={lang}>
      <SiteFrame>{children}</SiteFrame>
    </LanguageProvider>
  );
}
