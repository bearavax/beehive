/**
 * Reads division blocks from Wellington City Council minutes text.
 * Names are copied only from For / Against / Absent / Abstain / Not voting
 * lists. A list that is not in the block stays null. It is not filled from
 * the majority line or from who is missing.
 */

export type MinuteResult = "Carried" | "Lost";

export type MinuteDivision = {
  clauseLabel: string | null;
  /** Agenda item such as 2.1, when the block has no clause heading. */
  item: string | null;
  /** PDF page of the division, from the running header. */
  page: number | null;
  for: string[];
  against: string[] | null;
  abstained: string[] | null;
  absent: string[] | null;
  notVoting: string[] | null;
  majority: string | null;
  result: MinuteResult | null;
  read: boolean;
};

export type MinutesParse = {
  closedSessionOmitted: boolean;
  divisions: MinuteDivision[];
};

type SectionName = "for" | "against" | "abstained" | "absent" | "notVoting";

const NAME =
  /^(?:mayor|deputy mayor|councillor|pouiwi|pou iwi)\s+\S+/i;

const INTRO =
  /A division was\s+(?:required\s+under\s+Standing\s+Order\b[\s\S]{0,180}?|called\s+for\b([\s\S]{0,180}?)),?\s*voting\s+on\s+which\s+was\s+as\s+follows\s*:/gi;

export function parseMinutes(text: string): MinutesParse {
  const closed = omitClosedSession(text);
  const divisions: MinuteDivision[] = [];
  const matches = [...closed.text.matchAll(INTRO)];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const at = match.index ?? 0;
    const start = at + match[0].length;
    const end = index + 1 < matches.length ? (matches[index + 1].index ?? closed.text.length) : closed.text.length;
    const inline = cleanLabel(match[1] ?? null);
    const found = parseSlice(closed.text.slice(start, end), inline ?? labelBefore(closed.text, at));
    const page = pageBefore(closed.text, at);
    const item = itemBefore(closed.text, at);
    for (const division of found) {
      division.page = division.page ?? page;
      division.item = division.item ?? item;
    }
    divisions.push(...found);
  }
  return { closedSessionOmitted: closed.omitted, divisions };
}

function pageBefore(text: string, index: number): number | null {
  const before = text.slice(0, index);
  if (!before.includes("\f") && !text.includes("\f")) return null;
  let page = 1;
  for (let i = 0; i < before.length; i += 1) {
    if (before.charCodeAt(i) === 12) page += 1;
  }
  return page;
}

function itemBefore(text: string, index: number): string | null {
  const lines = text.slice(0, index).split(/\n/);
  let item: string | null = null;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]?.trim() ?? "";
    const match = line.match(/^(\d+)\.(\d+)\s+[A-ZĀĒĪŌŪ]/);
    if (!match) continue;
    const window = lines.slice(i, i + 8).map((entry) => entry.trim());
    if (window.some((entry) => /^moved\b/i.test(entry))) item = `${match[1]}.${match[2]}`;
  }
  return item;
}

function omitClosedSession(text: string): { text: string; omitted: boolean } {
  const pattern =
    /the hui went into public-excluded session[\s\S]*?(?:the hui returned from public-excluded session|$)/gi;
  const omitted = pattern.test(text);
  pattern.lastIndex = 0;
  if (!omitted) return { text, omitted: false };
  return { text: text.replace(pattern, "\n"), omitted: true };
}

function parseSlice(slice: string, inlineLabel: string | null): MinuteDivision[] {
  const lines = slice.split(/\n/).filter((line) => !isRunningHeader(line));
  const found: MinuteDivision[] = [];
  let label = inlineLabel;
  let section: SectionName | null = null;
  let buffers: Record<SectionName, string[] | null> = emptyBuffers();
  let opened = false;
  let majority: string | null = null;
  let result: MinuteResult | null = null;

  const emit = () => {
    if (!opened) return;
    found.push(finish(label, buffers, majority, result));
    label = null;
    section = null;
    buffers = emptyBuffers();
    opened = false;
    majority = null;
    result = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^a division was\b/i.test(line)) break;

    const resultWord = line.match(/^(Carried|Lost)$/);
    if (resultWord && opened) {
      result = resultWord[1] === "Lost" ? "Lost" : "Carried";
      emit();
      continue;
    }

    const majorityLine = line.match(/^Majority\s+Vote:\s*(\d+)\s*:\s*(\d+)\s*$/i);
    if (majorityLine && opened) {
      majority = `${majorityLine[1]}:${majorityLine[2]}`;
      section = null;
      continue;
    }

    const heading = headingOf(line);
    if (heading) {
      if (heading.section === "for" && opened && buffers.for) {
        emit();
      }
      if (heading.section === "for") opened = true;
      if (!opened) continue;
      buffers[heading.section] = [...(buffers[heading.section] ?? []), heading.rest].filter((part) => part.trim().length > 0);
      if (buffers[heading.section]?.length === 0) buffers[heading.section] = [];
      section = heading.section;
      if (heading.rest.trim()) buffers[heading.section] = [heading.rest.trim()];
      continue;
    }

    const clause = clauseLabel(line);
    if (clause && !opened) {
      label = clause;
      continue;
    }
    if (clause && opened && majority) {
      emit();
      label = clause;
      continue;
    }

    if (!opened) {
      if (isBoundary(line)) break;
      continue;
    }

    // The majority line already closed the name lists. Anything after it that is
    // not the result word is the next item, not another name.
    if (!section) {
      emit();
      break;
    }

    buffers[section] = [...(buffers[section] ?? []), line];
  }

  emit();
  return found;
}

