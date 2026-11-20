/**
 * Download a public minutes PDF and extract text with the pinned pypdf.
 * The URL must pass allowFeedUrl. Redirects are an error. The body is capped.
 * sha256 is checked before any text is parsed.
 */
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { EXTRACTOR, minutesPython } from "../src/lib/minutes/extractor.ts";
import { allowFeedUrl } from "../src/lib/safe-url.ts";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export type FetchExtract =
  | {
      ok: true;
      url: string;
      sha256: string;
      bytes: number;
      pages: number;
      chars: number;
      textPath: string;
      extractor: "pypdf";
      version: string;
    }
  | {
      ok: false;
      url: string | null;
      sha256: string | null;
      bytes: number;
      pages: number | null;
      reason: string;
      extractor: "pypdf";
      version: string;
    };

export async function fetchMinutePdf(input: {
  url: string;
  destDir: string;
  expectedSha256?: string | null;
}): Promise<FetchExtract> {
  const url = allowFeedUrl(input.url);
  const version = EXTRACTOR.version;
  if (!url) {
    return { ok: false, url: null, sha256: null, bytes: 0, pages: null, reason: "url-rejected", extractor: "pypdf", version };
  }
  let response: Response;
  try {
    response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(EXTRACTOR.timeoutMs),
      headers: { "user-agent": UA, accept: "application/pdf" },
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === "TimeoutError" ? "timeout" : "fetch-failed";
    return { ok: false, url, sha256: null, bytes: 0, pages: null, reason, extractor: "pypdf", version };
  }
  if (!response.ok || !response.body) {
    return { ok: false, url, sha256: null, bytes: 0, pages: null, reason: `http-${response.status}`, extractor: "pypdf", version };
  }
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > EXTRACTOR.byteCap) {
    await response.body.cancel();
    return { ok: false, url, sha256: null, bytes: declared, pages: null, reason: "over-byte-cap", extractor: "pypdf", version };
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > EXTRACTOR.byteCap) {
      await reader.cancel();
      return { ok: false, url, sha256: null, bytes: size, pages: null, reason: "over-byte-cap", extractor: "pypdf", version };
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (input.expectedSha256 && input.expectedSha256 !== sha256) {
    return { ok: false, url, sha256, bytes: size, pages: null, reason: "sha256-mismatch", extractor: "pypdf", version };
  }
  await mkdir(input.destDir, { recursive: true });
  const pdfPath = path.join(input.destDir, `${sha256}.pdf`);
  const textPath = path.join(input.destDir, `${sha256}.txt`);
  await writeFile(pdfPath, bytes);
  const extracted = await runExtractor(pdfPath, textPath);
  if (!extracted.ok) {
    return {
      ok: false,
      url,
      sha256,
      bytes: size,
      pages: extracted.pages,
      reason: extracted.reason,
      extractor: "pypdf",
      version,
    };
  }
  return {
    ok: true,
    url,
    sha256,
    bytes: size,
    pages: extracted.pages,
    chars: extracted.chars,
    textPath,
    extractor: "pypdf",
    version,
  };
}

function runExtractor(pdfPath: string, textPath: string): Promise<{ ok: true; pages: number; chars: number } | { ok: false; pages: number | null; reason: string }> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: { ok: true; pages: number; chars: number } | { ok: false; pages: number | null; reason: string }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const child = spawn(
      "prlimit",
      [
        `--as=${EXTRACTOR.memoryBytes}`,
        "--",
        minutesPython(),
        path.join("scripts", "extract-minutes-pdf.py"),
        String(EXTRACTOR.pageCap),
        pdfPath,
        textPath,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish({ ok: false, pages: null, reason: "timeout" });
    }, EXTRACTOR.timeoutMs);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", () => finish({ ok: false, pages: null, reason: "extractor-failed" }));
    child.on("close", (code, signal) => {
      if (signal === "SIGKILL") {
        finish({ ok: false, pages: null, reason: "timeout" });
        return;
      }
      let parsed: { pages?: number; chars?: number; reason?: string | null } = {};
      try {
        parsed = JSON.parse(stdout);
      } catch {
        parsed = {};
      }
      if (code === 0 && typeof parsed.pages === "number") {
        finish({ ok: true, pages: parsed.pages, chars: parsed.chars ?? 0 });
        return;
      }
      finish({
        ok: false,
        pages: typeof parsed.pages === "number" ? parsed.pages : null,
        reason: parsed.reason || stderr.trim() || `extractor-exit-${code}`,
      });
    });
  });
}

async function main() {
  const url = process.argv[2];
  const dest = process.argv[3] ?? path.join(".cache", "minutes");
  const expected = process.argv[4] ?? null;
  if (!url) {
    console.error("Usage: node scripts/fetch-minute-pdf.ts <url> [dest] [expected-sha256]");
    process.exit(1);
  }
  const result = await fetchMinutePdf({ url, destDir: dest, expectedSha256: expected });
  if (result.ok) {
    const text = await readFile(result.textPath, "utf8");
    console.log(JSON.stringify({ ...result, chars: text.length }));
    return;
  }
  console.log(JSON.stringify(result));
  process.exitCode = 1;
}

if ((process.argv[1] ?? "").endsWith("fetch-minute-pdf.ts")) await main();
