"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isLang, stripLang, withLang, type Lang } from "@/lib/lang";

export type { Lang };

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function writeCookie(lang: Lang) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `beehive-reo=${lang}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

function pathFor(lang: Lang) {
  const url = new URL(window.location.href);
  const parts = url.pathname.split("/");
  if (isLang(parts[1])) parts[1] = lang;
  else parts.splice(1, 0, lang);
  url.pathname = parts.join("/") || `/${lang}`;
  url.searchParams.delete("reo");
  return url;
}

export function LanguageProvider({
  initial,
  children,
}: {
  initial: Lang;
  children: React.ReactNode;
}) {
  const [lang] = useState<Lang>(initial);

  useEffect(() => {
    document.documentElement.lang = lang === "mi" ? "mi" : "en";
  }, [lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang: (next) => {
        writeCookie(next);
        window.location.assign(pathFor(next));
      },
    }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("LanguageProvider is missing");
  return value;
}

export function LangLink({
  href,
  children,
  ...props
}: { href: string } & Omit<React.ComponentProps<typeof Link>, "href">) {
  const { lang } = useLang();
  return (
    <Link href={withLang(lang, href)} {...props}>
      {children}
    </Link>
  );
}

export { stripLang };

export function T({ en, mi }: { en: string; mi: string }) {
  const { lang } = useLang();
  const hasMi = mi.trim().length > 0;
  if (lang === "en" || !hasMi) return <span lang="en">{en}</span>;
  if (lang === "mi") return <span lang="mi">{mi}</span>;
  return (
    <span className="bilingual">
      <span lang="en">{en}</span>
      <span lang="mi">{mi}</span>
    </span>
  );
}