function emptyBuffers(): Record<SectionName, string[] | null> {
  return { for: null, against: null, abstained: null, absent: null, notVoting: null };
}

function finish(
  label: string | null,
  buffers: Record<SectionName, string[] | null>,
  majority: string | null,
  result: MinuteResult | null,
): MinuteDivision {
  const blank: MinuteDivision = {
    clauseLabel: label,
    item: null,
    page: null,
    for: [],
    against: null,
    abstained: null,
    absent: null,
    notVoting: null,
    majority: null,
    result: null,
    read: false,
  };
  if (!buffers.for || !majority) return blank;

  const parsed = {
    for: namesOf(buffers.for),
    against: buffers.against === null ? null : namesOf(buffers.against),
    abstained: buffers.abstained === null ? null : namesOf(buffers.abstained),
    absent: buffers.absent === null ? null : namesOf(buffers.absent),
    notVoting: buffers.notVoting === null ? null : namesOf(buffers.notVoting),
  };
  const lists = [parsed.for, parsed.against, parsed.abstained, parsed.absent, parsed.notVoting];
  if (lists.some((list) => list && !list.ok)) return blank;

  const forNames = parsed.for?.names ?? [];
  const againstNames = parsed.against?.names ?? null;
  const [forCount, againstCount] = majority.split(":").map(Number);
  if (forNames.length !== forCount) return blank;
  if (againstNames === null) {
    if (againstCount !== 0) return blank;
  } else if (againstNames.length !== againstCount) {
    return blank;
  }

  const keys = lists.flatMap((list) => list?.names.map(nameKey) ?? []);
  if (new Set(keys).size !== keys.length) return blank;

  return {
    clauseLabel: label,
    item: null,
    page: null,
    for: forNames,
    against: againstNames,
    abstained: parsed.abstained?.names ?? null,
    absent: parsed.absent?.names ?? null,
    notVoting: parsed.notVoting?.names ?? null,
    majority,
    result,
    read: true,
  };
}

function namesOf(parts: string[]): { names: string[]; ok: boolean } | null {
  const blob = parts.join(" ").replace(/\s+/g, " ").trim();
  if (!blob) return { names: [], ok: true };
  const names = blob
    .split(",")
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const ok = names.every((name) => {
    const cleaned = name.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
    return cleaned.length <= 80 && !/[@]|(\+64|\b02\d)/.test(name) && NAME.test(cleaned);
  });
  return { names, ok };
}

export function nameKey(recorded: string) {
  return recorded
    .replace(/\([^)]*\)/g, " ")
    .replace(/[’‘]/g, "'")
    .replace(/\bpou\s+iwi\b/gi, "pouiwi")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function headingOf(line: string): { section: SectionName; rest: string } | null {
  const match = line.match(/^(for|against|absent|abstain(?:ed)?|not voting)\s*:\s*(.*)$/i);
  if (!match) return null;
  const word = match[1].toLowerCase();
  const section: SectionName =
    word === "for"
      ? "for"
      : word === "against"
        ? "against"
        : word === "absent"
          ? "absent"
          : word === "not voting"
            ? "notVoting"
            : "abstained";
  return { section, rest: match[2] ?? "" };
}

function clauseLabel(line: string): string | null {
  const text = line.trim().replace(/:$/, "").trim();
  if (text.length < 3 || text.length > 80) return null;
  if (/\bwas\b/i.test(text)) return null;
  if (!/^(?:clauses?|recommendation|part|item)\b/i.test(text)) return null;
  return text;
}

function labelBefore(text: string, index: number): string | null {
  const before = text.slice(Math.max(0, index - 700), index);
  const lines = before
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line && !isRunningHeader(line));
  const start = Math.max(0, lines.length - 6);
  for (let i = lines.length - 1; i >= start; i -= 1) {
    const line = lines[i];
    if (/^(?:carried|lost)$/i.test(line) || /^majority\s+vote\b/i.test(line)) return null;
    const label = clauseLabel(line);
    if (label) return label;
  }
  return null;
}

function cleanLabel(value: string | null): string | null {
  if (!value) return null;
  const kept = value
    .split(/\n/)
    .filter((line) => !isRunningHeader(line))
    .join(" ");
  return clauseLabel(kept.replace(/\s+/g, " ").trim().replace(/^on\s+/i, ""));
}

function isBoundary(line: string) {
  return /^(?:moved\b|resolved$|the hui\b|authenticated\b|present$|apologies\b|the motion\b)/i.test(line.trim());
}

function isRunningHeader(line: string) {
  const text = line.trim();
  if (!text) return true;
  if (/^(?:carried|lost)$/i.test(text)) return false;
  if (/^(?:for|against|absent|abstain(?:ed)?|not voting)\s*:/i.test(text)) return false;
  if (/^majority\s+vote\s*:/i.test(text)) return false;
  if (/^a division was\b/i.test(text)) return false;
  if (/^minutes of /i.test(text)) return true;
  if (/^page \d+$/i.test(text)) return true;
  const letters = text.replace(/[^A-Za-z]/g, "");
  return letters.length >= 4 && letters === letters.toUpperCase();
}
