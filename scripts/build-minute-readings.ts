/**
 * Build src/data/minutes/readings.json from text extracted from public minutes PDFs.
 *
 * The PDFs are not committed. Pass a directory that contains index.json from a local
 * extract (sha256, url, date, bodyId, pages, chars, and NN.txt beside NN.pdf).
 * Closed-session text is not written. A division whose names do not match its
 * majority count is stored as not read, without the names.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { members } from "../src/data/members.ts";
import { attributeDivision } from "../src/lib/minutes/match.ts";
import { parseMinutes } from "../src/lib/minutes/parse.ts";
import { toStoredDivision, type ExtractRecord, type ReadingsFile, type StoredMeeting } from "../src/lib/minutes/record.ts";
import { allowFeedUrl } from "../src/lib/safe-url.ts";
import { EXTRACTOR } from "../src/lib/minutes/extractor.ts";

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node scripts/build-minute-readings.ts <extract-dir>");
  process.exit(1);
}

type IndexRow = {
  i: number;
  date: string;
  bodyId: string;
  url: string;
  sha256: string;
  bytes: number;
  pages: number | null;
  chars: number;
  error: string | null;
  extract: ExtractRecord | null;
};

const index = JSON.parse(await readFile(path.join(dir, "index.json"), "utf8")) as IndexRow[];
const meetings: StoredMeeting[] = [];

for (const row of index) {
  const file = path.join(dir, `${String(row.i).padStart(2, "0")}.txt`);
  let text = "";
  try {
    text = await readFile(file, "utf8");
  } catch {
    text = "";
  }
  const minutesUrl = allowFeedUrl(row.url);
  const usable = Boolean(minutesUrl) && !row.error && text.trim().length >= 400;
  const parsed = usable ? parseMinutes(text) : { closedSessionOmitted: false, divisions: [] };
  const extract: ExtractRecord = row.extract ?? {
    name: "pypdf",
    version: EXTRACTOR.version,
    status: usable ? "parsed" : "skipped",
    reason: minutesUrl ? row.error : "url-rejected",
  };
  meetings.push({
    date: row.date,
    bodyId: row.bodyId,
    minutesUrl,
    sha256: row.sha256,
    bytes: row.bytes,
    pages: row.pages,
    chars: usable ? text.length : row.chars,
    status: usable ? "read" : "unreadable",
    closedSessionOmitted: parsed.closedSessionOmitted,
    extract,
    divisions: usable ? parsed.divisions.map((division) => toStoredDivision(attributeDivision(division, members))) : [],
  });
}

meetings.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.bodyId.localeCompare(b.bodyId)));

const payload: ReadingsFile = {
  source: "wcc-minutes-pdf",
  syncedAt: new Date().toISOString(),
  extractor: {
    name: "pypdf",
    version: EXTRACTOR.version,
    poppler: "Poppler pdftotext without -layout yields 0 read blocks on these minutes. This file is built from pypdf only.",
  },
  note: "Division blocks copied from public Wellington City Council minutes PDFs. A block is stored only when For and Against counts match the printed majority. Absent, abstained, and not voting stay separate. Closed-session text is not stored. Names that are not in a division list are not stored. A minutes URL that fails the feed allowlist is not stored.",
  meetings,
};

const target = path.join("src", "data", "minutes", "readings.json");
await mkdir(path.dirname(target), { recursive: true });
await writeFile(target, `${JSON.stringify(payload, null, 2)}\n`);
const read = meetings.reduce((sum, meeting) => sum + meeting.divisions.filter((division) => division.read).length, 0);
const unread = meetings.reduce((sum, meeting) => sum + meeting.divisions.filter((division) => !division.read).length, 0);
console.log(`wrote ${meetings.length} meetings, ${read} read blocks, ${unread} unread blocks`);
