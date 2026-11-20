"use client";

import { MinutesRecord } from "@/components/minutes-record";
import { FeedLink } from "@/components/outbound";
import { LangLink } from "@/lib/i18n";
import { committees } from "@/data/committees";
import { members, wards } from "@/data/members";
import { T, useLang } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import type { MemberMeeting } from "@/lib/minutes/record";
import type { Member } from "@/lib/types";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

function roleLabel(member: Member) {
  if (member.role === "mayor") return { en: "Mayor", mi: "Koromatua" };
  if (member.role === "deputy-mayor") return { en: "Deputy Mayor", mi: "Koromatua Tuarua" };
  if (member.role === "pouiwi") return { en: "Pouiwi", mi: "Pouiwi" };
  if (member.role === "former-councillor") return { en: "Former councillor", mi: "Kaikaunihera o mua" };
  return { en: "Councillor", mi: "Kaikaunihera" };
}

export function PersonCard({ member }: { member: Member }) {
  const role = roleLabel(member);
  return (
    <LangLink href={`/councillors/${member.slug}`} className="person">
      <div className="monogram" aria-hidden="true">
        {initials(member.name)}
      </div>
      <h3>{member.name}</h3>
      <p className="meta">
        <T en={role.en} mi={role.mi} />
      </p>
      <p>
        <T en={member.wardEn} mi={member.wardMi} />
      </p>
    </LangLink>
  );
}

export function Directory() {
  const pouiwi = members.filter((member) => member.role === "pouiwi");
  const mayor = members.find((member) => member.role === "mayor");

  return (
    <>
      <p className="eyebrow">2025–2028</p>
      <h1 className="lede">
        <T en="The people who sit with the decision." mi="Te hunga e noho ana ki te whakataunga." />
      </h1>
      <p style={{ marginTop: "0.8rem", maxWidth: "44rem" }}>
        <T
          en="Fifteen ward councillors, the Mayor, and two Tākai Here Pouiwi. Pouiwi are full voting members of the committees they are appointed to. At full Council they may attend and speak, and they do not vote. Tony Randle, who died in August 2026, stays on this page so earlier divisions still name him."
          mi="Tekau mā rima ngā kaikaunihera takiwā, te Koromatua, me ngā Pouiwi tokorua o Tākai Here. He mema pōti tūturu ngā Pouiwi o ngā komiti kua kopoua rātou. I te Kaunihera katoa ka taea e rātou te tae atu, te kōrero, kāore e pōti. Ka noho a Tony Randle, i mate i te Ākuhata 2026, ki tēnei whārangi kia mau tonu tōna ingoa ki ngā wehenga o mua."
        />
      </p>

      <section className="directory" style={{ marginTop: "1.8rem" }}>
        <div>
          <h2>
            <T en="Mayor" mi="Koromatua" />
          </h2>
          <div className="people">{mayor ? <PersonCard member={mayor} /> : null}</div>
        </div>
        <div>
          <h2>
            <T en="Tākai Here Pouiwi" mi="Ngā Pouiwi o Tākai Here" />
          </h2>
          <p className="meta">
            <T
              en="Partners: Taranaki Whānui ki Te Upoko o Te Ika, Te Rūnanganui o Te Āti Awa, and Te Rūnanga o Toa Rangatira. Two Pouiwi are appointed."
              mi="Ngā hoa: Taranaki Whānui ki Te Upoko o Te Ika, Te Rūnanganui o Te Āti Awa, me Te Rūnanga o Toa Rangatira. Tokorua ngā Pouiwi kua kopoua."
            />
          </p>
          <div className="people">
            {pouiwi.map((member) => (
              <PersonCard key={member.slug} member={member} />
            ))}
          </div>
        </div>
        {wards.map((ward) => (
          <div key={ward.id}>
            <h2>
              <T en={ward.en} mi={ward.mi} />
            </h2>
            <div className="people">
              {ward.slugs.map((slug) => {
                const member = members.find((item) => item.slug === slug);
                return member ? <PersonCard key={slug} member={member} /> : null;
              })}
            </div>
          </div>
        ))}
      </section>

      <section style={{ marginTop: "2.2rem" }}>
        <h2>
          <T en="Committees in this triennium" mi="Ngā komiti o tēnei tau toru" />
        </h2>
        <div className="feed" style={{ marginTop: "0.8rem" }}>
          {committees.map((committee) => (
            <article key={committee.id} className="card" style={{ cursor: "default" }}>
              <h3>
                {committee.mi} · {committee.en}
              </h3>
              <p className="meta">
                <T en="Chair" mi="Heamana" />: {committee.chairEn}. <T en="Deputy" mi="Tuarua" />: {committee.deputyEn}.
              </p>
              <p>
                <T en={committee.focusEn} mi={committee.focusMi} />
              </p>
              <p className="meta">
                <T en={committee.noteEn} mi={committee.noteMi} />
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

export function Profile({ member, meetings }: { member: Member; meetings: MemberMeeting[] }) {
  const { lang } = useLang();
  const role = roleLabel(member);
  const dateLang = lang === "mi" ? "mi" : "en";
  const seats = committees.filter((committee) => member.committeeIds.includes(committee.id));

  return (
    <article>
      <p className="eyebrow">
        <T en={role.en} mi={role.mi} />
      </p>
      <h1 className="lede">{member.name}</h1>
      <p style={{ marginTop: "0.7rem" }}>
        <T en={member.wardEn} mi={member.wardMi} />
        {" · "}
        <T en={member.affiliationEn} mi={member.affiliationMi} />
      </p>
      <p style={{ maxWidth: "42rem", marginTop: "0.8rem" }}>
        <T en={member.mandateEn} mi={member.mandateMi} />
      </p>
      <p className="meta">
        <T en="From" mi="Mai i" /> {formatDate(member.since, dateLang)}
        {member.until ? (
          <>
            {" "}
            <T en="until" mi="tae atu ki" /> {formatDate(member.until, dateLang)}
          </>
        ) : null}
        . <FeedLink href={member.profileUrl}><T en="Public source" mi="Puna tūmatanui" /></FeedLink>
      </p>

      <section style={{ marginTop: "1.6rem" }}>
        <h2>
          <T en="Committees" mi="Ngā komiti" />
        </h2>
        <ul className="stack">
          {seats.map((committee) => (
            <li key={committee.id}>
              <strong>
                {committee.mi} · {committee.en}
              </strong>
              {member.chairOf.includes(committee.id) ? (
                <>
                  {" "}
                  — <T en="Chair" mi="Heamana" />
                </>
              ) : null}
              {member.deputyOf.includes(committee.id) ? (
                <>
                  {" "}
                  — <T en="Deputy chair" mi="Heamana tuarua" />
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <MinutesRecord meetings={meetings} />
    </article>
  );
}
