"use client";

import Link from "next/link";
import { T, useLang } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import type { DecisionCard, Issue } from "@/lib/types";

export function IssueIndex({
  issues,
  counts,
}: {
  issues: Issue[];
  counts: Record<string, { total: number; inProgress: number }>;
}) {
  return (
    <>
      <p className="eyebrow">
        <T en="Across meetings" mi="Puta noa i ngā hui" />
      </p>
      <h1 className="lede">
        <T en="The same argument, followed from one meeting to the next." mi="Te kōrero kotahi, e whāia ana i tētahi hui ki tētahi." />
      </h1>
      <div className="feed" style={{ marginTop: "1.4rem" }}>
        {issues.map((issue) => (
          <Link key={issue.slug} href={`/issues/${issue.slug}`} className="card">
            <p className="kicker">
              <span>
                {counts[issue.slug]?.total ?? 0} <T en="decisions" mi="ngā whakataunga" />
              </span>
              <span>
                {counts[issue.slug]?.inProgress ?? 0} <T en="still in progress" mi="kei te haere tonu" />
              </span>
            </p>
            <h2>
              <T en={issue.en} mi={issue.mi} />
            </h2>
            <p>
              <T en={issue.summaryEn} mi={issue.summaryMi} />
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}

export function IssueThread({ issue, items }: { issue: Issue; items: DecisionCard[] }) {
  const { lang } = useLang();
  const dateLang = lang === "mi" ? "mi" : "en";
  const inProgress = items.filter((item) => item.implementation === "in-progress").length;

  return (
    <article>
      <p className="eyebrow">
        <T en="Issue thread" mi="Te aho kaupapa" />
      </p>
      <h1 className="lede">
        <T en={issue.en} mi={issue.mi} />
      </h1>
      <p style={{ marginTop: "0.8rem", maxWidth: "42rem" }}>
        <T en={issue.summaryEn} mi={issue.summaryMi} />
      </p>
      <p className="meta">
        <T
          en={`${items.length} decisions in this published set. ${inProgress} still marked in progress by Mātai Manapori.`}
          mi={`${items.length} ngā whakataunga i tēnei huinga. ${inProgress} e kīia tonu ana kei te haere e Mātai Manapori.`}
        />
      </p>
      {items.length === 0 ? (
        <p>
          <T
            en="No published decision in the current sync is tagged to this thread."
            mi="Kāore he whakataunga kua whakaputaina i te tukutahi o nāianei e herea ana ki tēnei aho."
          />
        </p>
      ) : (
        <div className="timeline" style={{ marginTop: "1.2rem" }}>
        {items.map((item) => (
          <Link key={item.slug} href={`/decisions/${item.slug}`}>
            <span className="meta">
              {formatDate(item.date, dateLang)} · {item.committeeMi}
            </span>
            <br />
            <strong>{item.title}</strong>
            <br />
            <span>
              <T en={item.plain.decision.en} mi={item.plain.decision.mi} />
            </span>
          </Link>
        ))}
      </div>
      )}
    </article>
  );
}
