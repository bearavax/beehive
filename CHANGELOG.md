# Changelog

## Unreleased

- Term dates are full days from a public source. A month is not extended to the 31st. Tony Randle's page leaves off meetings from 8 August 2026. 8 and 9 August are not marked Not recorded, because no source names one of those days. The minutes extractor is pypdf 7.1.1. The 30 October 2025 Council file stays over the size cap and is not shown as read.

### Changed

- `GET /api/v1/members/:id` no longer returns a vote score. `record.namedDivisions`, `record.withMajority`, `record.againstMajority`, and `record.notVoting` were counts. They compared a person with the majority. That field is now a deprecated stub: `record.deprecated` is true, the counts are null, and `record.decisions` is an empty array. Read votes at `minutesVotes.href` (`GET /api/v1/members/:id/votes`). The stub will be removed in the next release.
- `ApiVote.abstain`, `ApiVote.absent`, and `ApiVote.conflictOfInterest` are `string[] | null` instead of the literal `null`. `null` still means that list was not in the source. An empty array means the source listed nobody. Older clients that treated the field as always `null` should accept either.

### Added

- Councillor pages omit divisions held outside `since` and `until`. Those rows are `not-in-office` in the API and are not shown as a vote. `not-recorded` is only used when the person held office and the minutes did not name them.
