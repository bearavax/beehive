#!/usr/bin/env python3
"""Extract minutes text with the pinned pypdf. Poppler is not used.

`pdftotext` without `-layout` (Poppler) yields 0 read blocks: the division
words are present, and the name lines no longer match the printed majority.
This script refuses any pypdf other than the pin in requirements-minutes.txt.
"""

import json
import resource
import sys

REQUIRED = "7.1.1"
# A minutes file under the byte cap should extract well inside this address-space limit.
MEMORY_BYTES = 256 * 1024 * 1024


def main() -> int:
    if len(sys.argv) != 4:
        print("Usage: extract-minutes-pdf.py <page-cap> <input.pdf> <output.txt>", file=sys.stderr)
        return 2
    page_cap = int(sys.argv[1])
    source = sys.argv[2]
    target = sys.argv[3]
    try:
        resource.setrlimit(resource.RLIMIT_AS, (MEMORY_BYTES, MEMORY_BYTES))
    except (ValueError, OSError) as error:
        print(f"could not set memory limit: {error}", file=sys.stderr)
        return 2
    try:
        import pypdf
    except ImportError:
        print("pypdf is not installed. pip install -r requirements-minutes.txt", file=sys.stderr)
        return 2
    if pypdf.__version__ != REQUIRED:
        print(f"pypdf {pypdf.__version__} is not the pinned {REQUIRED}", file=sys.stderr)
        return 2
    reader = pypdf.PdfReader(source)
    pages = len(reader.pages)
    if pages > page_cap:
        json.dump(
            {"extractor": "pypdf", "version": pypdf.__version__, "pages": pages, "chars": 0, "reason": "over-page-cap"},
            sys.stdout,
        )
        return 3
    # A running footer such as "Page 6" belongs to the previous page. Join on a
    # form feed and let the parser count pages from those marks.
    parts: list[str] = []
    for page in reader.pages:
        part = page.extract_text() or ""
        if part and not part.endswith("\n"):
            part += "\n"
        parts.append(part)
    text = "\f".join(parts)
    with open(target, "w", encoding="utf-8") as handle:
        handle.write(text)
    json.dump(
        {"extractor": "pypdf", "version": pypdf.__version__, "pages": pages, "chars": len(text), "reason": None},
        sys.stdout,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
