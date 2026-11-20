"use client";

import Link from "next/link";
import { OutboundLink } from "@/components/outbound";
import { usePathname } from "next/navigation";
import { LangLink, stripLang, T, useLang, type Lang } from "@/lib/i18n";

const links = [
  { href: "/", en: "Decisions", mi: "Ngā whakataunga" },
  { href: "/councillors", en: "Members", mi: "Ngā mema" },
  { href: "/issues", en: "Issues", mi: "Ngā kaupapa" },
  { href: "/about", en: "Methodology", mi: "Te tikanga" },
  { href: "/plugins", en: "Plug-ins", mi: "" },
];

const modes: { id: Lang; en: string; mi: string }[] = [
  { id: "en", en: "English", mi: "English" },
  { id: "mi", en: "Te reo Māori", mi: "Te reo Māori" },
  { id: "bi", en: "Bilingual", mi: "Reo rua" },
];

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { lang, setLang } = useLang();

  return (
    <>
      <a className="skip" href="#content">
        <T en="Skip to content" mi="Peke ki ngā kōrero" />
      </a>
      <header className="mast">
        <div className="mast-inner">
          <div className="mast-top">
            <div className="brand">
              <p className="eyebrow">Te Whanganui-a-Tara</p>
              <LangLink href="/" className="wordmark">
                Beehive
              </LangLink>
              <p className="tagline">
                <T
                  en="Plain-language decisions of Te Kaunihera o Pōneke, Wellington City Council."
                  mi="Ngā whakataunga reo māhorahora o Te Kaunihera o Pōneke."
                />
              </p>
            </div>
            <div className="lang" role="radiogroup" aria-label="Language">
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  role="radio"
                  aria-checked={lang === mode.id}
                  onClick={() => setLang(mode.id)}
                >
                  <span lang={mode.id === "mi" ? "mi" : "en"}>{lang === "mi" ? mode.mi : mode.en}</span>
                </button>
              ))}
            </div>
          </div>
          <nav className="nav" aria-label="Primary">
            {links.map((link) => {
              const bare = stripLang(pathname);
              const current = link.href === "/" ? bare === "/" : bare === link.href || bare.startsWith(`${link.href}/`);
              return (
                <LangLink key={link.href} href={link.href} aria-current={current ? "page" : undefined}>
                  <T en={link.en} mi={link.mi} />
                </LangLink>
              );
            })}
          </nav>
        </div>
      </header>
      <main id="content" className="page">
        <div className="wrap">{children}</div>
      </main>
      <footer className="foot">
        <div className="wrap">
          <p>
            <T
              en="Beehive reads published Mātai Manapori records and Council minutes. It does not invent votes. Official minutes remain the statutory record."
              mi="Ka pānui a Beehive i ngā rēkoata Mātai Manapori kua whakaputaina me ngā meneti a te Kaunihera. Kāore e tito pōti. Ko ngā meneti whaimana te pūkete ā-ture."
            />
          </p>
          <p className="sources">
            <OutboundLink href="https://meetings.wellington.govt.nz">Mātai Manapori</OutboundLink>
            <OutboundLink href="https://wellington.govt.nz">wellington.govt.nz</OutboundLink>
            <LangLink href="/about">
              <T en="Te Tiriti and methodology" mi="Te Tiriti me te tikanga" />
            </LangLink>
            <LangLink href="/plugins">
              <T en="Plug-ins" mi="" />
            </LangLink>
            <Link href="/api/v1">API</Link>
          </p>
        </div>
      </footer>
    </>
  );
}
