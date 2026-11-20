/**
 * beehive-plugin.json spec 1.0.0
 *
 * A plug-in may only request read scopes. Community plug-ins are badged
 * separately from statutory council records, even if a manifest asks otherwise.
 */

export const PLUGIN_SPEC_VERSION = "1.0.0";

export const READ_SCOPES = [
  "meetings:read",
  "decisions:read",
  "votes:read",
  "members:read",
  "issues:read",
  "committees:read",
] as const;

export const UI_SLOTS = ["feed.notice", "decision.aside", "directory.note", "plugins.card"] as const;

export type ReadScope = (typeof READ_SCOPES)[number];
export type UiSlot = (typeof UI_SLOTS)[number];
export type PluginKind = "statutory-adapter" | "community";

export type BilingualField = {
  en: string;
  mi: string | null;
};

export type PluginManifest = {
  specVersion: typeof PLUGIN_SPEC_VERSION;
  id: string;
  kind: PluginKind;
  name: BilingualField;
  summary: BilingualField;
  maintainer: {
    name: string;
    url: string | null;
  };
  license: string;
  scopes: ReadScope[];
  uiSlot: UiSlot | null;
  citationLock: true;
  council: BilingualField | null;
};

export type ManifestResult = { ok: true; manifest: PluginManifest } | { ok: false; errors: string[] };

const ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function bilingual(value: unknown, path: string, errors: string[], allowNullMi: boolean): BilingualField | null {
  if (!isObject(value)) {
    errors.push(`${path} must be an object with en and mi`);
    return null;
  }
  if (typeof value.en !== "string" || value.en.trim().length === 0) {
    errors.push(`${path}.en must be a non-empty string`);
  }
  if (value.mi !== null && typeof value.mi !== "string") {
    errors.push(`${path}.mi must be a string or null`);
  }
  if (typeof value.mi === "string" && value.mi.trim().length === 0 && !allowNullMi) {
    errors.push(`${path}.mi is empty. Use null when te reo Māori has not been sourced.`);
  }
  return {
    en: typeof value.en === "string" ? value.en.trim() : "",
    mi: typeof value.mi === "string" && value.mi.trim().length > 0 ? value.mi.trim() : null,
  };
}

export function validatePluginManifest(input: unknown): ManifestResult {
  const errors: string[] = [];
  if (!isObject(input)) {
    return { ok: false, errors: ["Manifest must be a JSON object"] };
  }

  if (input.specVersion !== PLUGIN_SPEC_VERSION) {
    errors.push(`specVersion must be ${PLUGIN_SPEC_VERSION}`);
  }
  if (typeof input.id !== "string" || !ID_PATTERN.test(input.id)) {
    errors.push("id must be lowercase letters, numbers, dots, or hyphens");
  }
  if (input.kind !== "statutory-adapter" && input.kind !== "community") {
    errors.push('kind must be "statutory-adapter" or "community"');
  }

  const name = bilingual(input.name, "name", errors, false);
  const summary = bilingual(input.summary, "summary", errors, true);

  if (!isObject(input.maintainer) || typeof input.maintainer.name !== "string" || input.maintainer.name.trim().length === 0) {
    errors.push("maintainer.name is required");
  }
  if (isObject(input.maintainer) && input.maintainer.url !== null && typeof input.maintainer.url !== "string") {
    errors.push("maintainer.url must be a string or null");
  }
  if (typeof input.maintainer === "object" && input.maintainer && typeof (input.maintainer as { url?: unknown }).url === "string") {
    const url = (input.maintainer as { url: string }).url;
    if (!/^https?:\/\//.test(url)) errors.push("maintainer.url must be an http(s) URL");
  }

  if (typeof input.license !== "string" || input.license.trim().length === 0) {
    errors.push("license is required so users can see who may reuse the plug-in");
  }

  if (!Array.isArray(input.scopes) || input.scopes.length === 0) {
    errors.push("scopes must list at least one read scope");
  } else {
    for (const scope of input.scopes) {
      if (typeof scope !== "string" || !(READ_SCOPES as readonly string[]).includes(scope)) {
        errors.push(`scope "${String(scope)}" is not a public read scope`);
      }
      if (typeof scope === "string" && /write|delete|admin|staff/i.test(scope)) {
        errors.push(`scope "${scope}" is rejected. Plug-ins are read-only.`);
      }
    }
  }

  if (input.uiSlot !== null && (typeof input.uiSlot !== "string" || !(UI_SLOTS as readonly string[]).includes(input.uiSlot))) {
    errors.push("uiSlot must be null or one of feed.notice, decision.aside, directory.note, plugins.card");
  }

  if (input.citationLock !== true) {
    errors.push("citationLock must be true. A plug-in may not show decision text it cannot cite.");
  }

  let council: BilingualField | null = null;
  if (input.kind === "statutory-adapter") {
    council = bilingual(input.council, "council", errors, true);
  } else if (input.council !== null && input.council !== undefined) {
    errors.push("community plug-ins must set council to null. They are not the statutory record.");
  }

  if (errors.length > 0 || !name || !summary) {
    return { ok: false, errors };
  }

  const scopes = (input.scopes as string[]).filter((scope): scope is ReadScope =>
    (READ_SCOPES as readonly string[]).includes(scope),
  );

  return {
    ok: true,
    manifest: {
      specVersion: PLUGIN_SPEC_VERSION,
      id: String(input.id),
      kind: input.kind as PluginKind,
      name,
      summary,
      maintainer: {
        name: String((input.maintainer as { name: string }).name).trim(),
        url: typeof (input.maintainer as { url?: unknown }).url === "string" ? (input.maintainer as { url: string }).url : null,
      },
      license: String(input.license).trim(),
      scopes,
      uiSlot: (input.uiSlot ?? null) as UiSlot | null,
      citationLock: true,
      council,
    },
  };
}

/** Core decides the badge. A community file cannot promote itself to the statutory record. */
export function pluginBadge(kind: PluginKind, trust: "core" | "example"): "statutory-record" | "community-plugin" {
  if (trust === "core" && kind === "statutory-adapter") return "statutory-record";
  return "community-plugin";
}
