export type Bilingual = {
  en: string;
  mi: string;
};

export type VoteBlock = {
  for: string[];
  against: string[];
  notVoting: string[];
  namesRecorded: boolean;
};

export type StoredClause = {
  id: number;
  clauseId: number | null;
  number: string;
  origin: string;
  text: string;
  result: string;
  movedBy: string | null;
  secondedBy: string | null;
  actionStatus: string | null;
  actionComment: string | null;
  actionUpdated: string | null;
  votes: VoteBlock;
};

export type StoredAmendment = {
  id: number;
  number: string;
  text: string;
  result: string;
  votes: VoteBlock;
};

export type StoredDecision = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  date: string;
  bodyId: string;
  committeeEn: string;
  committeeMi: string;
  result: string;
  implementation: "in-progress" | "completed" | "not-stated";
  publicExclusion: string;
  mataiUrl: string;
  reportUrl: string | null;
  minutesUrl: string | null;
  agendaUrl: string | null;
  videoUrl: string | null;
  issueIds: string[];
  reportId: number | null;
  relatedReports: string[];
  reciprocalReports: string[];
  additionalDocuments: { name: string; url: string }[];
  recommendations: StoredClause[];
  amendments: StoredAmendment[];
  finalClauses: StoredClause[];
};

export type SyncFetch = {
  name: string;
  sha256: string;
  rows: number;
};

export type DecisionFile = {
  source: string;
  syncedAt: string;
  note: string;
  fetches: SyncFetch[];
  decisions: StoredDecision[];
};

export type PlainLayers = {
  recommendation: Bilingual;
  amendments: Bilingual;
  decision: Bilingual;
  impact: Bilingual;
};

export type Tally =
  | { kind: "uniform"; for: number; against: number; notVoting: number }
  | { kind: "mixed"; divisions: number }
  | { kind: "unnamed" };

export type DecisionCard = {
  id: number;
  slug: string;
  title: string;
  date: string;
  bodyId: string;
  committeeEn: string;
  committeeMi: string;
  result: string;
  implementation: StoredDecision["implementation"];
  issueIds: string[];
  plain: PlainLayers;
  authored: boolean;
  tally: Tally;
  mataiUrl: string;
  minutesUrl: string | null;
  searchText: string;
};

export type MemberRole = "mayor" | "deputy-mayor" | "councillor" | "pouiwi" | "former-councillor";

export type Member = {
  slug: string;
  name: string;
  role: MemberRole;
  wardEn: string;
  wardMi: string;
  affiliationEn: string;
  affiliationMi: string;
  mandateEn: string;
  mandateMi: string;
  since: string;
  until?: string;
  profileUrl: string;
  voteAliases: string[];
  committeeIds: string[];
  chairOf: string[];
  deputyOf: string[];
};

export type Committee = {
  id: string;
  mi: string;
  en: string;
  chairEn: string;
  deputyEn: string;
  focusEn: string;
  focusMi: string;
  kind: "council" | "whole" | "named";
  memberSlugs: string[];
  pouiwiVote: boolean;
  noteEn: string;
  noteMi: string;
};

export type Issue = {
  slug: string;
  en: string;
  mi: string;
  summaryEn: string;
  summaryMi: string;
};

export type Stance = "for" | "against" | "not-voting" | "mixed";

export type MemberDecision = {
  slug: string;
  title: string;
  date: string;
  bodyId: string;
  stance: Stance;
};

export type MemberScore = {
  slug: string;
  namedDivisions: number;
  matchedResult: number;
  opposedResult: number;
  notVoting: number;
  decisions: MemberDecision[];
};
