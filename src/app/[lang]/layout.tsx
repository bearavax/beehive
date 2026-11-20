import { notFound } from "next/navigation";
import { SiteFrame } from "@/components/chrome";
import { LanguageProvider } from "@/lib/i18n";
import { isLang } from "@/lib/lang";

// Nonce CSP is stamped while the document renders. A prerendered file has no
// nonce, and the middleware policy would block its inline scripts. Stay dynamic
// until the hash-based policy in docs/static-nodes.md replaces the nonce.
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
