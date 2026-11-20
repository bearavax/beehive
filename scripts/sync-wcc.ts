/**
 * Mātai Manapori (TrackDem) sync for Beehive.
 *
 * Reads only the public endpoints verified on 20 November 2026:
 *   POST /api/committee/allClauses
 *   GET  /api/clause/getAllClauses
 *   GET  /your-council/meetings-calendar
 *
 * Does not call staff, auth, or write routes. Drops every email field.
 * If a source cannot be read, the script exits without writing a seed.
 */
import { createHash } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = "https://meetings.wellington.govt.nz";
const TRIENNIUM = "2025-2028";
const COMMITTEE_IDS = [5, 93, 96, 97] as const;

const BODIES: Record<number, { id: string; mi: string; en: string }> = {
  5: { id: "te-kaunihera", mi: "Te Kaunihera o Pōneke", en: "Council" },
  93: { id: "te-taurapa", mi: "Te Taurapa", en: "Council Planning and Finance Committee" },
  96: { id: "te-hoe-matua", mi: "Te Hoe Matua", en: "City Strategy and Delivery Committee" },
  97: { id: "te-rauawa", mi: "Te Rauawa", en: "Social, Cultural, and Environment Committee" },
};

const ISSUE_TITLES: { id: string; phrases: string[] }[] = [
  {
    id: "rates-planning",
    phrases: ["annual plan", "rates", "mahere tautoru", "triennium plan", "long-term plan", "long term plan", "remission"],
  },
  {
    id: "tiaki-wai",
    phrases: ["tiaki wai", "local water", "metro water", "metrowater"],
  },
  {
    id: "transport-infrastructure",
    phrases: ["golden mile", "traffic resolution", "cycleway", "cycle lane", "bus priority", "courtenay place"],
  },
  {
    id: "housing-city",
    phrases: ["housing", "te toi mahana", "homeless"],
  },
];

type ExportRow = Record<string, unknown>;

type VoteBlock = {
  for: string[];
  against: string[];
  notVoting: string[];
  namesRecorded: boolean;
};

type StoredClause = {
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

type RegisterRow = {
  clauseId: number;
  reportId: number;
  clauseNumber: string;
  action: string;
  approvedActionStatus: string;
  approvedActionUpdateComment: string;
  approvedActionUpdatedDate: string;
  publicExclusion: string;
  isPX: boolean;
};

type CalendarDoc = { name: string; url: string };
type CalendarMeeting = {
  date: string;
  agendaUrl: string | null;
  minutesUrl: string | null;
  videoUrl: string | null;
  additional: CalendarDoc[];
};

const HEADERS = {
  accept: "application/json, text/html",
  "content-type": "application/json",
  "user-agent": "BeehiveSync/1.0 (public civic transparency; +https://github.com/bearavax/beehive)",
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function blank(value: unknown): string {
  if (typeof value !== "string") return "";
  const text = value.replace(/\s+/g, " ").trim();
  if (text === "-" || text === "- - -" || text === "—") return "";
  return text;
}

function nameList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => blank(item)).filter(Boolean);
}

function votes(forNames: unknown, againstNames: unknown, notVotingNames: unknown): VoteBlock {
  const yes = nameList(forNames);
  const no = nameList(againstNames);
  const skip = nameList(notVotingNames);
  return { for: yes, against: no, notVoting: skip, namesRecorded: yes.length + no.length + skip.length > 0 };
}

function titleList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => blank(item)).filter(Boolean);
}

function parseDisplayDate(value: string): string | null {
  const match = value.match(/(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})/);
  if (!match) return null;
  const months: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  const month = months[match[2].slice(0, 3).toLowerCase()];
  if (!month) return null;
  return `${match[3]}-${month}-${match[1].padStart(2, "0")}`;
}

function reportIdFrom(url: string): number | null {
  const match = url.match(/\/reports\/(\d+)/);
  return match ? Number(match[1]) : null;
}

function slugify(title: string, id: number): string {
  const base = title
    .toLowerCase()
    .replace(/[’‘']/g, "")
    .replace(/[^a-z0-9āēīōū]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "decision"}-${id}`;
}

function normTitle(value: string) {
  return value.toLowerCase().replace(/[’‘']/g, "'").replace(/\s+/g, " ").trim();
}

function titleHas(title: string, phrases: string[]) {
  const text = normTitle(title);
  return phrases.some((phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|[^a-zāēīōū])${escaped}(?:$|[^a-zāēīōū])`, "i").test(text);
  });
}

