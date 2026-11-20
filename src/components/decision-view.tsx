"use client";

import Link from "next/link";
import { useState } from "react";
import { issues } from "@/data/issues";
import { matchMember } from "@/data/members";
import { T, useLang } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import type { PlainLayers, StoredAmendment, StoredClause, StoredDecision, Tally, VoteBlock } from "@/lib/types";

function Names({ names }: { names: string[] }) {
  if (names.length === 0) return <T en="None named" mi="Kāore he ingoa" />;
  return (
    <>
      {names.map((name, index) => {
        const member = matchMember(name);
        return (
          <span key={`${name}-${index}`}>
            {index > 0 ? ", " : null}
            {member ? <Link href={`/councillors/${member.slug}`}>{name}</Link> : name}
          </span>
        );
      })}
    </>
  );
}

function VoteTable({ votes, result }: { votes: VoteBlock; result: string }) {
  const unnamed = !votes.namesRecorded;
  return (
    <table className="vote">
      <caption className="meta" style={{ captionSide: "top", textAlign: "left", paddingBottom: "0.35rem" }}>
        <T en={`Recorded result: ${result}`} mi={`Hua kua tuhia: ${result}`} />
      </caption>
      <tbody>
        <tr>
          <th scope="row">
            <T en="For" mi="Āe" />
          </th>
          <td>{unnamed ? <T en="Not named in Mātai Manapori" mi="Kāore i whakaingoatia i Mātai Manapori" /> : <Names names={votes.for} />}</td>
        </tr>
        <tr>
          <th scope="row">
            <T en="Against" mi="Whakahē" />
          </th>
          <td>{unnamed ? <T en="Not named in Mātai Manapori" mi="Kāore i whakaingoatia i Mātai Manapori" /> : <Names names={votes.against} />}</td>
        </tr>
        <tr>
          <th scope="row">
            <T en="Not voting" mi="Kāore i pōti" />
          </th>
          <td>
            {unnamed ? (
              <T en="Not named in Mātai Manapori" mi="Kāore i whakaingoatia i Mātai Manapori" />
            ) : (
              <Names names={votes.notVoting} />
            )}
          </td>
        </tr>
        <tr>
          <th scope="row">
            <T en="Abstain" mi="Waiho" />
          </th>
          <td>
            <T
              en="Not a separate field. Mātai Manapori’s ‘not voting’ list is shown above and is not relabelled as an abstention."
              mi="Ehara i te āpure motuhake. Ko te rārangi ‘kāore i pōti’ a Mātai Manapori kei runga, kāore e whakaingoatia anō hei waiho."
            />
          </td>
        </tr>
        <tr>
          <th scope="row">
            <T en="Absent" mi="Tāwāhi" />
          </th>
          <td>
            <T
              en="Not a separate field in this record. An absent member is not inferred from a missing name."
              mi="Ehara i te āpure motuhake i tēnei rēkoata. Kāore e whakapaehia he mema tāwāhi nā te ngaro o tētahi ingoa."
            />
          </td>
        </tr>
        <tr>
          <th scope="row">
            <T en="Conflict of interest" mi="Pānga whaiaro" />
          </th>
          <td>
            <T
              en="None recorded in this Mātai Manapori payload. Declarations, when made, sit in the minutes."
              mi="Kāore i tuhia ki tēnei raraunga Mātai Manapori. Ka noho ngā whakapuakanga, mēnā i tukuna, ki ngā meneti."
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function ClauseBlock({ clause }: { clause: StoredClause }) {
  return (
    <article className="clause">
      <h3>
        <T en={`Clause ${clause.number}`} mi={`Wāhanga ${clause.number}`} />
        {clause.result ? ` · ${clause.result}` : ""}
      </h3>
      <p>{clause.text.trim() ? clause.text : <T en="Clause text was blank in the Mātai Manapori record." mi="I wātea te kupu o te wāhanga i te rēkoata Mātai Manapori." />}</p>
      {(clause.movedBy || clause.secondedBy) && (
        <p className="meta">
          {clause.movedBy ? (
            <>
              <T en="Moved" mi="Nāna i mōtini" />: {clause.movedBy}.{" "}
            </>
          ) : null}
          {clause.secondedBy ? (
            <>
              <T en="Seconded" mi="Nāna i tautoko" />: {clause.secondedBy}.
            </>
          ) : null}
        </p>
      )}
      <p className="meta">
        <T en="Approved implementation status" mi="Tūnga whakatinana kua whakaaetia" />:{" "}
        {clause.actionStatus ? (
          clause.actionStatus
        ) : (
          <T en="not recorded" mi="kāore i tuhia" />
        )}
        {clause.actionUpdated ? ` · ${clause.actionUpdated}` : ""}
        {clause.clauseId ? ` · clause ${clause.clauseId}` : ""}
        {clause.actionSource ? (
          <>
            {" · "}
            <a href={clause.actionSource}>{clause.actionSource.replace("https://meetings.wellington.govt.nz", "Mātai Manapori")}</a>
          </>
        ) : null}
      </p>
      {clause.actionComment ? <p>{clause.actionComment}</p> : null}
      <VoteTable votes={clause.votes} result={clause.result} />
    </article>
  );
}

function AmendmentBlock({ amendment }: { amendment: StoredAmendment }) {
  return (
    <article className="clause">
      <h3>
        <T en={`Amendment ${amendment.number}`} mi={`Menemana ${amendment.number}`} /> · {amendment.result}
      </h3>
      <p>
        {amendment.text.trim() ? (
          amendment.text
        ) : (
          <T en="Amendment text was blank in the Mātai Manapori record." mi="I wātea te kupu o te menemana i te rēkoata Mātai Manapori." />
        )}
      </p>
      <VoteTable votes={amendment.votes} result={amendment.result} />
    </article>
  );
}

export function DecisionView({
  decision,
  plain,
  tally,
}: {
  decision: StoredDecision;
  plain: PlainLayers;
  tally: Tally;
}) {
  const { lang } = useLang();
  const [copied, setCopied] = useState(false);
  const related = issues.filter((issue) => decision.issueIds.includes(issue.slug));
  const dateLang = lang === "mi" ? "mi" : "en";

  async function copyLink() {
    const url = new URL(window.location.href);
    url.searchParams.set("reo", lang);
    await navigator.clipboard.writeText(url.toString());
    setCopied(true);
  }

  return (
    <article>
      <p className="eyebrow">
        {decision.committeeMi} · {decision.committeeEn}
      </p>
      <h1 className="lede">{decision.title}</h1>
      <p className="kicker" style={{ marginTop: "0.8rem" }}>
        <span>{formatDate(decision.date, dateLang)}</span>
        <span>{decision.result}</span>
        <span>
          {tally.kind === "unnamed" ? (
            <T en="Names pending in the source" mi="Kei te tatari ngā ingoa i te puna" />
          ) : tally.kind === "mixed" ? (
            <T en="Tallies differ by clause" mi="He rerekē ngā tatau i ia wāhanga" />
          ) : (
            <T en={`For ${tally.for}, against ${tally.against}`} mi={`Āe ${tally.for}, whakahē ${tally.against}`} />
          )}
        </span>
      </p>
      <p className="meta" style={{ marginTop: "0.7rem" }}>
        <T
          en="The four readings below are plain language tied to the published clauses. They are not the statutory record."
          mi="He reo māhorahora ngā whakamārama e whā i raro nei, e herea ana ki ngā wāhanga kua whakaputaina. Ehara i te pūkete ā-ture."
        />
      </p>
      {plain.recommendation.mi.trim().length === 0 ? (
        <p className="meta">
          <T
            en="No Māori summary has been written for this report. The English text is the published source."
            mi="Kāore anō kia tuhia he whakarāpopoto reo Māori. Ko te kupu Ingarihi te puna."
          />
        </p>
      ) : null}

      <dl className="layers" style={{ marginTop: "1.2rem" }}>
        {(
          [
            ["recommendation", "Officer recommendation", "Tūtohutanga a ngā āpiha"],
            ["amendments", "Amendments", "Ngā menemana"],
            ["decision", "Final decision", "Te whakataunga whakamutunga"],
            ["impact", "Budget and impact", "Te pūtea me te pānga"],
          ] as const
        ).map(([key, en, mi]) => (
          <div className="layer" key={key}>
            <dt>
              <T en={en} mi={mi} />
            </dt>
            <dd>
              <T en={plain[key].en} mi={plain[key].mi} />
            </dd>
          </div>
        ))}
      </dl>

      <div className="sources" style={{ marginTop: "1rem" }}>
        <a href={decision.mataiUrl}>Mātai Manapori</a>
        {decision.minutesUrl ? <a href={decision.minutesUrl}><T en="Minutes" mi="Meneti" /></a> : null}
        {decision.agendaUrl ? <a href={decision.agendaUrl}><T en="Agenda" mi="Rārangi take" /></a> : null}
        {decision.reportUrl ? <a href={decision.reportUrl}><T en="Report" mi="Pūrongo" /></a> : null}
        {decision.videoUrl ? <a href={decision.videoUrl}><T en="Meeting video" mi="Ataata hui" /></a> : null}
        {decision.additionalDocuments.map((doc) => (
          <a key={doc.url} href={doc.url}>
            {doc.name}
          </a>
        ))}
        <button type="button" className="chip" onClick={copyLink}>
          {copied ? <T en="Link copied" mi="Kua tārua te hono" /> : <T en="Copy share link" mi="Tārua te hono" />}
        </button>
      </div>

      {(decision.relatedReports.length > 0 || decision.reciprocalReports.length > 0) && (
        <p className="meta">
          <T en="Named in the export as related or reciprocal" mi="Kua whakaingoatia i te kaweake hei pānga, hei utu rānei" />:{" "}
          {[...decision.relatedReports, ...decision.reciprocalReports].join(" · ")}
        </p>
      )}

      {related.length > 0 && (
        <p style={{ marginTop: "1rem" }}>
          <T en="Issue thread" mi="Te aho kaupapa" />:{" "}
          {related.map((issue, index) => (
            <span key={issue.slug}>
              {index > 0 ? " · " : null}
              <Link href={`/issues/${issue.slug}`}>
                <T en={issue.en} mi={issue.mi} />
              </Link>
            </span>
          ))}
        </p>
      )}

      <section className="note" aria-labelledby="statutory">
        <h2 id="statutory">
          <T en="What the record is allowed to say" mi="He aha ka āhei te rēkoata te kī" />
        </h2>
        <p>
          <T
            en="Standing Order 27.6(d) says that at a meeting of the Council, all voting is by division. Standing Order 27.7 says the names voting for and against are entered in the minutes. A member can also require their own vote to be recorded. Wellington City Council’s LGOIMA response IRC-8897 (August 2025) describes the same practice under Standing Orders 27.6 and 27.27: full Council records every division, and a committee records a division when a member asks for one."
            mi="E ai ki te Tūtohu Tū 27.6(d), i te hui o te Kaunihera, he wehenga ngā pōti katoa. E ai ki te Tūtohu Tū 27.7, ka tuhia ki ngā meneti ngā ingoa i pōti āe, i pōti whakahē rānei. Ka taea hoki e tētahi mema te tono kia tuhia tana ake pōti. E ai ki te whakautu LGOIMA a te Kaunihera, IRC-8897 (Ākuhata 2025), ko taua tikanga tonu i raro i ngā Tūtohu Tū 27.6 me 27.27: ka tuhia e te Kaunihera katoa ngā wehenga katoa, ā, ka tuhia e te komiti tētahi wehenga ina tono tētahi mema."
          />
        </p>
        <p>
          <T
            en="Under the Local Government Act 2002, Schedule 7, clause 28, minutes that have been entered and authenticated are prima facie evidence of the proceedings. Mātai Manapori is a transparency tool. Where it does not name a vote, Beehive leaves the names blank."
            mi="I raro i te Local Government Act 2002, Te Āpitihanga 7, te wāhanga 28, ko ngā meneti kua whakaurua, kua whakamanaia, he taunakitanga tuatahi o ngā whakahaere. He taputapu pūataata a Mātai Manapori. Ki te kore ia e whakaingoa i tētahi pōti, ka waiho wātea ngā ingoa e Beehive."
          />
        </p>
      </section>

      <section>
        <h2>
          <T en="Clause by clause" mi="Wāhanga i te wāhanga" />
        </h2>
        {decision.finalClauses.map((clause) => (
          <ClauseBlock key={clause.id} clause={clause} />
        ))}
      </section>

      {decision.amendments.length > 0 && (
        <section>
          <h2>
            <T en="Amendments" mi="Ngā menemana" />
          </h2>
          {decision.amendments.map((amendment) => (
            <AmendmentBlock key={`${amendment.id}-${amendment.number}`} amendment={amendment} />
          ))}
        </section>
      )}

      <section>
        <h2>
          <T en="Officer clauses" mi="Ngā wāhanga a ngā āpiha" />
        </h2>
        <p className="meta">
          <T
            en="Officer wording as stored on the recommendation row. The vote on what passed is in the clause record above."
            mi="Ko te kupu a ngā āpiha i te rārangi tūtohutanga. Kei runga ake te pōti mō te mea i pahure."
          />
        </p>
        {decision.recommendations.map((clause) => (
          <p key={`rec-${clause.id}`}>
            <strong>{clause.number}</strong>{" "}
            {clause.text.trim() ? (
              clause.text
            ) : (
              <T en="Clause text was blank in the committee export." mi="I wātea te kupu i te kaweake komiti." />
            )}
          </p>
        ))}
      </section>
    </article>
  );
}
