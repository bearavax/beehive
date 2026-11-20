import synced from "@/data/synced/decisions.json";
import { committees } from "@/data/committees";
import { issues } from "@/data/issues";
import { members } from "@/data/members";
import { plainLanguage } from "@/data/plain-language";
import type {
  DecisionCard,
  DecisionFile,
  Member,
  MemberScore,
  PlainLayers,
  Stance,
  StoredClause,
  StoredDecision,
  Tally,
  VoteBlock,
} from "@/lib/types";

const file = synced as DecisionFile;

export const syncedAt = file.syncedAt;
export const sourceNote = file.note;
export const syncFetches = file.fetches ?? [];
export const decisions: StoredDecision[] = file.decisions;

const UNTRANSLATED = "";

function citedMoney(decision: StoredDecision): string | null {
  const blob = [...decision.finalClauses, ...decision.recommendations, ...decision.amendments]
    .map((clause) => clause.text)
    .join(" ");
  const hits = blob
    .split(/(?<=\.)\s+/)
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter((sentence) => /\$|\d+(?:\.\d+)?\s*percent|\d+(?:\.\d+)?\s*per cent/i.test(sentence));
  if (hits.length === 0) return null;
  return hits.slice(0, 3).join(" ");
}

export function decisionBySlug(slug: string) {
  return decisions.find((decision) => decision.slug === slug);
}

export function decisionsForIssue(slug: string) {
  return decisions.filter((decision) => decision.issueIds.includes(slug));
}

function layersFor(decision: StoredDecision): PlainLayers {
  const written = plainLanguage[decision.id];
  if (written) return written;
  const substantive = decision.finalClauses
    .map((clause) => clause.text.trim())
    .filter((text) => text && !/^receive the information\b/i.test(text));
  const money = citedMoney(decision);
  return {
    recommendation: {
      en: decision.summary || substantive[0] || "The officer clauses are below. No summary was published.",
      mi: UNTRANSLATED,
    },
    amendments: {
      en: decision.amendments.length
        ? decision.amendments
            .map((item) => `${item.number} ${item.result}: ${item.text || "Amendment text was blank in the export."}`)
            .join(" ")
        : "No amendments are recorded in the committee export.",
      mi: UNTRANSLATED,
    },
    decision: {
      en: substantive.slice(0, 2).join(" ") || "The published clauses are the decision.",
      mi: UNTRANSLATED,
    },
    impact: {
      en: money || "Not stated in the published clause text. Mātai Manapori has no separate budget field.",
      mi: UNTRANSLATED,
    },
  };
}

function signature(votes: VoteBlock, result: string) {
  return JSON.stringify({
    result,
    for: [...votes.for].sort(),
    against: [...votes.against].sort(),
    notVoting: [...votes.notVoting].sort(),
  });
}

function tallyOf(decision: StoredDecision): Tally {
  const named = decision.finalClauses.filter((clause) => clause.votes.namesRecorded && clause.result !== "Not required");
  if (named.length === 0) return { kind: "unnamed" };
  const unique = new Map(named.map((clause) => [signature(clause.votes, clause.result), clause]));
  if (unique.size === 1) {
    const clause = [...unique.values()][0];
    return {
      kind: "uniform",
      for: clause.votes.for.length,
      against: clause.votes.against.length,
      notVoting: clause.votes.notVoting.length,
    };
  }
  return { kind: "mixed", divisions: unique.size };
}

export function cards(): DecisionCard[] {
  return decisions.map((decision) => {
    const plain = layersFor(decision);
    const searchText = [
      decision.title,
      decision.summary,
      decision.committeeEn,
      decision.committeeMi,
      plain.recommendation.en,
      plain.recommendation.mi,
      plain.decision.en,
      plain.decision.mi,
      plain.impact.en,
      ...decision.issueIds,
    ]
      .join(" ")
      .toLowerCase();
    return {
      id: decision.id,
      slug: decision.slug,
      title: decision.title,
      date: decision.date,
      bodyId: decision.bodyId,
      committeeEn: decision.committeeEn,
      committeeMi: decision.committeeMi,
      result: decision.result,
      implementation: decision.implementation,
      issueIds: decision.issueIds,
      plain,
      authored: Boolean(plainLanguage[decision.id]),
      tally: tallyOf(decision),
      mataiUrl: decision.mataiUrl,
      minutesUrl: decision.minutesUrl,
      searchText,
    };
  });
}