async function readText(url: string, init?: RequestInit): Promise<{ text: string; rowsHint?: number }> {
  const response = await fetch(url, { ...init, headers: { ...HEADERS, ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  const text = await response.text();
  return { text };
}

function implementationOf(clauses: StoredClause[]): "in-progress" | "completed" | "not-stated" {
  const statuses = clauses.map((clause) => (clause.actionStatus ?? "").toLowerCase());
  if (statuses.some((status) => status.includes("progress"))) return "in-progress";
  if (statuses.some((status) => status === "completed")) return "completed";
  return "not-stated";
}

function decisionResult(clauses: StoredClause[]): string {
  const results = clauses
    .map((clause) => clause.result)
    .filter((result) => result && result !== "Not stated" && result !== "Not required");
  if (results.length === 0) return "Not stated";
  if (results.every((result) => result === "Carried")) return "Carried";
  if (results.every((result) => result === "Lost")) return "Lost";
  return "Mixed";
}

function isPublic(value: string) {
  return value === "Not Public Excluded" || value === "Released from Public Excluded";
}

function joinRegister(reportId: number | null, clauseNumber: string, text: string, register: Map<string, RegisterRow[]>) {
  if (reportId == null) return null;
  const rows = register.get(`${reportId}|${clauseNumber.trim()}`) ?? [];
  if (rows.length === 0) return null;
  const needle = text.slice(0, 80).toLowerCase();
  return (
    rows.find((row) => needle && row.action.toLowerCase().includes(needle.slice(0, 40))) ??
    rows[0]
  );
}

async function main() {
  const fetches: { name: string; sha256: string; rows: number }[] = [];

  const registerResponse = await readText(`${BASE}/api/clause/getAllClauses`);
  const registerRaw = JSON.parse(registerResponse.text) as Record<string, unknown>[];
  fetches.push({
    name: "GET /api/clause/getAllClauses",
    sha256: sha256(registerResponse.text),
    rows: registerRaw.length,
  });

  const register = new Map<string, RegisterRow[]>();
  for (const row of registerRaw) {
    if (row.reportOfTriennium !== TRIENNIUM) continue;
    if (!COMMITTEE_IDS.includes(row.committeeId as (typeof COMMITTEE_IDS)[number])) continue;
    if (row.isPX === true) continue;
    if (!isPublic(String(row.publicExclusion ?? ""))) continue;
    const item: RegisterRow = {
      clauseId: Number(row.clauseId),
      reportId: Number(row.reportId),
      clauseNumber: blank(row.clauseNumber),
      action: blank(row.action),
      approvedActionStatus: blank(row.approvedActionStatus),
      approvedActionUpdateComment: blank(row.approvedActionUpdateComment),
      approvedActionUpdatedDate: blank(row.approvedActionUpdatedDate),
      publicExclusion: String(row.publicExclusion ?? ""),
      isPX: Boolean(row.isPX),
    };
    const key = `${item.reportId}|${item.clauseNumber}`;
    const list = register.get(key) ?? [];
    list.push(item);
    register.set(key, list);
  }

  const calendarResponse = await readText(`${BASE}/your-council/meetings-calendar`, {
    headers: { accept: "text/html" },
  });
  const next = calendarResponse.text.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
  if (!next) throw new Error("Meetings calendar did not include __NEXT_DATA__");
  const calendarJson = JSON.parse(next[1]) as { props?: { pageProps?: { allMeetings?: Record<string, unknown>[] } } };
  const allMeetings = calendarJson.props?.pageProps?.allMeetings ?? [];
  fetches.push({
    name: "GET /your-council/meetings-calendar",
    sha256: sha256(next[1]),
    rows: allMeetings.length,
  });

  const calendar = new Map<string, CalendarMeeting>();
  for (const meeting of allMeetings) {
    if (meeting.trienniumOfMeeting !== TRIENNIUM) continue;
    const committeeId = Number(meeting.committeeId);
    if (!COMMITTEE_IDS.includes(committeeId as (typeof COMMITTEE_IDS)[number])) continue;
    const date = String(meeting.meetingDate ?? "").slice(0, 10);
    const agenda = meeting.meetingAgenda as { publicationStatus?: string; meetingAgendaUrl?: string } | null;
    const minutes = meeting.meetingMinutes as {
      publicationStatus?: string;
      meetingMinutesUrl?: string;
      meetingVideo?: string;
    } | null;
    const extra = Array.isArray(meeting.additionalDocuments) ? meeting.additionalDocuments : [];
    calendar.set(`${committeeId}|${date}`, {
      date,
      agendaUrl: agenda?.publicationStatus === "Published" ? blank(agenda.meetingAgendaUrl) || null : null,
      minutesUrl: minutes?.publicationStatus === "Published" ? blank(minutes.meetingMinutesUrl) || null : null,
      videoUrl: blank(minutes?.meetingVideo) || null,
      additional: extra
        .filter((doc) => (doc as { publicationStatus?: string }).publicationStatus === "Published")
        .map((doc) => ({
          name: blank((doc as { documentName?: string }).documentName) || "Additional document",
          url: blank((doc as { additionalDocumentUrl?: string }).additionalDocumentUrl),
        }))
        .filter((doc) => doc.url),
    });
  }

  const grouped = new Map<string, { committeeId: number; rows: ExportRow[] }>();
  for (const committeeId of COMMITTEE_IDS) {
    const body = JSON.stringify({ committeeId, triennium: TRIENNIUM });
    const response = await readText(`${BASE}/api/committee/allClauses`, { method: "POST", body });
    const rows = JSON.parse(response.text) as ExportRow[];
    fetches.push({
      name: `POST /api/committee/allClauses ${committeeId}`,
      sha256: sha256(response.text),
      rows: rows.length,
    });
    for (const row of rows) {
      const exclusion = blank(row.Public_exclusion) || String(row.Public_exclusion ?? "");
      if (!isPublic(exclusion)) continue;
      const title = blank(row.Report_title);
      const date = parseDisplayDate(blank(row.Meeting_date)) ?? "unknown";
      const key = `${committeeId}|${date}|${normTitle(title)}`;
      const bag = grouped.get(key) ?? { committeeId, rows: [] };
      bag.rows.push(row);
      grouped.set(key, bag);
    }
    console.log(`committee ${committeeId}: ${rows.length} rows`);
  }

  const decisions = [...grouped.values()].map(({ committeeId, rows }) => {
    const first = rows[0];
    const bodyInfo = BODIES[committeeId];
    const fullName = blank(first.Committee_name);
    const [miFromSource, enFromSource] = fullName.split("|").map((part) => part.trim());
    const title = blank(first.Report_title);
    const reportUrl = blank(first.Link_to_full_report);
    const reportId = reportIdFrom(reportUrl);
    const date = parseDisplayDate(blank(first.Meeting_date)) ?? "unknown";
    const meeting = calendar.get(`${committeeId}|${date}`);
    let localId = 0;

    const toClause = (row: ExportRow, kind: "final" | "amendment"): StoredClause => {
      const number = blank(row.Clause_number);
      const original = blank(row.Original_clause);
      const altered = blank(row.Altered_clause_text);
      const amendment = blank(row.Amendment_clause_text);
      const text = kind === "amendment" ? amendment : altered && blank(row.Change_state) === "Altered" ? altered : original || altered;
      const joined = joinRegister(reportId, number, text || original, register);
      const exportStatus = blank(row.Approved_action_status);
      const exportComment = blank(row.Approved_action_update_comment);
      const result =
        kind === "amendment"
          ? blank(row.Amendment_vote_result) || blank(row.Final_amendment_vote_result) || "Not stated"
          : blank(row.Final_clause_vote_result) || "Not stated";
      return {
        id: ++localId,
        clauseId: joined?.clauseId ?? null,
        number,
        origin: blank(row.Clause_origin),
        text,
        result,
        movedBy: kind === "amendment" ? blank(row.Member_moved_amendment) || null : blank(row.Member_moved_decision_motion) || null,
        secondedBy: kind === "amendment" ? blank(row.Member_seconded_amendment) || null : blank(row.Member_seconded_decision_motion) || null,
        actionStatus: joined?.approvedActionStatus || exportStatus || null,
        actionComment: joined?.approvedActionUpdateComment || exportComment || null,
        actionUpdated: joined?.approvedActionUpdatedDate || blank(row.Approved_action_update_date_time) || null,
        votes:
          kind === "amendment"
            ? votes(row.Members_voting_for_the_amendment, row.Members_voting_against_the_amendment, row.Members_not_voting_on_the_amendment)
            : votes(
                row.Members_voting_for_the_final_clause,
                row.Members_voting_against_the_final_clause,
                row.Members_not_voting_on_the_final_clause,
              ),
      };
    };

    const substantiveRows = rows.filter((row) => blank(row.Clause_origin) !== "Amendment");
    const amendmentRows = rows.filter((row) => blank(row.Clause_origin) === "Amendment");
    const finalClauses = substantiveRows.map((row) => toClause(row, "final"));
    const recommendations = substantiveRows.map((row) => {
      const clause = toClause(row, "final");
      return { ...clause, text: blank(row.Original_clause) || clause.text };
    });
    const amendments = amendmentRows.map((row) => {
        const clause = toClause(row, "amendment");
        return {
          id: clause.id,
          number: clause.number,
          text: clause.text,
          result: clause.result,
          votes: clause.votes,
        };
      });

    const issueIds = ISSUE_TITLES.filter((issue) => titleHas(title, issue.phrases)).map((issue) => issue.id);
    const id = reportId ?? Number(`${committeeId}${date.replaceAll("-", "")}`.slice(0, 12));

    return {
      id,
      slug: slugify(title, id),
      title,
      summary: blank(first.Summary_of_report),
      date,
      bodyId: bodyInfo.id,
      committeeEn: enFromSource || bodyInfo.en,
      committeeMi: miFromSource || bodyInfo.mi,
      result: decisionResult(finalClauses.length ? finalClauses : []),
      implementation: implementationOf(finalClauses),
      publicExclusion: blank(first.Public_exclusion) || "Not stated",
      mataiUrl: reportUrl || `${BASE}/your-council/reports`,
      reportUrl: reportUrl || null,
      minutesUrl: meeting?.minutesUrl || blank(first.Link_to_meeting_minutes) || null,
      agendaUrl: meeting?.agendaUrl || blank(first.Link_to_meeting_agenda) || null,
      videoUrl: meeting?.videoUrl || blank(first.Link_to_video_of_meeting) || null,
      issueIds,
      reportId,
      relatedReports: titleList(first.Related_reports),
      reciprocalReports: titleList(first.Reciprocal_reports),
      additionalDocuments: meeting?.additional ?? [],
      recommendations,
      amendments,
      finalClauses,
    };
  });

  const byTitle = new Map(decisions.map((decision) => [normTitle(decision.title), decision]));
  for (let pass = 0; pass < 4; pass += 1) {
    for (const decision of decisions) {
      if (decision.issueIds.length === 0) continue;
      for (const related of [...decision.relatedReports, ...decision.reciprocalReports]) {
        const other = byTitle.get(normTitle(related));
        if (!other) continue;
        for (const issueId of decision.issueIds) {
          if (!other.issueIds.includes(issueId)) other.issueIds.push(issueId);
        }
      }
    }
  }

  decisions.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));

  const payload = {
    source: BASE,
    syncedAt: new Date().toISOString(),
    note: "Built from POST /api/committee/allClauses for committees 5, 93, 96 and 97 (2025-2028), joined to approved action fields on GET /api/clause/getAllClauses and to agendas, minutes, video, and additional documents on the meetings calendar. Vote names are copied only from the committee export. No votes are inferred. Email fields are not stored. Public-excluded rows are dropped. getAllClauses.finalClauseVoteResult is not used as a vote result.",
    fetches,
    decisions,
  };

  const outDir = path.join(process.cwd(), "src/data/synced");
  await mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, "decisions.json");
  const tmp = `${outFile}.tmp`;
  await writeFile(tmp, `${JSON.stringify(payload, null, 2)}\n`);
  await rename(tmp, outFile);
  const tagged = decisions.filter((decision) => decision.issueIds.length > 0).length;
  console.log(`wrote ${decisions.length} decisions (${tagged} on an issue thread) to ${outFile}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
