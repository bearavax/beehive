/**
 * Pinned text extractor for Wellington City Council minutes.
 * pypdf 5.9.0 plain extract_text() is the layout the division parser was written against.
 * Poppler `pdftotext` without `-layout` finds the division words and then yields 0 read
 * blocks, because the name lines no longer match the printed majority count.
 */
export const EXTRACTOR = {
  name: "pypdf" as const,
  version: "5.9.0",
  /** One public minutes file is about 101 MB. The next file in this set is 19.4 MB. */
  byteCap: 25 * 1024 * 1024,
  /** The longest minutes file read so far is 146 pages. */
  pageCap: 200,
  timeoutMs: 60_000,
};

export const POPPLER_NOTE =
  "Poppler pdftotext without -layout yields 0 read blocks on these minutes. Readings are built from pypdf only.";
