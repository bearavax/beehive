import { stat } from "node:fs/promises";

const forbidden = [".next/server/app/en.html", ".next/server/app/mi.html", ".next/server/app/bi.html"];
const found: string[] = [];
for (const file of forbidden) {
  try {
    await stat(file);
    found.push(file);
  } catch {
    // A missing file is the expected dynamic render.
  }
}

if (found.length > 0) {
  console.error("Language pages were prerendered. The nonce policy would block their inline scripts:");
  for (const file of found) console.error(`- ${file}`);
  process.exit(1);
}

console.log("dynamic shell ok");
