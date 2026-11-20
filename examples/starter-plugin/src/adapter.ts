import type { AdapterQuery, ApiMeeting, ApiDecisionSummary, ApiVote, CouncilAdapter } from "@/lib/sdk/adapter";
import type { PluginManifest } from "@/lib/sdk/manifest";
import manifestJson from "../beehive-plugin.json";

/**
 * Hackathon starter. Every method returns an empty list or null.
 * Do not fill these with example votes, example councillors, or example resolutions.
 * When a field is not in your source, leave it null.
 */
export const starterAdapter: CouncilAdapter = {
  manifest: manifestJson as PluginManifest,
  async fetchMeetings(_query?: AdapterQuery): Promise<ApiMeeting[]> {
    return [];
  },
  async fetchDecisions(_query?: AdapterQuery): Promise<ApiDecisionSummary[]> {
    return [];
  },
  async fetchVotes(_decisionId: string): Promise<ApiVote[] | null> {
    return null;
  },
};
