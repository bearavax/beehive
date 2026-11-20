# WCC Mātai Manapori export and API schema

Verified on Friday 20 November 2026, 5:42pm to 5:48pm NZDT (Pacific/Auckland, UTC+13), from live responses at [meetings.wellington.govt.nz](https://meetings.wellington.govt.nz). Methods used: `curl` of HTML and JSON, inspection of Next.js `__NEXT_DATA__` and page bundles, and text extraction of WCC's published data-model PDF. Nothing below is inferred beyond what those responses contained.

The public site is a Next.js app (`x-powered-by: Next.js`, build id at the time of this check: `QrjbRoiiv4VLGA5jnDCO9`). The official product name is **Mātai Manapori (TrackDem)**. The HTML `og:site_name` meta tag is the unmacronned form "Matai Manapori". Council contact shown on committee pages: democracy.services@wcc.govt.nz.

There is **no hosted CSV or XLSX file URL**. The "Download data" dialog on a committee page posts to a JSON API, then the browser builds a CSV or JSON file with `react-csv` / `Blob`. Beehive should call the JSON APIs directly.

## Public read sources to use

All paths below are on `https://meetings.wellington.govt.nz` unless noted.

| Purpose | Method and URL | Request | Observed payload |
| --- | --- | --- | --- |
| Committee data export (meetings, reports, decisions, clause-level votes) | `POST /api/committee/allClauses` | JSON body `{"committeeId":96,"triennium":"2025-2028"}` | JSON array. For committee 96 in 2025-2028: 385 rows, about 1.45 MB, 52 columns including member vote arrays. HTTP 200, `content-type: application/json`. |
| Decision register (implementation tracking, all committees) | `GET /api/clause/getAllClauses` | none | JSON array of 11,175 clause rows, about 13.0 MB. Covers meeting dates 2021-06-02 to 2026-11-12 and trienniums 2019-2022, 2022-2025, and 2025-2028. **No member-level votes.** |
| Same clause list, SSR | `GET /your-council/decision-register-v2` | HTML; `pageProps.allClauses` | Same schema as `getAllClauses`. The older `/your-council/decision-register` page has empty `pageProps` and loads the same API in the browser. |
| Report index | `GET /api/report/all` | none | JSON array of 1,799 reports, about 1.39 MB. **Includes officer email addresses. Do not store or republish them.** |
| Committee catalogue (bilingual names and IDs) | `GET /your-council/committees` or `GET /_next/data/{buildId}/your-council/committees.json` | none | `pageProps.allCommittees`: 36 bodies. |
| One committee, including meetings and member list | `GET /your-council/committees/{id}/{name}` or `GET /_next/data/{buildId}/your-council/committees/{id}/{name}.json` | example: `/your-council/committees/96/City%20Strategy%20and%20Delivery%20Committee` | `pageProps.committeeDetails`. The `_next/data` variant returned HTTP 200 (6,891 bytes) for this example. |
| Meetings calendar (agendas, minutes, additional docs, video) | `GET /your-council/meetings-calendar` or `GET /_next/data/{buildId}/your-council/meetings-calendar.json` | none | `pageProps.allMeetings`: 675 meetings. The `_next/data` variant returned HTTP 200 (682,925 bytes). |
| Action-status field metadata | `GET /api/field/actionStatus` | none | Directus-style field metadata for collection `Original_clauses`, field `Action_status`. Allowed values: `In progress`, `Completed`. |

`{buildId}` changes when WCC deploys. Prefer the stable `/api/*` routes and the HTML pages. Use `_next/data` only if you first read the current build id from the page.

Statutory PDFs and terms of reference live on `https://wellington.govt.nz/-/media/...`. A bare `HEAD` without a browser User-Agent received HTTP 403 from this environment. The same agenda URL returned HTTP 200 `application/pdf` (12,477,276 bytes) with a normal browser User-Agent, with or without a `.pdf` suffix, and with either letter case in the path.

## Do not use for ingestion

These routes appear in the frontend bundles as staff or mutating APIs. They were not called:

- `POST /api/update/*` (`status`, `comment`, `actionAssignee`, `actionApprovalStatus`, `noChangeStatus`, `multipleClauses`, `reportFields`)
- `POST /api/delete/item`
- `POST /api/flow/deleteRedundantClauses`, `POST /api/flow/sendReminderEmail`
- `POST /api/committee/updateCommitteeDetails`
- `GET /api/field/councilStaff` (staff directory, including email addresses)
- `/api/auth`, `/api/auth/signin`, `POST /api/auth/internal-auth`

`POST /api/funnelback/searchReports` with body `{ "keyWords": ... }` exists for on-site search. It was not called here.

WCC's published data model (February 2025, CC BY 4.0) marks Council Staff names and email addresses as **not provided for export**. Despite that, `GET /api/report/all` currently returns emails in `PrimaryReportAuthor`, `AdditionalReportAuthors`, and `ReportAuthorisers` (all 1,799 rows had a primary author email). Beehive must drop those fields and must not scrape `/api/field/councilStaff`.

## Official WCC data model (TrackDem, beta v0.1, February 2025)

Published at [Improving transparency](https://meetings.wellington.govt.nz/your-council/improving-transparency). Verified PDF downloads from `https://trackdem.wellington.govt.nz` (`x-powered-by: Directus`):

- [Data model and definitions](https://trackdem.wellington.govt.nz/assets/ed1061ef-fbb9-4162-ba8e-8c395558b39d?download=) (319,151 bytes)
- [Solution Architecture](https://trackdem.wellington.govt.nz/assets/e29c6fac-3738-4ddc-a673-909f2e22cf44?download=) (177,885 bytes)
- [Features](https://trackdem.wellington.govt.nz/assets/4684e279-839c-4951-8393-8aeb4e24cf7a?download=) (159,745 bytes)
- [Web backend view of a Report](https://trackdem.wellington.govt.nz/assets/8bdde580-38ec-4e07-8850-3ba68ea4f0de?download=) (416,360 bytes)
- [Support Model](https://trackdem.wellington.govt.nz/assets/577e6c58-031d-4ba0-96ab-1e9e6358d259?download=) (127,214 bytes)

Official entities in the data-model PDF: **Council Staff**, **Triennium**, **Committee Names** (English and te reo Māori; names are typically used for one triennium, except Council), **Committee Members**, **Committees**, **Meetings**, **Meeting Documents**, **Reports**, **Original Clauses**, **Amendment Clauses**.

Clause-level vote fields (`Final clause votes`, `Final clause vote result`, amendment mover/seconder, amendment votes and results) are marked **provided for export**. Meeting-level attributes named `Voting file` and `Voting data` are marked **not provided for export**. Beehive should use the clause-level committee export, not any unpublished voting file.

The architecture PDF states that items designated "publicly excluded" are restricted to appropriate council staff and are not available to the public, and that a serverless layer applies public-access filters.

## `POST /api/committee/allClauses` column schema

This is the source behind the committee "Download data" button (CSV or JSON). When the committee name is set, the client sorts rows by `Meeting_date` and writes every JSON key as a CSV column (`react-csv` stringifies arrays). Filename pattern: `{committeeName}.csv` or `{committeeName}.json`.

Verified against the 385-row 2025-2028 Te Hoe Matua | City Strategy and Delivery Committee (`committeeId` 96) export. Column order is the key order in each JSON object. Sentinel empty values observed: `""`, `"-"`, `"- - -"`, and `[]`.

1. `Committee_name` (str): `Te Hoe Matua | City Strategy and Delivery Committee`
2. `Status_of_committee` (str): `Active`
3. `Chair_of_committee` (str): `Councillor Nureddin Abdurahman`
4. `Deputy_chair_of_committee` (str): `Councillor Andrea Compton`
5. `Terms_of_reference_file_name` (str)
6. `Terms_of_reference_file_URL` (str): `https://wellington.govt.nz/-/media/your-council/meetings/tor-2025-2028/2025-11-24-terms-of-reference-and-delegations-2025.pdf#page=14` (HTTP 200 PDF, 581,466 bytes, with a browser User-Agent)
7. `Triennium_of_meeting` (str): `2025-2028`
8. `Meeting_date` (str, not ISO): `03 Dec, 2025`
9. `Meeting_room` (str): `Ngake (16.09)`
10. `Meeting_address` (str): `Level 16 Tahiwi, 113 The Terrace, Wellington`
11. `Agenda_document_name` (str): `2025-12-03 Agenda CSD`
12. `Link_to_meeting_agenda` (str): `https://wellington.govt.nz/-/media/Your-council/meetings/Committees/City-Strategy-and-Delivery-Committee/2025/2025-12-03-Agenda-CSTRAT` (HTTP 200 PDF with a browser User-Agent)
13. `Minutes_document_name` (str)
14. `Link_to_meeting_minutes` (str): same host and path pattern, `.../2025-12-03-Minutes-CSTRAT`
15. `Additional_document_document_name` (list): **empty on all 385 rows**, even where the meetings calendar has extra documents
16. `Link_to_additional_document` (list): **empty on all 385 rows**
17. `Link_to_video_of_meeting` (str): mixed YouTube forms (`/embed/`, `/watch?v=`, `youtu.be`, `youtube.com/live`)
18. `Report_title` (str)
19. `Summary_of_report` (str): officer-report summary, often already in plain English
20. `Link_to_full_report` (str): `https://meetings.wellington.govt.nz/your-council/reports/{reportId}/{title}` (spaces and punctuation may be unencoded)
21. `Public_exclusion` (str): all 385 rows `Not Public Excluded`
22. `Date_released_from_public_excluded` (str): all empty in this sample
23. `Section_of_document` (int)
24. `Section_item_number` (int)
25. `Related_reports` (list of str): 166/385 non-empty, up to 11 titles
26. `Reciprocal_reports` (list of str): 118/385 non-empty, up to 5 titles
27. `Clause_origin` (str): `Recommendation` (294), `Additional` (62), `Amendment` (29)
28. `Change_state` (str): `Original` (269), `-` (62), `Altered` (33), `Additional` (19), `Removed` (2)
29. `Clause_number` (str): e.g. `1.`
30. `Original_clause` (str): the motion or recommendation text
31. `Altered_clause_text` (str): 24/385 non-empty
32. `Member_moved_decision_motion` (str): display name, e.g. `Mayor Andrew Little`
33. `Member_seconded_decision_motion` (str)
34. `Members_voting_for_the_final_clause` (list of str): 295/385 non-empty, length 0 to 18
35. `Members_voting_against_the_final_clause` (list of str): 80/385 non-empty, length 0 to 12
36. `Members_not_voting_on_the_final_clause` (list of str): 72/385 non-empty, length 0 to 5. The export does not distinguish absence from a conflict of interest.
37. `Final_clause_vote_result` (str): `Carried` (352), `-` (29), `Not required` (4)
38. `Amendment_clause_text` (str): 28/385 non-empty
39. `Amendment_change_state` (str): all empty in this sample
40. `Member_moved_amendment` (str): 29/385 real names; otherwise `- - -`
41. `Member_seconded_amendment` (str)
42. `Members_voting_for_the_amendment` (list of str): 29/385 non-empty
43. `Members_voting_against_the_amendment` (list of str): 22/385 non-empty. Observed results include `Lost` (10) as well as `Carried` (19).
44. `Members_not_voting_on_the_amendment` (list of str)
45. `Amendment_vote_result` (str): `-` (356), `Carried` (19), `Lost` (10)
46. `Members_voting_for_the_final_amendment` (list of str)
47. `Members_voting_against_the_final_amendment` (list of str)
48. `Members_not_voting_on_the_final_amendment` (list of str)
49. `Final_amendment_vote_result` (str): `-` (356), `Carried` (18), `Not required` (11)
50. `Approved_action_status` (str): `Completed` (186), `In progress` (184), `-` (15)
51. `Approved_action_update_comment` (str): all `-` in this sample
52. `Approved_action_update_date_time` (str): e.g. `03 Feb, 2026` (250/385 non-empty)

Vote lists are **display names**, not member IDs: `Mayor Andrew Little`, `Deputy Mayor Ben McNulty`, `Councillor …`, `Pouiwi …`.

This 96/2025-2028 export covers 12 meeting dates from 03 Dec, 2025 to 29 Oct, 2026, including a joint sitting labelled `2026-08-19 Joint CSD and RPC Agenda`. Some vote lists include people who are not on this committee's membership list (observed: `Councillor Tony Randle`). Treat joiners from joint meetings as a data-quality case, not as a verified seat.

## `GET /api/clause/getAllClauses` column schema

Flat implementation-tracking view. 11,175 objects, all with the same keys. This is also what the public Decision Register CSV maps from (not the 52-column committee export).

Public unauthenticated Decision Register CSV columns (from the page bundle): `Report_Name`, `Committee_Name`, `Meeting_Date` (`dd MMM, yyyy`), `Decision`, `Comment`, `Status`, `Last_Updated_Date`. Logged-in staff views add assignee and approval columns. This CSV does **not** include votes.

| Field | Type | Notes (from the live 11,175-row file) |
| --- | --- | --- |
| `clauseId` | int | Primary key, e.g. 2501. Present on every row. |
| `committeeId` | int | |
| `committeeName` | str | Often prefixed with the triennium, e.g. `2025-2028 \| Te Hoe Matua \| City Strategy and Delivery Committee` |
| `isActiveCommittee` | bool | 3,839 true / 7,336 false |
| `meetingDate` | str | ISO-like `2021-06-30T09:30:00` |
| `reportName` | str | |
| `reportId` | int | Use with `/your-council/reports/{reportId}/{title}` |
| `isReportPublished` | bool | |
| `primaryReportAuthor` | str | All empty in this file |
| `publicExclusion` | str | `Not Public Excluded` (10,978), `Released from Public Excluded` (197) |
| `isPX` | bool | |
| `clauseNumber` | str | e.g. `1.` |
| `changeState` | str | `Original` (9,176), empty (913), `Additional` (575), `Altered` (486), `Removed` (25) |
| `action` | str | Clause / decision text |
| `actionAssignee` | str | All empty |
| `actionAssigneeId` | int | All 0 |
| `assigneeEmail` | str | All empty |
| `assigneeGroup` | str | All empty |
| `actionUpdateComment` | str | 2,405 non-empty (staff-side; prefer approved fields for public display) |
| `actionUpdateDueDate` | str | Date `YYYY-MM-DD` or empty (4,848 non-empty) |
| `actionUpdateReminderDate` | str | 4,848 non-empty |
| `approvedActionUpdateComment` | str | 1,831 non-empty |
| `actionUpdatedDate` | str | `2024-01-19T09:27:08` or empty |
| `approvedActionUpdatedDate` | str | 6,766 non-empty |
| `actionStatus` | str | `Completed` (10,286), `In progress` (889) |
| `approvedActionStatus` | str | `Completed` (9,461), `In progress` (1,714) |
| `isOriginalClause` | bool | 10,494 true / 681 false |
| `finalClauseVoteResult` | str | **Every row was `Carried`.** Do not treat this file as a complete vote-result source. |
| `actionUpdateStatus` | bool | |
| `actionStatusChangeApproval` | str | `Report Authoriser Approved` (9,977), `Unapproved` (1,198) |
| `isUpdatedAction` | bool | |
| `reportAuthoriserIds` | list | All empty |
| `reportOfTriennium` | str | `2022-2025` (5,532), `2019-2022` (3,366), `2025-2028` (2,277) |

2025-2028 clause counts by `committeeId` in this file:

- 93: Te Taurapa | Council Planning and Finance Committee (648)
- 5: Te Kaunihera o Pōneke | Council (398)
- 96: Te Hoe Matua | City Strategy and Delivery Committee (370)
- 95: Te Takere | Regulatory Processes Committee (359)
- 94: Te Mataaho o te Hapori | Grants Subcommittee (224)
- 98: Te Kura o te Waka | Audit and Risk Committee (121)
- 97: Te Rauawa | Social, Cultural, and Environment Committee (96)
- 11: Wellington Region Waste Management and Minimisation Plan Joint Committee (26)
- 101: Ngā Toki Whakahaere | CCO Review Subcommittee (22) (the source name uses a non-breaking space after `Ngā`)
- 100: Te Urungi Whakatupu Ōhanga | Economic Growth and Development Subcommittee (13)

Row counts need not match `allClauses` (370 vs 385 for committee 96): the committee export can include amendment rows that this flatter file may represent differently.

## Committee catalogue (`allCommittees`)

Each item: `id` (int), `committeeEnglishName` (str), `committeeMaoriName` (str or null), `committeeFullName` (str, typically `{Mi} | {En}`), `isActive` (bool), `focusArea` (str).

Active 2025-2028 bodies (14), as returned:

- 5 Council: Te Kaunihera o Pōneke
- 11 Wellington Region Waste Management and Minimisation Plan Joint Committee (no Māori name)
- 27 Mākara | Ōhāriu Community Board (no separate `committeeMaoriName`)
- 28 Tawa Community Board (no Māori name)
- 31 District Licensing Committee: Te Komiti Raihana ā-Rohe
- 93 Council Planning and Finance Committee: Te Taurapa
- 94 Grants Subcommittee: Te Mataaho o te Hapori
- 95 Regulatory Processes Committee: Te Takere
- 96 City Strategy and Delivery Committee: Te Hoe Matua
- 97 Social, Cultural, and Environment Committee: Te Rauawa
- 98 Audit and Risk Committee: Te Kura o te Waka
- 99 Chief Executive Performance Review Committee: Tumu Whakatere
- 100 Economic Growth and Development Subcommittee: Te Urungi Whakatupu Ōhanga
- 101 CCO Review Subcommittee: Ngā Toki Whakahaere

v1 "committees of the whole" plus full Council, from this list: **5, 93, 96, 97**. Historic (inactive) bodies retain earlier Māori names and IDs 6-10, 12-26, 29-30.

## Committee detail page (`committeeDetails`)

Observed keys on Te Hoe Matua | City Strategy and Delivery Committee (`id` 96): `id`, `committeeEnglishName`, `committeeMaoriName`, `committeeFullName`, `isActive`, `focusArea`, `focusAreaWYSIWYG`, `democracyServiceAdvisor`, `chairOfCommittee`, `chairsOfCommittee`, `deputyChairOfCommittee`, `committeeMembers`, `meetings`, `termsOfReferenceFileName`, `termsOfReferenceFileUrl`, `hasReports`, `trienniums` (`["2025-2028"]`).

`chairOfCommittee` / `deputyChairOfCommittee` shape: `{id, memberName, title}`. On this page both chair and deputy had **`id`: 0**, which is not a reliable key. `committeeMembers` entries used real ids.

Members listed for committee 96 (ids as returned; chair and deputy ids taken as missing):

- Councillor Nureddin Abdurahman, chair (id not usable: 0)
- Councillor Andrea Compton, deputy chair (id not usable: 0)
- 199 Councillor Afnan Al-Rubayee
- 194 Mayor Andrew Little
- 193 Deputy Mayor Ben McNulty
- 51 Councillor Diane Calvert
- 114 Councillor Geordie Rogers
- 295 Councillor Greg O'Connor
- 65 Pouiwi Holden Hohaia
- 197 Councillor Jonny Osborne
- 198 Councillor Karl Tiefenbacher
- 78 Councillor Laurie Foon
- 64 Pouiwi Liz Kelly
- 195 Councillor Matthew Reweti
- 61 Councillor Nicola Young
- 52 Councillor Ray Chung
- 54 Councillor Rebecca Matthews
- 196 Councillor Sam O'Brien

No public elected-member directory or ward-to-member API was found. Scorecards will need a verified ward mapping from another official WCC source, plus a name-to-id join because the vote export uses display names only.

Meetings on this page: `{id, meetingDate, meetingAddress, meetingRoom, meetingDocuments}` where `meetingDocuments` is an array of document ids (e.g. meeting 565: `[1328, 1332, 1334]`). Those ids line up with agenda, minutes, and additional-document ids on the calendar.

## Meetings calendar (`allMeetings`)

675 meetings. Keys: `id`, `meetingDate` (ISO-like), `committeeId`, `committeeEnglishName`, `committeeFullName` (often triennium-prefixed), `status` (bool; 417 true / 258 false; meaning not labelled in the payload), `trienniumOfMeeting`, `meetingLocation`, `hasReports`, `meetingAgenda`, `meetingMinutes`, `additionalDocuments`.

`meetingAgenda`: `{id, publicationStatus, documentName, meetingAgendaUrl}`

`meetingMinutes`: `{id, publicationStatus, documentName, meetingMinutesUrl, meetingVideo}` (video may be absent)

`additionalDocuments`: list of `{id, publicationStatus, documentName, additionalDocumentUrl}`

Example, meeting 565 (CSD, 2025-12-03): agenda id 1328, minutes id 1332, additional document id 1334 `2025-12-03 Q&A CSD` at `https://wellington.govt.nz/-/media/Your-council/meetings/Committees/City-Strategy-and-Delivery-Committee/2025/20251203-QA-CSTRAT`. That Q&A is present here and missing from the committee export's additional-document columns. Prefer the calendar (or committee page document ids plus calendar URLs) for complete source documents. YouTube URLs also differ in form between the two sources for the same meeting (`watch?v=` vs `embed`).

Triennium counts: 2019-2022 (159), 2022-2025 (302), 2025-2028 (214).

## `GET /api/report/all` column schema

1,799 objects. `PublicationStatus` was `Published` on every row (this public endpoint may already filter drafts). `PublicExclusion`: `Not Public Excluded` (1,771), `Released from Public Excluded` (28). `ReportOfTriennium`: 2019-2022 (602), 2022-2025 (880), 2025-2028 (317).

| Field | Type | Notes |
| --- | --- | --- |
| `id` | int | Report id |
| `ReportTitle` | str | |
| `ReportSummary` | str | |
| `PublicationStatus` | str | |
| `PublicExclusion` | str | |
| `MeetingDate` | str | ISO-like |
| `CommitteeFullName` | str | e.g. `Te Kaunihera o Pōneke \| Council` |
| `IsActivedCommittee` | bool | Spelling as returned |
| `TrienniumsOfCommittee` | list of str | Can list several trienniums even when `ReportOfTriennium` is one value |
| `PrimaryReportAuthor` | str | **Email. Redact.** |
| `AdditionalReportAuthors` | list of str | **Emails when present. Redact.** |
| `ReportAuthorisers` | list of str | **Emails. Redact.** |
| `ReportOfTriennium` | str | |

A GET of report page `/your-council/reports/1738/...` returned empty `pageProps`. Report detail is likely filled client-side. No public `/api/report/{id}` path was found in the bundles inspected.

## Recommended Beehive ingestion

1. Load bilingual body names and ids from `/your-council/committees`.
2. For each v1 body (at least 5, 93, 96, 97) and triennium `2025-2028`, `POST /api/committee/allClauses` and treat that as the canonical vote, amendment, recommendation, and receipt export.
3. Join implementation status from `GET /api/clause/getAllClauses` on `clauseId` / report / meeting date, using `approvedActionStatus` and `approvedActionUpdateComment` for public display.
4. Join agendas, minutes, additional documents, and video from the meetings calendar (complete additional-doc coverage).
5. If using `/api/report/all`, drop all author and authoriser fields.
6. Keep `SourceDocuments` as the statutory agenda, minutes, and officer-report URLs. Official minutes remain the legal record.
7. Normalise member votes from display names; do not trust chair `id` 0 from committee detail; persist a manual or officially sourced ward map.
8. Honour public-exclusion flags. Do not attempt to retrieve public-excluded content.
9. Persist source hashes and fetch times. Date formats differ across endpoints (ISO vs `03 Dec, 2025` vs `YYYY-MM-DD`).
10. Be polite: `getAllClauses` is a 13 MB unpaginated payload. Cache it. Do not call staff write APIs.

## Not found

- No official documented public API spec other than the February 2025 PDFs above
- No static Open Data CSV/XLSX host URL
- No public endpoint that returns ward, contact, or elected-member profile data
- No public endpoint that labels a non-vote as "absent" vs "conflict of interest"
- No GraphQL endpoint in the bundles inspected
- Budget or rates impact is not a first-class field; it only appears if present in clause or report text
