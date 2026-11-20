# Beehive

**Ngā whakataunga o Te Kaunihera o Pōneke.** A bilingual reading of Wellington City Council decisions for the 2025–2028 triennium, for people who live here, organise here, and pay rates here.

Beehive does not invent votes. It reads published Mātai Manapori (TrackDem) records and links the minutes. Official minutes are the statutory record. Tākai Here Pouiwi sit in the directory beside the Mayor and the ward councillors.

## Reo

The site runs in English (`/en`), te reo Māori (`/mi`), or both (`/bi`). `/` redirects using the saved choice, then the browser language, then bilingual. An old `?reo=` link is sent to the matching path. The language standard is [docs/bilingual-standard.md](docs/bilingual-standard.md).

## Develop

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm run lint
npm run build
npm run sync:wcc
```

`sync:wcc` refreshes `src/data/synced/decisions.json` from the public Mātai Manapori read API. It waits between requests, caches responses locally for 12 hours, redacts email addresses, and leaves the seed file untouched when the decisions have not changed. If the service cannot be reached, the script exits without writing. A weekly GitHub Actions workflow (`.github/workflows/sync-wcc.yml`) runs the same script and opens a pull request only when the normalised file changes. That workflow starts once this branch is on the repository’s default branch.

## Data

Verified read APIs on `https://meetings.wellington.govt.nz`:

- `POST /api/committee/allClauses` with `{"committeeId":5|93|96|97,"triennium":"2025-2028"}` for votes
- `GET /api/clause/getAllClauses` for approved implementation status
- `GET /your-council/meetings-calendar` for agendas, minutes, extra documents, and video

The sync does not call staff or write endpoints, and it does not store officer email addresses. The column notes are in [docs/matai-manapori-schema.md](docs/matai-manapori-schema.md).

Routes: `/` decisions, `/decisions/[slug]`, `/councillors`, `/councillors/[slug]`, `/issues`, `/issues/[slug]`, `/about`, `/plugins`.

The public read API is `/api/v1`. The plug-in contract for the May 2027 hackathon is [docs/plugin-sdk.md](docs/plugin-sdk.md). A starter with no sample votes is [examples/starter-plugin](examples/starter-plugin). Check manifests with `npm run plugins:check`.

## Te Tiriti o Waitangi

The Council’s terms of reference record obligations to iwi and Māori under Te Tiriti o Waitangi. Pouiwi are full voting members of the committees they are appointed to. At full Council, Tākai Here representatives may attend and speak, and they do not vote. That limit is stated on the member pages and on the methodology page at `/about`.

## Legacy Express API

The old Express API is archived at `archive/legacy-express`. Nothing in the Next.js app imports it, and CI does not install it. A `.env` from that service was removed from the tree and remains in git history. Rotate the database password and JWT secret. Do not rewrite history until that rotation is confirmed.

A later local node and signed data bundles are described in [docs/static-nodes.md](docs/static-nodes.md). They are not built.

## Stack

Next.js 15, React 19, TypeScript, Tailwind CSS v4.
