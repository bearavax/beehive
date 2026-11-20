import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { parseMinutes } from "./parse";

const fixtures = path.join(import.meta.dirname, "fixtures");

function text(name: string) {
  return readFileSync(path.join(fixtures, name), "utf8");
}

test("council minutes of 12 November 2026 keep for and against apart", () => {
  const parsed = parseMinutes(text("council-2026-11-12.txt"));
  assert.equal(parsed.closedSessionOmitted, false);
  const read = parsed.divisions.filter((division) => division.read);
  assert.equal(read.length, 7);

  const procedural = read[0];
  assert.equal(procedural.clauseLabel, null);
  assert.equal(procedural.item, null);
  const last = read[6];
  assert.equal(last.clauseLabel, null);
  assert.equal(last.item, "3.1");
  assert.equal(procedural.majority, "16:0");
  assert.equal(procedural.result, "Carried");
  assert.deepEqual(procedural.against, []);
  assert.equal(procedural.abstained, null);
  assert.equal(procedural.absent, null);
  assert.equal(procedural.notVoting, null);
  assert.ok(procedural.for.includes("Mayor Little"));
  assert.ok(procedural.for.includes("Councillor Chung"));
  assert.equal(procedural.for.length, 16);

  const clauses = read[1];
  assert.equal(clauses.clauseLabel, "Clauses 1-6");
  assert.equal(clauses.majority, "14:2");
  assert.deepEqual(clauses.against, ["Councillor Chung", "Councillor Tiefenbacher"]);
  assert.equal(clauses.for.includes("Councillor Chung"), false);
  assert.equal(clauses.abstained, null);
  assert.equal(clauses.absent, null);

  const clause71 = read[2];
  assert.equal(clause71.clauseLabel, "Clause 7.1");
  assert.deepEqual(clause71.against, ["Councillor Chung"]);
  assert.equal(clause71.majority, "15:1");

  assert.equal(read[3].clauseLabel, "Clause 7.2");
  assert.equal(read[4].clauseLabel, "Clause 7.3");
  assert.equal(read[4].majority, "16:0");
  assert.equal(read[5].clauseLabel, "Clause 7");
  assert.equal(read[6].for.length, 16);
  assert.deepEqual(read[6].against, []);
});

test("1 October 2026 Te Taurapa minutes keep absent separate from abstained and not recorded", () => {
  const parsed = parseMinutes(text("taurapa-2026-10-01-absent.txt"));
  const read = parsed.divisions.filter((division) => division.read);
  assert.equal(read.length, 2);
  assert.equal(read[0].clauseLabel, "Recommendation 2.2");
  assert.deepEqual(read[0].absent, ["Pou Iwi Kelly"]);
  assert.equal(read[0].abstained, null);
  assert.equal(read[0].notVoting, null);
  assert.deepEqual(read[0].against, ["Councillor Calvert", "Councillor Chung", "Councillor Tiefenbacher"]);
  assert.equal(read[0].for.includes("Pou Iwi Kelly"), false);
  assert.equal(read[1].clauseLabel, "Recommendation 2.2.1");
  assert.deepEqual(read[1].absent, ["Pou Iwi Kelly"]);
  assert.equal(read[1].majority, "11:5");
});

test("an attachment summary is not read as a division", () => {
  const parsed = parseMinutes(text("taurapa-2026-11-12-attachment.txt"));
  assert.equal(parsed.divisions.length, 0);
  const raw = text("taurapa-2026-11-12-attachment.txt");
  assert.match(raw, /Absent \(1\): Brown/);
  assert.match(raw, /No division recorded in the minutes/);
});

test("a doubled name makes that division unread and drops the names", () => {
  const parsed = parseMinutes(text("taurapa-2026-10-22-duplicate.txt"));
  assert.equal(parsed.divisions.length, 1);
  assert.equal(parsed.divisions[0].read, false);
  assert.deepEqual(parsed.divisions[0].for, []);
  assert.equal(parsed.divisions[0].against, null);
  assert.equal(parsed.divisions[0].clauseLabel, "Clause 3.1");
});

test("a closed session is omitted, including any division inside it", () => {
  const parsed = parseMinutes(`A division was called for, voting on which was as follows:
For:
Councillor Chung
Against:
Councillor Young
Majority Vote: 1:1
Carried
The hui went into public-excluded session at 1:00pm.
A division was called for, voting on which was as follows:
For:
Hugh Kettle
Against:
Councillor Chung
Majority Vote: 1:1
Carried
The hui returned from public-excluded session at 1:10pm.
`);
  assert.equal(parsed.closedSessionOmitted, true);
  assert.equal(parsed.divisions.length, 1);
  assert.equal(parsed.divisions[0].read, true);
  assert.deepEqual(parsed.divisions[0].for, ["Councillor Chung"]);
  assert.equal(JSON.stringify(parsed).includes("Kettle"), false);
});

test("an abstain heading stays on its own list", () => {
  // Not a meeting. None of the saved minutes used an Abstain heading.
  // This string only checks the heading is not folded into absent or left unnamed.
  const parsed = parseMinutes(`A division was called for, voting on which was as follows:
For:
Councillor Young
Against:
Councillor Chung
Abstain:
Councillor Foon
Majority Vote: 1:1
Carried
`);
  assert.equal(parsed.divisions.length, 1);
  assert.equal(parsed.divisions[0].read, true);
  assert.deepEqual(parsed.divisions[0].abstained, ["Councillor Foon"]);
  assert.equal(parsed.divisions[0].absent, null);
  assert.equal(parsed.divisions[0].notVoting, null);
});

test("the saved council fixture does not contain public-participation speaker names", () => {
  const raw = text("council-2026-11-12.txt");
  for (const name of ["Beausoleil", "Madeline", "Finnegan", "Messerli", "Gail Duncan", "Jude Douglas"]) {
    assert.equal(raw.includes(name), false, name);
  }
  const meta = JSON.parse(text("council-2026-11-12.json")) as { sourceUrl: string; sha256: string };
  assert.equal(
    meta.sourceUrl,
    "https://wellington.govt.nz/-/media/Your-council/meetings/Council/2026/2026-11-12---Council---Minutes",
  );
  assert.equal(meta.sha256.length, 64);
});
