"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "en" | "mi" | "bi";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function writeCookie(lang: Lang) {
  document.cookie = `beehive-reo=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function LanguageProvider({
  initial,
  children,
}: {
  initial: Lang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initial);

  useEffect(() => {
    document.documentElement.lang = lang === "mi" ? "mi" : "en";
  }, [lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang: (next) => {
        setLangState(next);
        writeCookie(next);
        const url = new URL(window.location.href);
        url.searchParams.set("reo", next);
        window.history.replaceState(null, "", url);
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
