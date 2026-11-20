import wccManifestJson from "@/plugins/wcc/beehive-plugin.json";
import { pluginBadge, validatePluginManifest, type PluginManifest } from "@/lib/sdk/manifest";

export type RegisteredPlugin = {
  manifest: PluginManifest;
  trust: "core";
  badge: "statutory-record" | "community-plugin";
};

function load(input: unknown, expect: PluginManifest["kind"]): RegisteredPlugin {
  const result = validatePluginManifest(input);
  if (!result.ok) {
    throw new Error(`Plug-in manifest failed validation: ${result.errors.join("; ")}`);
  }
  if (result.manifest.kind !== expect) {
    throw new Error(`${result.manifest.id} must be kind ${expect}`);
  }
  return { manifest: result.manifest, trust: "core", badge: pluginBadge(result.manifest.kind, "core") };
}

/** Production register. Community plug-ins are not loaded here. They run outside this process. */
export const plugins: RegisteredPlugin[] = [load(wccManifestJson, "statutory-adapter")];

export function pluginById(id: string) {
  return plugins.find((plugin) => plugin.manifest.id === id) ?? null;
}
