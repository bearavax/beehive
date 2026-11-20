/**
 * Re-read the public minutes PDFs with the pinned pypdf extractor and
 * attach a page or item to each division. Vote names are replaced only when
 * the new parse matches the names already stored. A mismatched file is kept
 * and recorded, not overwritten.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { members } from "../src/data/members.ts";
import { EXTRACTOR, POPPLER_NOTE } from "../src/lib/minutes/extractor.ts";
import { attributeDivision } from "../src/lib/minutes/match.ts";
import { parseMinutes } from "../src/lib/minutes/parse.ts";
import {
  toStoredDivision,
  type ReadingsFile,
  type StoredDivision,
  type StoredMeeting,
} from "../src/lib/minutes/record.ts";
import { allowFeedUrl } from "../src/lib/safe-url.ts";
import { fetchMinutePdf } from "./fetch-minute-pdf.ts";

const target = path.join("src", "data", "minutes", "readings.json");
const readings = JSON.parse(await readFile(target, "utf8")) as ReadingsFile;

function voteKey(division: StoredDivision) {
  if (!division.read) return { read: false, clauseLabel: division.clauseLabel };
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

function sameVotes(left: StoredDivision[], right: StoredDivision[]) {
  return JSON.stringify(left.map(voteKey)) === JSON.stringify(right.map(voteKey));
}

function blankLocator(division: StoredDivision): StoredDivision {
  return { ...division, item: division.item ?? null, page: division.page ?? null };
}

const dest = path.join(".cache", "minutes");
let parsed = 0;
let skipped = 0;

for (const meeting of readings.meetings as StoredMeeting[]) {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const url = allowFeedUrl(meeting.minutesUrl);
  if (!url) {
    meeting.minutesUrl = null;
    meeting.extract = { name: "pypdf", version: EXTRACTOR.version, status: "skipped", reason: "url-rejected" };
    meeting.divisions = meeting.divisions.map(blankLocator);
    skipped += 1;
    console.log(`skip url ${meeting.date} ${meeting.bodyId}`);
    continue;
  }
  meeting.minutesUrl = url;
  const result = await fetchMinutePdf({ url, destDir: dest, expectedSha256: meeting.sha256 });
  if (!result.ok) {
    meeting.extract = { name: "pypdf", version: EXTRACTOR.version, status: "skipped", reason: result.reason };
    meeting.divisions = meeting.divisions.map(blankLocator);
    if (result.bytes) meeting.bytes = result.bytes;
    skipped += 1;
    console.log(`skip ${result.reason} ${meeting.date} ${meeting.bodyId}`);
    continue;
  }
  const text = await readFile(result.textPath, "utf8");
  const next = parseMinutes(text).divisions.map((division) => toStoredDivision(attributeDivision(division, members)));
  if (!sameVotes(meeting.divisions, next)) {
    meeting.extract = { name: "pypdf", version: EXTRACTOR.version, status: "skipped", reason: "parse-mismatch" };
    meeting.divisions = meeting.divisions.map(blankLocator);
    skipped += 1;
    console.log(`skip parse-mismatch ${meeting.date} ${meeting.bodyId} stored ${meeting.divisions.length} parsed ${next.length}`);
    continue;
  }
  meeting.divisions = next;
  meeting.pages = result.pages;
  meeting.chars = text.length;
  meeting.bytes = result.bytes;
  meeting.sha256 = result.sha256;
  meeting.extract = { name: "pypdf", version: EXTRACTOR.version, status: "parsed", reason: null };
  parsed += 1;
  const unlabeled = next.filter((division) => division.read && !division.clauseLabel);
  const linked = unlabeled.filter((division) => division.page !== null || division.item !== null).length;
  console.log(`parsed ${meeting.date} ${meeting.bodyId} unlabeled ${linked}/${unlabeled.length}`);
}

readings.extractor = { name: "pypdf", version: EXTRACTOR.version, poppler: POPPLER_NOTE };
readings.note =
  "Division blocks copied from public Wellington City Council minutes PDFs with pypdf 5.9.0. A block is stored only when For and Against counts match the printed majority. Absent, abstained, and not voting stay separate. Closed-session text is not stored. Names that are not in a division list are not stored. Poppler pdftotext without -layout yields 0 read blocks, so it is not used. A file over the byte cap is skipped and the previous reading is kept.";

await writeFile(target, `${JSON.stringify(readings, null, 2)}\n`);
console.log(`parsed ${parsed}, skipped ${skipped}`);
