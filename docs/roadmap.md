# Roadmap note: a library agents can read

Not built. This is a constraint on the current API so a later library does not have to break it.

Beehive may host verified civic and educational papers that agents read as premium, agent-readable knowledge. Council decisions stay the statutory record. Papers would be a separate collection, with their own ids, and would not be mixed into vote rows.

What the current `/api/v1` records already keep stable:

- An id that does not change when a title is edited (`slug`, Mātai report id, member slug).
- `provenance.sourceUrl` and `provenance.mataiReportId` for the citation. Either may be null. Neither is invented.
- `provenance.attribution` names the licence. The TrackDem data model is CC BY 4.0. Council minutes are public records and are not relicensed by Beehive.
- `provenance.access` is `"public"` on every record served today. A future tier would be another string on this same field. Nothing in the API checks a key, sells access, or hides a record.
- JSON only. Bilingual text is `{ "en", "mi" }`, and `mi` is null when it has not been sourced.

A paper, when one exists, should carry the same provenance shape: stable id, source URL, explicit licence, attribution, and `access`. Until that collection exists, `/api/v1` does not grow a papers route.
