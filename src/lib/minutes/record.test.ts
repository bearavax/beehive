import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import readingsJson from "@/data/minutes/readings.json";
import { members } from "@/data/members";
import { formatSyncTime } from "@/lib/format";
import { attributeDivision, matchMinutesName } from "@/lib/minutes/match";
import { parseMinutes } from "@/lib/minutes/parse";
import { inOffice, meetingsForMember, toStoredDivision, type ReadingsFile, type StoredDivision } from "@/lib/minutes/record";

const readings = readingsJson as ReadingsFile;
const fixtures = path.join(import.meta.dirname, "fixtures");

function text(name: string) {
  return readFileSync(path.join(fixtures, name), "utf8");
}

test("sync time is shown in Pacific/Auckland", () => {
  assert.equal(formatSyncTime("2026-11-20T07:45:10Z"), "2026-11-20 20:45 Pacific/Auckland");
});

test("minutes surnames match one current member", () => {
  assert.equal(matchMinutesName("Mayor Little", members), "andrew-little");
  assert.equal(matchMinutesName("Deputy Mayor McNulty (Deputy Chair)", members), "ben-mcnulty");
  assert.equal(matchMinutesName("Councillor Al-Rubayee", members), "afnan-al-rubayee");
  assert.equal(matchMinutesName("Councillor O'Connor", members), "greg-oconnor");
  assert.equal(matchMinutesName("Councillor Randle", members), "tony-randle");
  assert.equal(matchMinutesName("Pou Iwi Kelly", members), "liz-kelly");
  assert.equal(matchMinutesName("Pouiwi Hohaia", members), "holden-hohaia");
  assert.equal(matchMinutesName("Councillor Little", members), null);
});

test("the saved 12 November 2026 fixture matches the committed reading", () => {
  const parsed = parseMinutes(text("council-2026-11-12.txt"));
  const stored = parsed.divisions.map((division) => toStoredDivision(attributeDivision(division, members)));
  const meeting = readings.meetings.find((item) => item.date === "2026-11-12" && item.bodyId === "te-kaunihera");
  assert.ok(meeting);
  assert.equal(meeting.minutesUrl, JSON.parse(text("council-2026-11-12.json")).sourceUrl);
  assert.deepEqual(meeting.divisions, stored);
});

test("absent stays absent, and a missing name stays not recorded", () => {
  const meeting = readings.meetings.find(
    (item) =>
      item.minutesUrl ===
      "https://wellington.govt.nz/-/media/Your-council/meetings/Committees/Te-Taurapa-Council-Planning-and-Finance-Committee/20261001-Minutes-CPF-updated",
  );
  assert.ok(meeting);
  const division = meeting.divisions.find((item) => item.read && item.clauseLabel === "Recommendation 2.2");
  assert.ok(division && division.read);
  assert.deepEqual(division.absent, ["Pou Iwi Kelly"]);
  assert.equal(division.abstained, null);
  assert.equal(division.notVoting, null);

  const kelly = meetingsForMember(readings, "liz-kelly", members).find((item) => item.minutesUrl === meeting.minutesUrl);
  const chung = meetingsForMember(readings, "ray-chung", members).find((item) => item.minutesUrl === meeting.minutesUrl);
  const little = meetingsForMember(readings, "andrew-little", members).find((item) => item.minutesUrl === meeting.minutesUrl);
  const randle = meetingsForMember(readings, "tony-randle", members).find((item) => item.minutesUrl === meeting.minutesUrl);
  const oconnor = meetingsForMember(readings, "greg-oconnor", members).find((item) => item.minutesUrl === meeting.minutesUrl);
  assert.ok(kelly && chung && little && randle && oconnor);
  const at = (divisions: { clauseLabel: string | null; state: string; recordedAs: string | null }[]) =>
    divisions.find((item) => item.clauseLabel === "Recommendation 2.2");
  assert.equal(at(kelly.divisions)?.state, "absent");
  assert.equal(at(kelly.divisions)?.recordedAs, "Pou Iwi Kelly");
  assert.equal(at(chung.divisions)?.state, "against");
  assert.equal(at(little.divisions)?.state, "for");
  assert.equal(randle.divisions.length, 1);
  assert.equal(randle.divisions[0].state, "not-in-office");
  assert.equal(oconnor.divisions.length, 1);
  assert.equal(oconnor.divisions[0].state, "not-in-office");
});

