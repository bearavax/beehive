"use client";

import { committees } from "@/data/committees";
import { FeedLink } from "@/components/outbound";
import { LangLink, T, useLang } from "@/lib/i18n";
import { formatDate, formatSyncTime } from "@/lib/format";
import { minutesPhrases, voteState } from "@/lib/minutes/copy";
import type { MemberMeeting, MinuteVoteState } from "@/lib/minutes/record";

function phrase(en: string) {
  return minutesPhrases.find((item) => item.en === en) ?? { en, mi: "", review: true };
}

function minutesHref(url: string, page: number | null) {
  if (!page) return url;
  const [base, hash = ""] = url.split("#");
  if (/(^|&)page=/.test(hash)) return url;
  return `${base}#page=${page}`;
}

function State({ state }: { state: MinuteVoteState }) {
  const copy = voteState[state];
  return <T en={copy.en} mi={copy.mi} />;
}

export function MinutesRecord({ meetings }: { meetings: MemberMeeting[] }) {
  const { lang } = useLang();
  const dateLang = lang === "mi" ? "mi" : "en";
  const legend = phrase(
    "For, against, abstained, absent, and not voting are copied only when the minutes use that list. Not recorded means this person was not named. Not read means the block could not be checked. No division recorded means the text had no standing-order division. Nothing is filled in from a missing name.",
  );
  const outsideTerm = phrase("A meeting outside the dates this person held office is left off the page. It is not a vote.");
  const closedCopied = phrase("The closed session in these minutes was not copied.");
  const closedNone = phrase("No closed-session text was in the extract.");
  const clauseMissing = phrase("Clause heading not in the block");
  const resultMissing = phrase("Result not in the block");
  const title = phrase("Votes in the official minutes");
  const sync = phrase("Sync time");

  return (
    <section style={{ marginTop: "1.6rem" }}>
      <h2>
        <T en={title.en} mi={title.mi} />
      </h2>
      <p style={{ maxWidth: "44rem" }}>
        <T en={legend.en} mi={legend.mi} /> <T en={outsideTerm.en} mi={outsideTerm.mi} />{" "}
        <LangLink href="/how-this-works">
          <T en="How this works" mi="Pēhea tēnei mahi" />
        </LangLink>
      </p>
      {meetings.map((meeting) => {
        const body = committees.find((committee) => committee.id === meeting.bodyId);
        const rows = meeting.divisions.filter((row) => row.state !== "not-in-office");
        if (rows.length === 0) return null;
        return (
          <section key={`${meeting.date}-${meeting.bodyId}`} style={{ marginTop: "1.4rem" }}>
            <h3>
              {formatDate(meeting.date, dateLang)}
              {" · "}
              {body ? (
                <>
                  {body.mi} · {body.en}
                </>
              ) : (
                meeting.bodyId
              )}
            </h3>
            <p className="meta">
              {meeting.closedSessionOmitted ? (
                <T en={closedCopied.en} mi={closedCopied.mi} />
              ) : (
                <T en={closedNone.en} mi={closedNone.mi} />
              )}
            </p>
            <div className="minutes-scroll">
              <table className="vote">
                <thead>
                  <tr>
                    <th scope="col">
                      <T en="Date" mi="Rā" />
                    </th>
                    <th scope="col">
                      <T en="Clause" mi={phrase("Clause").mi} />
                    </th>
                    <th scope="col">
                      <T en="Result" mi={phrase("Result").mi} />
                    </th>
                    <th scope="col">
                      <T en="Vote" mi={phrase("Vote").mi} />
                    </th>
                    <th scope="col">
                      <T en={phrase("Words in the minutes").en} mi={phrase("Words in the minutes").mi} />
                    </th>
                    <th scope="col">
                      <T en="Minutes" mi="Meneti" />
                    </th>
                    <th scope="col">
                      <T en={sync.en} mi={sync.mi} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${meeting.minutesUrl}-${index}`}>
                      <td>{formatDate(meeting.date, dateLang)}</td>
                      <td>
                        {row.clauseLabel ? (
                          row.clauseLabel
                        ) : row.item ? (
                          <T en={`Item ${row.item}`} mi="" />
                        ) : (
                          <T en={clauseMissing.en} mi={clauseMissing.mi} />
                        )}
                      </td>
                      <td>
                        {row.state === "not-read" || row.state === "no-division" ? (
                          <State state={row.state} />
                        ) : row.result ? (
                          row.result
                        ) : (
                          <T en={resultMissing.en} mi={resultMissing.mi} />
                        )}
                      </td>
                      <td>
                        <State state={row.state} />
                      </td>
                      <td>{row.recordedAs ?? "—"}</td>
                      <td>
                        <FeedLink href={meeting.minutesUrl ? minutesHref(meeting.minutesUrl, row.page) : null}>
                          <T en={row.page ? `Minutes, page ${row.page}` : "Minutes"} mi="Meneti" />
                        </FeedLink>
                      </td>
                      <td>
                        <time dateTime={meeting.syncedAt}>{formatSyncTime(meeting.syncedAt)}</time>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </section>
  );
}
