import { committees, torUrl } from "@/data/committees";
import { issues } from "@/data/issues";
import { members } from "@/data/members";
import { plainLanguage } from "@/data/plain-language";
import { decisions, scoreFor, syncedAt } from "@/lib/data";
import type {
  AdapterQuery,
  ApiCommittee,
  ApiDecision,
  ApiDecisionSummary,
  ApiIssue,
  ApiMeeting,
  ApiMember,
  ApiVote,
  Attribution,
  BilingualText,
  Provenance,
} from "@/lib/sdk/adapter";
import type { StoredAmendment, StoredClause, StoredDecision } from "@/lib/types";

const DATA_MODEL: Attribution = {
  dataModel: {
    name: "Mātai Manapori (TrackDem) data model and definitions",
    license: "CC-BY-4.0",
    version: "beta v0.1",
    date: "2025-02",
    publisher: "Wellington City Council",
    url: "https://trackdem.wellington.govt.nz/assets/ed1061ef-fbb9-4162-ba8e-8c395558b39d?download=",
  },
  records: {
    publisher: "Te Kaunihera o Pōneke | Wellington City Council",
    source: "https://meetings.wellington.govt.nz",
    rights: "Public Council records. Beehive does not relicense them.",
  },
};

function text(en: string, mi: string | null | undefined): BilingualText {
  const trimmed = mi?.trim();
  return { en, mi: trimmed ? trimmed : null };
}

function provenance(sourceUrl: string | null, mataiReportId: number | null, when: string | null = syncedAt): Provenance {
  return { sourceUrl, mataiReportId, syncedAt: when, access: "public", attribution: DATA_MODEL };
}

function voteOf(clause: { number: string; result: string; votes: StoredClause["votes"] }): ApiVote {
  return {
    clauseNumber: clause.number,
    result: clause.result || null,
    namesRecorded: clause.votes.namesRecorded,
    for: clause.votes.namesRecorded ? clause.votes.for : [],
    against: clause.votes.namesRecorded ? clause.votes.against : [],
    notVoting: clause.votes.namesRecorded ? clause.votes.notVoting : [],
    abstain: null,
    absent: null,
    conflictOfInterest: null,
  };
}

function summaryOf(decision: StoredDecision): ApiDecisionSummary {
  return {
    id: decision.slug,
    reportId: decision.reportId,
    title: decision.title,
    summary: decision.summary.trim() ? decision.summary : null,
    date: decision.date,
    bodyId: decision.bodyId,
    body: text(decision.committeeEn, decision.committeeMi),
    result: decision.result || null,
    implementation: {
      status: decision.implementation?.status ?? null,
      source: decision.implementation?.source ?? null,
      updatedAt: decision.implementation?.updatedAt ?? null,
    },
    issueIds: decision.issueIds,
    provenance: provenance(decision.mataiUrl || decision.minutesUrl, decision.reportId),
  };
}

function inRange(date: string, query?: AdapterQuery) {
  if (query?.from && date < query.from) return false;
  if (query?.to && date > query.to) return false;
  return true;
}

export function listDecisions(query: AdapterQuery = {}): ApiDecisionSummary[] {
  return decisions
    .filter((decision) => (query.bodyId ? decision.bodyId === query.bodyId : true))
    .filter((decision) => (query.issue ? decision.issueIds.includes(query.issue) : true))
    .filter((decision) => inRange(decision.date, query))
    .map(summaryOf);
}

export function getDecision(id: string): ApiDecision | null {
  const decision = /^\d+$/.test(id)
    ? decisions.find((item) => item.reportId === Number(id))
    : decisions.find((item) => item.slug === id);
  if (!decision) return null;
  const written = plainLanguage[decision.id];
  return {
    ...summaryOf(decision),
    plain: written
      ? {
          authoredBy: "beehive",
          statutoryRecord: false,
          recommendation: text(written.recommendation.en, written.recommendation.mi),
          amendments: text(written.amendments.en, written.amendments.mi),
          decision: text(written.decision.en, written.decision.mi),
          impact: text(written.impact.en, written.impact.mi),
        }
      : null,
    clauses: decision.finalClauses.map((clause: StoredClause) => ({
      number: clause.number,
      origin: clause.origin || null,
      text: clause.text.trim() ? clause.text : null,
      result: clause.result || null,
      movedBy: clause.movedBy,
      secondedBy: clause.secondedBy,
      implementation: {
        status: clause.actionStatus === "In progress" || clause.actionStatus === "Completed" ? clause.actionStatus : null,
        comment: clause.actionComment,
        updatedAt: clause.actionUpdated,
        clauseId: clause.clauseId,
        source: clause.actionSource ?? null,
      },
      votes: voteOf(clause),
    })),
    amendments: decision.amendments.map((clause: StoredAmendment) => ({
      number: clause.number,
      text: clause.text.trim() ? clause.text : null,
      result: clause.result || null,
      votes: voteOf({ number: clause.number, result: clause.result, votes: clause.votes }),
    })),
    documents: {
      agendaUrl: decision.agendaUrl,
      minutesUrl: decision.minutesUrl,
      videoUrl: decision.videoUrl,
      reportUrl: decision.reportUrl,
      additional: decision.additionalDocuments,
    },
  };
}