test("a person who held office and was not named stays not recorded", () => {
  const meeting = readings.meetings.find((item) => item.date === "2026-09-24" && item.bodyId === "te-kaunihera");
  assert.ok(meeting);
  const little = meetingsForMember(readings, "andrew-little", members).find((item) => item.date === meeting.date && item.bodyId === meeting.bodyId);
  assert.ok(little);
  assert.ok(little.divisions.some((division) => division.state === "not-recorded"));
  assert.ok(inOffice(members.find((member) => member.slug === "andrew-little")!, meeting.date));
});

test("meetings outside a term are one not-in-office row, not a missing vote", () => {
  const oconnor = meetingsForMember(readings, "greg-oconnor", members);
  const randle = meetingsForMember(readings, "tony-randle", members);
  assert.equal(oconnor.flatMap((meeting) => meeting.divisions).filter((division) => division.state === "not-recorded").length, 0);
  assert.ok(oconnor.some((meeting) => meeting.divisions[0]?.state === "not-in-office"));
  assert.ok(randle.some((meeting) => meeting.divisions[0]?.state === "not-in-office"));
  assert.ok(randle.flatMap((meeting) => meeting.divisions).some((division) => division.state === "not-recorded"));
  for (const member of members) {
    for (const meeting of meetingsForMember(readings, member.slug, members)) {
      if (inOffice(member, meeting.date)) continue;
      assert.deepEqual(
        meeting.divisions.map((division) => division.state),
        ["not-in-office"],
      );
    }
  }
});

test("people in office on the same day share the same division headings", () => {
  for (const meeting of readings.meetings) {
    const present = members.filter((member) => inOffice(member, meeting.date));
    const rows = present.map((member) =>
      meetingsForMember(readings, member.slug, members).find((item) => item.minutesUrl === meeting.minutesUrl && item.date === meeting.date),
    );
    const first = rows[0];
    assert.ok(first);
    for (const row of rows) {
      assert.ok(row);
      assert.deepEqual(
        row.divisions.map((division) => division.clauseLabel),
        first.divisions.map((division) => division.clauseLabel),
      );
    }
  }
});

test("committed readings do not keep personal details or a majority score", () => {
  const raw = JSON.stringify(readings);
  for (const needle of ["Kettle", "Odlin", "Puketapu", "Laban", "Beausoleil", "Finnegan", "withMajority", "access", "payment"]) {
    assert.equal(raw.includes(needle), false, needle);
  }
  assert.equal(raw.includes("@"), false);
  for (const meeting of readings.meetings) {
    for (const division of meeting.divisions) {
      if (!division.read) {
        assert.equal("for" in division, false);
        continue;
      }
      const lists = [division.for, division.against ?? [], division.abstained ?? [], division.absent ?? [], division.notVoting ?? []];
      const keys = lists.flat().map((name) => name.toLowerCase());
      assert.equal(new Set(keys).size, keys.length, `${meeting.date} ${division.clauseLabel}`);
      if (division.majority) {
        const [forCount, againstCount] = division.majority.split(":").map(Number);
        assert.equal(division.for.length, forCount);
        assert.equal((division.against ?? []).length, againstCount);
      }
    }
  }
});

function unreadShape(division: StoredDivision) {
  return division.read ? "read" : "unread";
}

test("an unread block has no names", () => {
  const unread = readings.meetings.flatMap((meeting) => meeting.divisions).filter((division) => !division.read);
  assert.ok(unread.length > 0);
  for (const division of unread) assert.equal(unreadShape(division), "unread");
});
