import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderPublic, type BundleManifest } from "./api-surface.ts";

function forbidKeys(value: unknown, where: string, hits: string[]) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => forbidKeys(item, `${where}[${index}]`, hits));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (key === "access" || key === "payment") hits.push(`${where}.${key}`);
    forbidKeys(child, `${where}.${key}`, hits);
  }
}

const root = path.resolve("out");
const manifest = JSON.parse(await readFile(path.join(root, "bundle-manifest.json"), "utf8")) as BundleManifest;
if (manifest.signed !== false || manifest.api !== "beehive.v1") {
  console.error("bundle manifest must describe the unsigned beehive.v1 API");
  process.exit(1);
}

const hits: string[] = [];
const mismatches: string[] = [];
for (const file of manifest.files) {
  const text = await readFile(path.join(root, file.path), "utf8");
  const hash = createHash("sha256").update(text).digest("hex");
  const live = await renderPublic(file.url);
  if (text !== live || hash !== file.sha256) mismatches.push(file.url);
  const parsed = JSON.parse(text) as { api?: string };
  if (parsed.api !== "beehive.v1") mismatches.push(`${file.url} api name`);
  forbidKeys(parsed, file.url, hits);
}

if (mismatches.length > 0 || hits.length > 0) {
  for (const mismatch of mismatches) console.error(`mismatch ${mismatch}`);
  for (const hit of hits) console.error(`forbidden field ${hit}`);
  process.exit(1);
}

console.log(`api export matches the route handlers (${manifest.files.length} files, unsigned)`);
