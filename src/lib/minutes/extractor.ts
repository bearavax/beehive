import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Pinned text extractor for Wellington City Council minutes.
 * pypdf 7.1.1 plain extract_text() is the layout the division parser was written against.
 * Pages are joined with a form feed. The printed "Page N" footer is the previous page.
 * Poppler `pdftotext` without `-layout` finds the division words and then yields 0 read
 * blocks, because the name lines no longer match the printed majority count.
 */
export const EXTRACTOR = {
  name: "pypdf" as const,
  version: "7.1.1",
  memoryBytes: 256 * 1024 * 1024,
  /** One public minutes file is about 101 MB. The next file in this set is 19.4 MB. */
  byteCap: 25 * 1024 * 1024,
  /** The longest minutes file read so far is 146 pages. */
  pageCap: 200,
  timeoutMs: 60_000,
};

export function minutesPython() {
  if (process.env.BEEHIVE_PYTHON) return process.env.BEEHIVE_PYTHON;
  const venv = path.join(process.cwd(), ".venv-minutes", "bin", "python");
  if (existsSync(venv)) return venv;
  return "python3";
}

export const POPPLER_NOTE =
  "Poppler pdftotext without -layout yields 0 read blocks on these minutes. Readings are built from pypdf only.";
