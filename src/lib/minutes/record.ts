import type { Member } from "@/lib/types";
import { matchMinutesName } from "@/lib/minutes/match";
import type { MinuteDivision, MinuteResult } from "@/lib/minutes/parse";

export type MinuteVoteState =
  | "for"
  | "against"
  | "abstained"
  | "absent"
  | "not-voting"
  | "not-recorded"
  | "not-read"
  | "no-division"
  | "not-in-office"
  | "term-uncertain"
  | "not-fetched";

export type StoredDivision =
  | { read: false; clauseLabel: string | null; item: string | null; page: number | null }
  | {
      read: true;
      clauseLabel: string | null;
      item: string | null;
      page: number | null;
      result: MinuteResult | null;
      majority: string;
      for: string[];
      against: string[] | null;
      abstained: string[] | null;
      absent: string[] | null;
      notVoting: string[] | null;
    };

export type ExtractRecord = {
  name: "pypdf";
  version: string;
  status: "parsed" | "skipped";
  reason: string | null;
};

export type StoredMeeting = {
  date: string;
  bodyId: string;
  minutesUrl: string | null;
  sha256: string;
  bytes: number;
  pages: number | null;
  chars: number;
  status: "read" | "unreadable" | "skipped";
  closedSessionOmitted: boolean;
  extract: ExtractRecord | null;
  divisions: StoredDivision[];
};

export type ReadingsFile = {
  source: "wcc-minutes-pdf";
  syncedAt: string;
  extractor: { name: "pypdf"; version: string; poppler: string };
  note: string;
  meetings: StoredMeeting[];
};

export type MemberDivision = {
  clauseLabel: string | null;
  item: string | null;
  page: number | null;
  result: MinuteResult | null;
  state: MinuteVoteState;
  recordedAs: string | null;
};

export type MemberMeeting = {
  date: string;
  bodyId: string;
  minutesUrl: string | null;
  syncedAt: string;
  status: "read" | "unreadable" | "skipped";
  extract: ExtractRecord | null;
  closedSessionOmitted: boolean;
  divisions: MemberDivision[];
};

export function toStoredDivision(division: MinuteDivision): StoredDivision {
  if (!division.read || !division.majority) {
    return { read: false, clauseLabel: division.clauseLabel, item: division.item, page: division.page };
  }
  return {
    read: true,
    clauseLabel: division.clauseLabel,
    item: division.item,
    page: division.page,
    result: division.result,
    majority: division.majority,
    for: division.for,
    against: division.against,
    abstained: division.abstained,
    absent: division.absent,
    notVoting: division.notVoting,
  };
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export type Office = "in" | "out" | "uncertain";

/** A month such as 2026-08 is not expanded to the 31st. An unsourced day is uncertain. */
export function officeOn(
  member: { since: string; until?: string; uncertainFrom?: string; uncertainUntil?: string },
  date: string,
): Office {
  if (!DAY.test(member.since) || (member.until !== undefined && !DAY.test(member.until))) return "uncertain";
  if (member.uncertainFrom && member.uncertainUntil && date >= member.uncertainFrom && date <= member.uncertainUntil) {
    return "uncertain";
  }
  if (date < member.since) return "out";
  if (member.until && date > member.until) return "out";
  return "in";
}

export function inOffice(member: { since: string; until?: string; uncertainFrom?: string; uncertainUntil?: string }, date: string) {
  return officeOn(member, date) === "in";
}

function marker(state: MinuteVoteState): MemberDivision {
  return { clauseLabel: null, item: null, page: null, result: null, state, recordedAs: null };
}

function rowsForMeeting(meeting: StoredMeeting, slug: string, members: Member[]): MemberDivision[] {
  const member = members.find((item) => item.slug === slug);
  const office = member ? officeOn(member, meeting.date) : "in";
  if (office === "out") return [marker("not-in-office")];
  if (office === "uncertain") return [marker("term-uncertain")];
  if (meeting.status === "skipped" || meeting.extract?.status === "skipped") return [marker("not-fetched")];
  if (meeting.status !== "read") {
    return [{ clauseLabel: null, item: null, page: null, result: null, state: "not-read", recordedAs: null }];
  }
  if (meeting.divisions.length === 0) {
    return [{ clauseLabel: null, item: null, page: null, result: null, state: "no-division", recordedAs: null }];
  }
  return meeting.divisions.map((division) => divisionForMember(division, slug, members));
}

const SIDES: { state: MinuteVoteState; field: "for" | "against" | "abstained" | "absent" | "notVoting" }[] = [
  { state: "for", field: "for" },
  { state: "against", field: "against" },
  { state: "abstained", field: "abstained" },
  { state: "absent", field: "absent" },
  { state: "not-voting", field: "notVoting" },
];

export function divisionForMember(division: StoredDivision, slug: string, members: Member[]): MemberDivision {
  if (!division.read) {
    return {
      clauseLabel: division.clauseLabel,
      item: division.item,
      page: division.page,
      result: null,
      state: "not-read",
      recordedAs: null,
    };
  }
  const hits: { state: MinuteVoteState; recordedAs: string }[] = [];
  for (const side of SIDES) {
    const names = division[side.field];
    if (!names) continue;
    for (const name of names) {
      if (matchMinutesName(name, members) === slug) hits.push({ state: side.state, recordedAs: name });
    }
  }
  if (hits.length === 1) {
    return {
      clauseLabel: division.clauseLabel,
      item: division.item,
      page: division.page,
      result: division.result,
      state: hits[0].state,
      recordedAs: hits[0].recordedAs,
    };
  }
  if (hits.length > 1) {
    return { clauseLabel: division.clauseLabel, item: division.item, page: division.page, result: null, state: "not-read", recordedAs: null };
  }
  return {
    clauseLabel: division.clauseLabel,
    item: division.item,
    page: division.page,
    result: division.result,
    state: "not-recorded",
    recordedAs: null,
  };
}

/** Same meetings, same order, same fields. Only the recorded state changes. */
export function meetingsForMember(file: ReadingsFile, slug: string, members: Member[]): MemberMeeting[] {
  return file.meetings.map((meeting) => ({
    date: meeting.date,
    bodyId: meeting.bodyId,
    minutesUrl: meeting.minutesUrl,
    syncedAt: file.syncedAt,
    status: meeting.status,
    extract: meeting.extract,
    closedSessionOmitted: meeting.closedSessionOmitted,
    divisions: rowsForMeeting(meeting, slug, members),
  }));
}