export function votesFor(id: string): ApiVote[] | null {
  const decision = getDecision(id);
  if (!decision) return null;
  return [...decision.clauses.map((clause) => clause.votes), ...decision.amendments.map((clause) => clause.votes)];
}

function sharedUrl(values: Array<string | null>): string | null {
  const present = [...new Set(values.filter((value): value is string => Boolean(value)))];
  return present.length === 1 ? present[0] : null;
}

export function listMeetings(query: AdapterQuery = {}): ApiMeeting[] {
  const groups = new Map<string, StoredDecision[]>();
  for (const decision of decisions) {
    if (query.bodyId && decision.bodyId !== query.bodyId) continue;
    if (!inRange(decision.date, query)) continue;
    const key = `${decision.bodyId}~${decision.date}`;
    const bag = groups.get(key) ?? [];
    bag.push(decision);
    groups.set(key, bag);
  }
  return [...groups.entries()]
    .map(([id, rows]) => {
      const first = rows[0];
      const minutesUrl = sharedUrl(rows.map((row) => row.minutesUrl));
      return {
        id,
        mataiMeetingId: null,
        date: first.date,
        bodyId: first.bodyId,
        body: text(first.committeeEn, first.committeeMi),
        agendaUrl: sharedUrl(rows.map((row) => row.agendaUrl)),
        minutesUrl,
        videoUrl: sharedUrl(rows.map((row) => row.videoUrl)),
        decisionIds: rows.map((row) => row.slug),
        provenance: provenance(minutesUrl, null),
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id.localeCompare(b.id)));
}

export function getMeeting(id: string): ApiMeeting | null {
  return listMeetings().find((meeting) => meeting.id === id) ?? null;
}

const scores = new Map(members.map((member) => [member.slug, scoreFor(member)]));

export function listMembers(): ApiMember[] {
  return members.map((member) => {
    const score = scores.get(member.slug);
    return {
      id: member.slug,
      name: member.name,
      role: member.role,
      ward: text(member.wardEn, member.wardMi),
      affiliation: text(member.affiliationEn, member.affiliationMi),
      mandate: text(member.mandateEn, member.mandateMi),
      since: member.since || null,
      until: member.until ?? null,
      committees: member.committeeIds,
      record: {
        note: "Counts use only named divisions in the published Mātai Manapori set loaded by Beehive. A missing name is not an absence.",
        namedDivisions: score?.namedDivisions ?? 0,
        withMajority: score?.matchedResult ?? 0,
        againstMajority: score?.opposedResult ?? 0,
        notVoting: score?.notVoting ?? 0,
        decisions: (score?.decisions ?? []).map((item) => ({ id: item.slug, date: item.date, stance: item.stance })),
      },
      provenance: provenance(member.profileUrl, null, null),
    };
  });
}

export function getMember(id: string): ApiMember | null {
  return listMembers().find((member) => member.id === id) ?? null;
}

export function listIssues(): ApiIssue[] {
  return issues.map((issue) => ({
    id: issue.slug,
    name: text(issue.en, issue.mi),
    summary: text(issue.summaryEn, issue.summaryMi),
    editorial: true,
    decisionIds: decisions.filter((decision) => decision.issueIds.includes(issue.slug)).map((decision) => decision.slug),
    provenance: provenance(null, null, null),
  }));
}

export function getIssue(id: string): ApiIssue | null {
  return listIssues().find((issue) => issue.id === id) ?? null;
}

export function listCommittees(): ApiCommittee[] {
  return committees.map((committee) => ({
    id: committee.id,
    name: text(committee.en, committee.mi),
    chair: committee.chairEn || null,
    deputy: committee.deputyEn || null,
    focus: text(committee.focusEn, committee.focusMi),
    note: text(committee.noteEn, committee.noteMi),
    pouiwiVote: committee.pouiwiVote,
    memberIds: members.filter((member) => member.committeeIds.includes(committee.id)).map((member) => member.slug),
    provenance: provenance(torUrl, null, null),
  }));
}

export function getCommittee(id: string): ApiCommittee | null {
  return listCommittees().find((committee) => committee.id === id) ?? null;
}
