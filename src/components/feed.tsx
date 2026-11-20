"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { issues } from "@/data/issues";
import { T, useLang } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import type { DecisionCard } from "@/lib/types";

const bodies = [
  { id: "te-kaunihera", en: "Te Kaunihera o Pōneke", mi: "Te Kaunihera o Pōneke" },
  { id: "te-taurapa", en: "Te Taurapa", mi: "Te Taurapa" },
  { id: "te-hoe-matua", en: "Te Hoe Matua", mi: "Te Hoe Matua" },
  { id: "te-rauawa", en: "Te Rauawa", mi: "Te Rauawa" },
];

export function Feed({ items, syncedAt }: { items: DecisionCard[]; syncedAt: string }) {
  const { lang } = useLang();
  const [query, setQuery] = useState("");
  const [body, setBody] = useState("all");
  const [issue, setIssue] = useState("all");
  const [status, setStatus] = useState("all");
  const [progress, setProgress] = useState("all");
  const [year, setYear] = useState("all");
  const years = [...new Set(items.map((item) => item.date.slice(0, 4)))].sort();

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (body !== "all" && item.bodyId !== body) return false;
      if (issue !== "all" && !item.issueIds.includes(issue)) return false;
      if (status !== "all" && item.result !== status) return false;
      if (progress !== "all" && item.implementation !== progress) return false;
      if (year !== "all" && !item.date.startsWith(year)) return false;
      if (q && !item.searchText.includes(q)) return false;
      return true;
    });
  }, [items, query, body, issue, status, progress, year]);

  const dateLang = lang === "mi" ? "mi" : "en";

  return (
    <>
      <p className="eyebrow">2025–2028</p>
      <h1 className="lede">
        <T en="What the Council decided, in ordinary language." mi="Ngā whakataunga a te Kaunihera, i te reo māhorahora." />
      </h1>
      <p className="meta" style={{ marginTop: "0.8rem" }}>
        <T
          en={`${items.length} published reports in this set, synced from Mātai Manapori on ${formatDate(syncedAt.slice(0, 10), "en")}. Where a division was not named, the tally says so.`}
          mi={`${items.length} ngā pūrongo kua whakaputaina i tēnei huinga, i tiki mai i Mātai Manapori i te ${formatDate(syncedAt.slice(0, 10), "mi")}. Mēnā kāore i whakaingoatia te wehenga, ka kī pērā te tatau.`}
        />
      </p>

      <div className="filters">
        <label className="sr-only" htmlFor="decision-search" style={{ position: "absolute", left: "-999px" }}>
          <T en="Search decisions" mi="Rapu whakataunga" />
        </label>
        <input
          id="decision-search"
          className="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={lang === "mi" ? "Rapu i te take, i te komiti, i te kupu…" : "Search a topic, committee, or word…"}
          type="search"
        />
        <div className="filter-row">
          <span className="filter-label">
            <T en="Body" mi="Rōpū" />
          </span>
          <button type="button" className="chip" aria-pressed={body === "all"} onClick={() => setBody("all")}>
            <T en="All" mi="Katoa" />
          </button>
          {bodies.map((item) => (
            <button key={item.id} type="button" className="chip" aria-pressed={body === item.id} onClick={() => setBody(item.id)}>
              {item.mi}
            </button>
          ))}
        </div>
        <div className="filter-row">
          <span className="filter-label">
            <T en="Issue" mi="Kaupapa" />
          </span>
          <button type="button" className="chip" aria-pressed={issue === "all"} onClick={() => setIssue("all")}>
            <T en="All" mi="Katoa" />
          </button>
          {issues.map((item) => (
            <button key={item.slug} type="button" className="chip" aria-pressed={issue === item.slug} onClick={() => setIssue(item.slug)}>
              <T en={item.en} mi={item.mi} />
            </button>
          ))}
        </div>
        <div className="filter-row">
          <span className="filter-label">
            <T en="Year" mi="Tau" />
          </span>
          <button type="button" className="chip" aria-pressed={year === "all"} onClick={() => setYear("all")}>
            <T en="All" mi="Katoa" />
          </button>
          {years.map((item) => (
            <button key={item} type="button" className="chip" aria-pressed={year === item} onClick={() => setYear(item)}>
              {item}
            </button>
          ))}
        </div>
        <div className="filter-row">
          <span className="filter-label">
            <T en="Result" mi="Hua" />
          </span>
          {[
            ["all", "All", "Katoa"],
            ["Carried", "Carried", "I whakaaetia"],
            ["Lost", "Lost", "I hinga"],
            ["Mixed", "Mixed", "Whakaranu"],
          ].map(([id, en, mi]) => (
            <button key={id} type="button" className="chip" aria-pressed={status === id} onClick={() => setStatus(id)}>
              <T en={en} mi={mi} />
            </button>
          ))}
        </div>
        <div className="filter-row">
          <span className="filter-label">
            <T en="Progress" mi="Kokenga" />
          </span>
          {[
            ["all", "All", "Katoa"],
            ["in-progress", "In progress", "Kei te haere"],
            ["completed", "Completed", "Kua oti"],
            ["not-stated", "Not stated", "Kāore i kīia"],
          ].map(([id, en, mi]) => (
            <button key={id} type="button" className="chip" aria-pressed={progress === id} onClick={() => setProgress(id)}>
              <T en={en} mi={mi} />
            </button>
          ))}
        </div>
      </div>

      <p className="meta">
        <T en={`${shown.length} shown`} mi={`${shown.length} e whakaaturia ana`} />
      </p>
      <div className="feed">
        {shown.length === 0 ? (
          <p>
            <T en="Nothing in this published set matches those filters." mi="Kāore he mea i tēnei huinga e hāngai ana ki aua tātari." />
          </p>
        ) : (
          shown.map((item) => (
            <Link key={item.slug} href={`/decisions/${item.slug}`} className="card">
              <div className="kicker">
                <span>
                  {item.committeeMi} · {item.committeeEn}
                </span>
                <span>{formatDate(item.date, dateLang)}</span>
                <span>{item.result}</span>
              </div>
              <h2>{item.title}</h2>
              {!item.authored ? (
                <p className="meta">
                  <T
                    en="No Māori summary has been written for this report. The English text is the published source."
                    mi="Kāore anō kia tuhia he whakarāpopoto reo Māori. Ko te kupu Ingarihi te puna."
                  />
                </p>
              ) : null}
              <dl className="layers">
                <div className="layer">
                  <dt>
                    <T en="Officer recommendation" mi="Tūtohutanga a ngā āpiha" />
                  </dt>
                  <dd>
                    <T en={item.plain.recommendation.en} mi={item.plain.recommendation.mi} />
                  </dd>
                </div>
                <div className="layer">
                  <dt>
                    <T en="Amendments" mi="Ngā menemana" />
                  </dt>
                  <dd>
                    <T en={item.plain.amendments.en} mi={item.plain.amendments.mi} />
                  </dd>
                </div>
                <div className="layer">
                  <dt>
                    <T en="Final decision" mi="Te whakataunga whakamutunga" />
                  </dt>
                  <dd>
                    <T en={item.plain.decision.en} mi={item.plain.decision.mi} />
                  </dd>
                </div>
                <div className="layer">
                  <dt>
                    <T en="Budget and impact" mi="Te pūtea me te pānga" />
                  </dt>
                  <dd>
                    <T en={item.plain.impact.en} mi={item.plain.impact.mi} />
                  </dd>
                </div>
              </dl>
              <div className="tally">
                {item.tally.kind === "uniform" ? (
                  <>
                    <span className="pill for">
                      <T en={`For ${item.tally.for}`} mi={`Āe ${item.tally.for}`} />
                    </span>
                    <span className="pill against">
                      <T en={`Against ${item.tally.against}`} mi={`Whakahē ${item.tally.against}`} />
                    </span>
                    <span className="pill">
                      <T en={`Not voting ${item.tally.notVoting}`} mi={`Kāore i pōti ${item.tally.notVoting}`} />
                    </span>
                  </>
                ) : item.tally.kind === "mixed" ? (
                  <span className="pill">
                    <T
                      en={`${item.tally.divisions} different named tallies — open the clause record`}
                      mi={`${item.tally.divisions} ngā tatau rerekē — huakina te rēkoata wāhanga`}
                    />
                  </span>
                ) : (
                  <span className="pill">
                    <T en="Division names not published for this item" mi="Kāore ngā ingoa wehenga i whakaputaina mō tēnei take" />
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
