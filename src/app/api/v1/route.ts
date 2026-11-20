import { json, options } from "@/lib/api/respond";
import { statutoryAdapter } from "@/lib/sdk/councils";
import { plugins } from "@/plugins/registry";

export function OPTIONS() {
  return options();
}

export function GET() {
  return json({
    council: statutoryAdapter.manifest.council,
    resources: {
      decisions: "/api/v1/decisions",
      members: "/api/v1/members",
      memberVotes: "/api/v1/members/{id}/votes",
      issues: "/api/v1/issues",
      committees: "/api/v1/committees",
      meetings: "/api/v1/meetings",
    },
    plugins: plugins.map((plugin) => ({
      id: plugin.manifest.id,
      kind: plugin.manifest.kind,
      badge: plugin.badge,
      name: plugin.manifest.name,
      scopes: plugin.manifest.scopes,
    })),
  });
}
