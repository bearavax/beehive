import wccManifestJson from "@/plugins/wcc/beehive-plugin.json";
import type { AdapterQuery, ApiVote, CouncilAdapter } from "@/lib/sdk/adapter";
import { validatePluginManifest } from "@/lib/sdk/manifest";
import { listDecisions, listMeetings, votesFor } from "@/lib/sdk/wcc-catalog";

const validated = validatePluginManifest(wccManifestJson);
if (!validated.ok) {
  throw new Error(`Wellington adapter manifest is invalid: ${validated.errors.join("; ")}`);
}

export const wellingtonManifest = validated.manifest;

export const wellingtonAdapter: CouncilAdapter = {
  manifest: wellingtonManifest,
  fetchMeetings(query?: AdapterQuery) {
    return Promise.resolve(listMeetings(query));
  },
  fetchDecisions(query?: AdapterQuery) {
    return Promise.resolve(listDecisions(query));
  },
  fetchVotes(decisionId: string): Promise<ApiVote[] | null> {
    return Promise.resolve(votesFor(decisionId));
  },
};
