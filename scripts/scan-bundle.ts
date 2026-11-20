/**
 * Fails if the production bundle or the seeded decisions contain an email
 * or a New Zealand phone number. Run after `npm run build`.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOTS = [".next", "src/data/synced", "out"];
const TEXT = new Set([".js", ".json", ".html", ".txt", ".css", ".rsc", ".map"]);
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /(?:\+64|0064)[\s-]?(?:\d[\s-]?){8,10}|\b02\d[\s-]?\d{3}[\s-]?\d{4}\b/g;

async function walk(dir: string, out: string[]) {
  let entries;
  try {
    entries = await readdir(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry === "cache" || entry === "node_modules") continue;
    const full = path.join(dir, entry);
    const info = await stat(full);
    if (info.isDirectory()) await walk(full, out);
    else if (TEXT.has(path.extname(entry))) out.push(full);
  }
}

const missing = [];
for (const root of ROOTS) {
  try {
    await stat(root);
  } catch {
    missing.push(root);
  }
}
if (missing.includes(".next") || missing.includes("out")) {
  console.error("scan:secrets needs a production build. Run npm run build first.");
  process.exit(2);
}

const files: string[] = [];
for (const root of ROOTS) {
  if (!missing.includes(root)) await walk(root, files);
}

const hits: string[] = [];
for (const file of files) {
  const text = await readFile(file, "utf8");
  EMAIL.lastIndex = 0;
  PHONE.lastIndex = 0;
  if (EMAIL.test(text) || PHONE.test(text)) hits.push(file);
}

if (hits.length > 0) {
  console.error("Email or phone pattern found:");
  for (const hit of hits) console.error(`- ${hit}`);
  process.exit(1);
}

console.log(`scan:secrets ok (${files.length} files)`);
