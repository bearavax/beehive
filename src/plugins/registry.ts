import starterManifestJson from "../../examples/starter-plugin/beehive-plugin.json";
import wccManifestJson from "@/plugins/wcc/beehive-plugin.json";
import { pluginBadge, validatePluginManifest, type PluginManifest } from "@/lib/sdk/manifest";

export type RegisteredPlugin = {
  manifest: PluginManifest;
  trust: "core" | "example";
  badge: "statutory-record" | "community-plugin";
};

function load(input: unknown, trust: RegisteredPlugin["trust"], expect: PluginManifest["kind"]): RegisteredPlugin {
  const result = validatePluginManifest(input);
  if (!result.ok) {
    throw new Error(`Plug-in manifest failed validation: ${result.errors.join("; ")}`);
  }
  if (result.manifest.kind !== expect) {
    throw new Error(`${result.manifest.id} must be kind ${expect}`);
  }
  return { manifest: result.manifest, trust, badge: pluginBadge(result.manifest.kind, trust) };
}

export const plugins: RegisteredPlugin[] = [
  load(wccManifestJson, "core", "statutory-adapter"),
  load(starterManifestJson, "example", "community"),
];

export function pluginById(id: string) {
  return plugins.find((plugin) => plugin.manifest.id === id) ?? null;
}
