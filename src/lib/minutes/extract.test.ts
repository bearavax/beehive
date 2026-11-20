import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { EXTRACTOR, minutesPython } from "@/lib/minutes/extractor";
import { parseMinutes } from "@/lib/minutes/parse";

const fixtures = path.join(import.meta.dirname, "fixtures");

const pdfs = [
  {
    file: "council-2026-11-12.pdf",
    sha256: "18b0894f6b92f3705c58395272645cc45602fc1fc468957f790a0906e1d57294",
    read: 7,
    pages: [6, 7, 8, 8, 8, 9, 10],
  },
  {
    file: "csd-2026-05-28.pdf",
    sha256: "f08d85ce04d4a89368a13ae049ee9a1d4860f5ccf52ac8fd3ef1182e2f6dd6b3",
    read: 3,
    pages: [7, 10, 13],
  },
  {
    file: "council-2026-03-12.pdf",
    sha256: "67e90937c0866a6125029dab7f7a510f5ac907ab48ea1cc12d0d61365538d02b",
    read: 4,
  },
  {
    file: "taurapa-2026-08-13.pdf",
    sha256: "da5edb6268883bb86ad66dec229efde454df3391264716915780f7a3e1a89c7f",
    read: 1,
  },
];

test("poppler text without layout yields no read block", () => {
  const parsed = parseMinutes(readFileSync(path.join(fixtures, "poppler-division.txt"), "utf8"));
  assert.ok(parsed.divisions.length >= 1);
  assert.equal(parsed.divisions.filter((division) => division.read).length, 0);
});

test("pinned pypdf reads the three committed minutes PDFs", () => {
  for (const pdf of pdfs) {
    const file = path.join(fixtures, "pdf", pdf.file);
    const bytes = readFileSync(file);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), pdf.sha256);
    const textPath = path.join(mkdtempSync(path.join(tmpdir(), "beehive-minutes-")), "extract.txt");
    const child = spawnSync(
      minutesPython(),
      [path.join("scripts", "extract-minutes-pdf.py"), String(EXTRACTOR.pageCap), file, textPath],
      { encoding: "utf8" },
    );
    assert.equal(child.status, 0, child.stderr);
    const meta = JSON.parse(child.stdout) as { version: string; pages: number };
    assert.equal(meta.version, EXTRACTOR.version);
    assert.ok(meta.pages > 0 && meta.pages <= EXTRACTOR.pageCap);
    const parsed = parseMinutes(readFileSync(textPath, "utf8"));
    const read = parsed.divisions.filter((division) => division.read);
    assert.equal(read.length, pdf.read, pdf.file);
    if (pdf.pages) assert.deepEqual(parsed.divisions.map((division) => division.page), pdf.pages, pdf.file);
  }
});
