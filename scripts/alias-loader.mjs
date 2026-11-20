import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

function withExtension(base) {
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.json`, path.join(base, "index.ts")];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function resolved(file) {
  const url = pathToFileURL(file).href;
  if (file.endsWith(".json")) return { url, shortCircuit: true, importAttributes: { type: "json" } };
  return { url, shortCircuit: true };
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/server") return nextResolve("next/server.js", context);
  if (specifier.startsWith("@/")) {
    const file = withExtension(path.join(root, "src", specifier.slice(2)));
    if (!file) return nextResolve(specifier, context);
    return resolved(file);
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.includes("/src/")) {
    const parent = fileURLToPath(context.parentURL);
    const file = withExtension(path.resolve(path.dirname(parent), specifier));
    if (file) return resolved(file);
  }
  return nextResolve(specifier, context);
}
