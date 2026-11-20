import { LangLink, T } from "@/lib/i18n";

export default function LangNotFound() {
  return (
    <article>
      <h1 className="lede">
        <T en="That page is not in this record." mi="Kāore tēnei whārangi i te rēkoata." />
      </h1>
      <p style={{ marginTop: "1rem" }}>
        <LangLink href="/">
          <T en="Back to decisions" mi="Hoki ki ngā whakataunga" />
        </LangLink>
      </p>
    </article>
  );
}
