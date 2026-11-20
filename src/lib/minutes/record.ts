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
  | "no-division";

export type StoredDivision =
  | { read: false; clauseLabel: string | null }
  | {
      read: true;
      clauseLabel: string | null;
      result: MinuteResult | null;
      majority: string;
      for: string[];
      against: string[] | null;
      abstained: string[] | null;
      absent: string[] | null;
      notVoting: string[] | null;
    };

export type StoredMeeting = {
  date: string;
  bodyId: string;
  minutesUrl: string;
  sha256: string;
  bytes: number;
  pages: number | null;
  chars: number;
  status: "read" | "unreadable";
  closedSessionOmitted: boolean;
  divisions: StoredDivision[];
};

export type ReadingsFile = {
  source: "wcc-minutes-pdf";
  syncedAt: string;
  note: string;
  meetings: StoredMeeting[];
};

export type MemberDivision = {
  clauseLabel: string | null;
  result: MinuteResult | null;
  state: MinuteVoteState;
  recordedAs: string | null;
};

export type MemberMeeting = {
  date: string;
  bodyId: string;
  minutesUrl: string;
  syncedAt: string;
  status: "read" | "unreadable";
  closedSessionOmitted: boolean;
  divisions: MemberDivision[];
};

export function toStoredDivision(division: MinuteDivision): StoredDivision {
  if (!division.read || !division.majority) {
    return { read: false, clauseLabel: division.clauseLabel };
  }
  return {
    read: true,
    clauseLabel: division.clauseLabel,
    result: division.result,
    majority: division.majority,
    for: division.for,
    against: division.against,
    abstained: division.abstained,
    absent: division.absent,
    notVoting: division.notVoting,
  };
}

function rowsForMeeting(meeting: StoredMeeting, slug: string, members: Member[]): MemberDivision[] {
  if (meeting.status !== "read") {
    return [{ clauseLabel: null, result: null, state: "not-read", recordedAs: null }];
  }
  if (meeting.divisions.length === 0) {
    return [{ clauseLabel: null, result: null, state: "no-division", recordedAs: null }];
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
    return { clauseLabel: division.clauseLabel, result: null, state: "not-read", recordedAs: null };
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
    return { clauseLabel: division.clauseLabel, result: division.result, state: hits[0].state, recordedAs: hits[0].recordedAs };
  }
  if (hits.length > 1) {
    return { clauseLabel: division.clauseLabel, result: null, state: "not-read", recordedAs: null };
  }
  return { clauseLabel: division.clauseLabel, result: division.result, state: "not-recorded", recordedAs: null };
}

/** Same meetings, same order, same fields. Only the recorded state changes. */
export function meetingsForMember(file: ReadingsFile, slug: string, members: Member[]): MemberMeeting[] {
  return file.meetings.map((meeting) => ({
    date: meeting.date,
    bodyId: meeting.bodyId,
    minutesUrl: meeting.minutesUrl,
    syncedAt: file.syncedAt,
    status: meeting.status,
    closedSessionOmitted: meeting.closedSessionOmitted,
    divisions: rowsForMeeting(meeting, slug, members),
  }));
}
