import type { PluginManifest } from "@/lib/sdk/manifest";

export type BilingualText = {
  en: string;
  mi: string | null;
};

export type Attribution = {
  dataModel: {
    name: string;
    license: "CC-BY-4.0";
    version: string;
    date: string;
    publisher: string;
    url: string;
  };
  records: {
    publisher: string;
    source: string;
    rights: string;
  };
};

/**
 * Only `public` is served. Other tiers are reserved for a later library of
 * verified papers and are not implemented.
 */
export type AccessTier = "public";

export type Provenance = {
  sourceUrl: string | null;
  mataiReportId: number | null;
  syncedAt: string | null;
  access: AccessTier;
  attribution: Attribution;
};

export type AdapterQuery = {
  from?: string | null;
  to?: string | null;
  bodyId?: string | null;
  issue?: string | null;
  limit?: number;
  offset?: number;
};

export type ApiVote = {
  clauseNumber: string;
  result: string | null;
  namesRecorded: boolean;
  for: string[];
  against: string[];
  notVoting: string[];
  abstain: null;
  absent: null;
  conflictOfInterest: null;
};

export type ApiDecisionSummary = {
  id: string;
  reportId: number | null;
  title: string;
  summary: string | null;
  date: string;
  bodyId: string;
  body: BilingualText;
  result: string | null;
  implementation: {
    status: "In progress" | "Completed" | null;
    source: string | null;
    updatedAt: string | null;
  };
  issueIds: string[];
  provenance: Provenance;
};

export type ApiDecision = ApiDecisionSummary & {
  plain: {
    authoredBy: "beehive";
    statutoryRecord: false;
    recommendation: BilingualText;
    amendments: BilingualText;
    decision: BilingualText;
    impact: BilingualText;
  } | null;
  clauses: Array<{
    number: string;
    origin: string | null;
    text: string | null;
    result: string | null;
    movedBy: string | null;
    secondedBy: string | null;
    implementation: {
      status: "In progress" | "Completed" | null;
      comment: string | null;
      updatedAt: string | null;
      clauseId: number | null;
      source: string | null;
    };
    votes: ApiVote;
  }>;
  amendments: Array<{
    number: string;
    text: string | null;
    result: string | null;
    votes: ApiVote;
  }>;
  documents: {
    agendaUrl: string | null;
    minutesUrl: string | null;
    videoUrl: string | null;
    reportUrl: string | null;
    additional: { name: string; url: string }[];
  };
};

export type ApiMeeting = {
  id: string;
  mataiMeetingId: null;
  date: string;
  bodyId: string;
  body: BilingualText;
  agendaUrl: string | null;
  minutesUrl: string | null;
  videoUrl: string | null;
  decisionIds: string[];
  provenance: Provenance;
};

export type ApiMember = {
  id: string;
  name: string;
  role: string;
  ward: BilingualText;
  affiliation: BilingualText;
  mandate: BilingualText;
  since: string | null;
  until: string | null;
  committees: string[];
  record: {
    note: string;
    namedDivisions: number;
    withMajority: number;
    againstMajority: number;
    notVoting: number;
    decisions: { id: string; date: string; stance: string }[];
  };
  provenance: Provenance;
};

export type ApiIssue = {
  id: string;
  name: BilingualText;
  summary: BilingualText;
  editorial: true;
  decisionIds: string[];
  provenance: Provenance;
};

export type ApiCommittee = {
  id: string;
  name: BilingualText;
  chair: string | null;
  deputy: string | null;
  focus: BilingualText;
  note: BilingualText;
  pouiwiVote: boolean | null;
  memberIds: string[];
  provenance: Provenance;
};

/**
 * What another council implements. Methods return only records the adapter
 * actually holds. Unknown ids return null. Missing vote names stay empty,
 * and abstain, absent, and conflict stay null.
 */
export interface CouncilAdapter {
  readonly manifest: PluginManifest;
  fetchMeetings(query?: AdapterQuery): Promise<ApiMeeting[]>;
  fetchDecisions(query?: AdapterQuery): Promise<ApiDecisionSummary[]>;
  fetchVotes(decisionId: string): Promise<ApiVote[] | null>;
}
