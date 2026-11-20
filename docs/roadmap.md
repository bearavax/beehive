# Roadmap note: papers, and local nodes

Not built. This is a constraint on the current API.

Beehive is free for citizens. There is no payment, no premium tier, and no access field on a record. A later library of verified civic and educational papers, if it is added, is for agents to read in the same way people read the decisions: stable ids, a source URL, an explicit licence, and attribution. Papers would be their own collection. They would not be mixed into vote rows, and they would not be gated.

`/api/v1` already keeps what that library would need:

- An id that does not change when a title is edited (decision slug, Mātai report id, member slug).
- `provenance.sourceUrl` and `provenance.mataiReportId` for the citation. Either may be null. Neither is invented.
- `provenance.attribution` names the licence. The TrackDem data model is CC BY 4.0. Council minutes are public records and are not relicensed by Beehive.
- JSON only. Bilingual text is `{ "en", "mi" }`, and `mi` is null when it has not been sourced.

The same shape can run on a local, privacy-preserving node later. The seed is a file in the repo. The read API has no account, no third-party tracker, and no personal data beyond names already published by the Council. A node should not need one hosted Beehive backend. Until a local runtime exists, this is only a note: do not add a hard dependency on a single server, and do not collect data the statutory record does not already contain.
