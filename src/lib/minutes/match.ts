import type { Member } from "@/lib/types";
import { nameKey, type MinuteDivision } from "@/lib/minutes/parse";

/** Role and surname, as the minutes write them. Full legal names are not guessed. */
export function matchMinutesName(recorded: string, members: Member[]): string | "ambiguous" | null {
  const key = nameKey(recorded);
  const hits = members.filter((member) => {
    const last = nameKey(member.name.split(" ").at(-1) ?? "");
    if (!last) return false;
    if (key === `mayor ${last}`) return member.role === "mayor";
    if (key === `deputy mayor ${last}`) return member.role === "deputy-mayor";
    if (key === `councillor ${last}`) {
      return member.role === "councillor" || member.role === "deputy-mayor" || member.role === "former-councillor";
    }
    if (key === `pouiwi ${last}`) return member.role === "pouiwi";
    return false;
  });
  if (hits.length === 1) return hits[0].slug;
  if (hits.length > 1) return "ambiguous";
  return null;
}

export function namesIn(division: MinuteDivision): string[] {
  if (!division.read) return [];
  return [
    ...division.for,
    ...(division.against ?? []),
    ...(division.abstained ?? []),
    ...(division.absent ?? []),
    ...(division.notVoting ?? []),
  ];
}

/** A block that names one person twice, or a name that matches two people, is not attributed. */
export function attributeDivision(division: MinuteDivision, members: Member[]): MinuteDivision {
  if (!division.read) return division;
  const seen = new Set<string>();
  for (const name of namesIn(division)) {
    const match = matchMinutesName(name, members);
    if (match === "ambiguous") return unread(division);
    if (match) {
      if (seen.has(match)) return unread(division);
      seen.add(match);
    }
  }
  return division;
}

function unread(division: MinuteDivision): MinuteDivision {
  return {
    clauseLabel: division.clauseLabel,
    for: [],
    against: null,
    abstained: null,
    absent: null,
    notVoting: null,
    majority: null,
    result: null,
    read: false,
  };
}