export function withPlain(decision: StoredDecision) {
  return { decision, plain: layersFor(decision), tally: tallyOf(decision) };
}

function norm(value: string) {
  return value
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

type Division = { votes: VoteBlock; result: string };

function divisionsOf(decision: StoredDecision): Division[] {
  const bag: Division[] = [];
  const seen = new Set<string>();
  const push = (votes: VoteBlock, result: string) => {
    if (!votes.namesRecorded || result === "Not required") return;
    const key = signature(votes, result);
    if (seen.has(key)) return;
    seen.add(key);
    bag.push({ votes, result });
  };
  for (const clause of decision.finalClauses) push(clause.votes, clause.result);
  for (const amendment of decision.amendments) push(amendment.votes, amendment.result);
  return bag;
}

function stanceOn(name: string, division: Division): Stance | null {
  const target = norm(name);
  const hit = (list: string[]) => list.some((item) => norm(item) === target);
  const sides = [hit(division.votes.for), hit(division.votes.against), hit(division.votes.notVoting)];
  if (!sides.some(Boolean)) return null;
  if (hit(division.votes.for) && !hit(division.votes.against) && !hit(division.votes.notVoting)) return "for";
  if (hit(division.votes.against) && !hit(division.votes.for) && !hit(division.votes.notVoting)) return "against";
  if (hit(division.votes.notVoting) && !hit(division.votes.for) && !hit(division.votes.against)) return "not-voting";
  return "mixed";
}

function majoritySide(votes: VoteBlock): "for" | "against" | "tie" {
  if (votes.for.length > votes.against.length) return "for";
  if (votes.against.length > votes.for.length) return "against";
  return "tie";
}

function matched(stance: Stance, votes: VoteBlock) {
  if (stance === "not-voting") return "not-voting";
  const side = majoritySide(votes);
  if (side === "tie") return "other";
  if (stance === side) return "matched";
  if (stance === "for" || stance === "against") return "opposed";
  return "other";
}

export function scoreFor(member: Member): MemberScore {
  let namedDivisions = 0;
  let matchedResult = 0;
  let opposedResult = 0;
  let notVoting = 0;
  const rows: MemberScore["decisions"] = [];

  for (const decision of decisions) {
    const stances = new Set<Stance>();
    for (const division of divisionsOf(decision)) {
      for (const alias of member.voteAliases) {
        const stance = stanceOn(alias, division);
        if (!stance) continue;
        stances.add(stance);
        namedDivisions += 1;
        const mark = matched(stance, division.votes);
        if (mark === "matched") matchedResult += 1;
        else if (mark === "opposed") opposedResult += 1;
        else if (mark === "not-voting") notVoting += 1;
        break;
      }
    }
    if (stances.size === 0) continue;
    const stance: Stance = stances.size === 1 ? [...stances][0] : "mixed";
    rows.push({
      slug: decision.slug,
      title: decision.title,
      date: decision.date,
      bodyId: decision.bodyId,
      stance,
    });
  }

  return { slug: member.slug, namedDivisions, matchedResult, opposedResult, notVoting, decisions: rows };
}

export function allScores() {
  return members.map((member) => scoreFor(member));
}

export function bodies() {
  return committees.map((committee) => ({
    id: committee.id,
    en: committee.en,
    mi: committee.mi,
  }));
}

export function issueList() {
  return issues;
}

export function clauseHasText(clause: { text: string }) {
  return clause.text.trim().length > 0;
}

export function primaryClauses(decision: StoredDecision): StoredClause[] {
  return decision.finalClauses.length ? decision.finalClauses : decision.recommendations;
}
