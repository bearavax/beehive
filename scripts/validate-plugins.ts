import { readFile } from "node:fs/promises";
import { pluginBadge, validatePluginManifest } from "../src/lib/sdk/manifest.ts";

async function load(path: string, trust: "core" | "example", expect: "statutory-adapter" | "community") {
  const input = JSON.parse(await readFile(path, "utf8")) as unknown;
  const result = validatePluginManifest(input);
  if (!result.ok) {
    console.error(`${path} failed:`);
    for (const error of result.errors) console.error(`- ${error}`);
    process.exit(1);
  }
  if (result.manifest.kind !== expect) {
    console.error(`${path} kind is ${result.manifest.kind}, expected ${expect}`);
    process.exit(1);
  }
  const badge = pluginBadge(result.manifest.kind, trust);
  console.log(`${result.manifest.id} ${badge}`);
  return result.manifest;
}

const wcc = await load("src/plugins/wcc/beehive-plugin.json", "core", "statutory-adapter");
await load("examples/starter-plugin/beehive-plugin.json", "example", "community");

if (wcc.id !== "nz.wcc.matai-manapori" || !wcc.citationLock) {
  console.error("Wellington adapter did not pass the citation-lock check");
  process.exit(1);
}

const writeAttempt = validatePluginManifest({
  specVersion: "1.0.0",
  id: "community.bad",
  kind: "community",
  name: { en: "Bad", mi: null },
  summary: { en: "Tries to write.", mi: null },
  maintainer: { name: "Example", url: null },
  license: "MIT",
  scopes: ["decisions:write"],
  uiSlot: null,
  citationLock: true,
  council: null,
});
if (writeAttempt.ok) {
  console.error("Validator accepted a write scope");
  process.exit(1);
}

console.log("plugin manifests ok");
