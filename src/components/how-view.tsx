"use client";

import { OutboundLink } from "@/components/outbound";
import { T } from "@/lib/i18n";
import { draftsForReview, howIntro, howParagraphs } from "@/lib/minutes/copy";

export function HowView({
  syncedAt,
  files,
  unreadableFiles,
  closedSessions,
  read,
  unread,
}: {
  syncedAt: string;
  files: number;
  unreadableFiles: number;
  closedSessions: number;
  read: number;
  unread: number;
}) {
  const counts = {
    en: `This copy read ${files} minutes files at ${syncedAt}. ${read} division blocks were read. ${unread} division blocks were not read. ${unreadableFiles} files could not be read as text. ${closedSessions} files had a closed session, and that text was not copied.`,
    mi: `I pānui tēnei kape i ngā kōnae meneti ${files} i te ${syncedAt}. ${read} ngā poraka wehenga i pānuitia. ${unread} ngā poraka kāore i pānuitia. ${unreadableFiles} ngā kōnae kāore i taea te pānui hei kupu. ${closedSessions} ngā kōnae he wāhanga kati, ā, kāore i tāruatia taua kupu.`,
    review: true,
  };
  const drafts = [...draftsForReview(), counts];
  return (
    <article className="prose">
      <p className="eyebrow">
        <T en={howIntro[6].en} mi={howIntro[6].mi} />
      </p>
      <h1 className="lede">
        <T en="How this works" mi="Pēhea tēnei mahi" />
      </h1>
      <p>
        <T en={howIntro[0].en} mi={howIntro[0].mi} />
      </p>
      <p>
        <T en={counts.en} mi={counts.mi} />
      </p>
      {howParagraphs.map((part) => (
        <section key={part.heading}>
          <h2>
            <T en={part.heading ?? ""} mi={part.headingMi} />
          </h2>
          <p>
            <T en={part.body.en} mi={part.body.mi} />
          </p>
        </section>
      ))}
      <p>
        <OutboundLink href="https://github.com/bearavax/beehive/issues/new">
          <T en={howIntro[1].en} mi={howIntro[1].mi} />
        </OutboundLink>
        {" · "}
        <OutboundLink href="https://wellington.govt.nz/contact-us">
          <T en={howIntro[2].en} mi={howIntro[2].mi} />
        </OutboundLink>
      </p>
      <section>
        <h2>
          <T en={howIntro[3].en} mi={howIntro[3].mi} />
        </h2>
        <p>
          <T en={howIntro[4].en} mi={howIntro[4].mi} />
        </p>
        <ul>
          {drafts.map((phrase, index) => (
            <li key={`${index}-${phrase.en.slice(0, 48)}`}>
              {phrase.mi ? <span lang="mi">{phrase.mi}</span> : <T en={howIntro[5].en} mi={howIntro[5].mi} />}
              {" — "}
              <span lang="en">{phrase.en}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
