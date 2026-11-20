# Beehive plug-in contract

Version `1.0.0`. This is the May 2027 hackathon surface. Builders add a plug-in. They do not edit Beehive core.

## Read API

`GET /api/v1` lists the resources. All responses are JSON, `Cache-Control: public`, and allow cross-origin GET.

| Path | What it returns |
| --- | --- |
| `/api/v1/decisions` | Published reports. Filter with `body`, `issue`, `from`, `to`. Page with `limit` (max 100) and `offset`. |
| `/api/v1/decisions/{slug}` | One report, its clauses, and documents. A numeric Mātai Manapori report id also resolves. |
| `/api/v1/decisions/{slug}/votes` | Clause votes from that report. |
| `/api/v1/members` | Mayor, ward councillors, the former councillor needed to name earlier votes, and Tākai Here Pouiwi. |
| `/api/v1/members/{slug}` | One person. |
| `/api/v1/issues` | Editorial threads. `editorial` is true. The decisions they point at carry the citations. |
| `/api/v1/issues/{slug}` | One thread. |
| `/api/v1/committees` | Bodies, including whether Pouiwi vote. |
| `/api/v1/committees/{id}` | One body. |
| `/api/v1/meetings` | Meetings grouped from the seeded reports. `mataiMeetingId` is null. This seed has no Mātai meeting id. |

Unknown ids return `404` with `{ "error": "not_found" }`. A bad `limit` returns `400`.

Every record has `provenance`:

- `sourceUrl` — the public page or PDF this row came from, or null.
- `mataiReportId` — the Mātai Manapori report id, or null when the row is not a report.
- `attribution.dataModel` — the TrackDem data model (beta v0.1, February 2025), **CC BY 4.0**.
- `attribution.records` — Te Kaunihera o Pōneke public records. Beehive does not relicense them.

Bilingual fields are `{ "en": "...", "mi": "..." }` or `"mi": null` when te reo has not been sourced. Vote rows leave `abstain`, `absent`, and `conflictOfInterest` null. Empty `for` / `against` arrays mean the export did not name the division.

Plain-language layers appear only when Beehive has written them. `statutoryRecord` on those layers is false. The clauses are the cited text.

## Manifest

A plug-in ships `beehive-plugin.json`. `scripts/validate-plugins.ts` checks it (`npm run plugins:check`).

Required:

- `specVersion`: `"1.0.0"`
- `id`: lowercase, dots and hyphens allowed
- `kind`: `statutory-adapter` or `community`
- `name.en`, and `name.mi` or `null`
- `summary`
- `maintainer.name` and an optional URL
- `license`
- `scopes`: one or more of `meetings:read`, `decisions:read`, `votes:read`, `members:read`, `issues:read`, `committees:read`
- `uiSlot`: `feed.notice`, `decision.aside`, `directory.note`, `plugins.card`, or `null`
- `citationLock`: `true`
- `council`: required for a statutory adapter, `null` for a community plug-in

Write scopes are rejected. A community manifest cannot set `council`.

## Badge

The register at `/plugins` badges `nz.wcc.matai-manapori` as **Statutory record** because core ships it. Every other manifest, including one that claims `statutory-adapter`, is badged **Community plug-in**.

## CouncilAdapter

```ts
interface CouncilAdapter {
  readonly manifest: PluginManifest;
  fetchMeetings(query?): Promise<ApiMeeting[]>;
  fetchDecisions(query?): Promise<ApiDecisionSummary[]>;
  fetchVotes(decisionId: string): Promise<ApiVote[] | null>;
}
```

`fetchVotes` returns `null` when the id is unknown. It returns the real arrays when the source named them. It does not invent the rest.

Wellington’s adapter is `src/lib/sdk/wcc.ts`. It reads the seeded Mātai Manapori file. It does not call staff or write endpoints.

## Te Tiriti o Waitangi

Pouiwi are partners in the member payload (`role: "pouiwi"`), not ward councillors. Committee records say whether they vote on that body. A plug-in that displays their votes must cite the same clause the adapter returns. Do not add a full-Council vote for Pouiwi. The terms of reference say they may attend and speak there, and they do not vote.
