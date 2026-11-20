import { notFound } from "next/navigation";
import { SiteFrame } from "@/components/chrome";
import { LanguageProvider } from "@/lib/i18n";
import { isLang } from "@/lib/lang";

// Next.js 15.5.29 prerendered /en with 245 inline scripts, no nonce, and 9
// parser-inserted /_next/static script tags. A hash policy that keeps
// strict-dynamic would block those tags. Stay on the per-request nonce.
export const dynamic = "force-dynamic";

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
