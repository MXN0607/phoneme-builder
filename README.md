# Phoneme Activity Builder

**GitHub repository:** https://github.com/MXN0607/phoneme-builder

A Next.js web app that lets Speech Pathology teachers build phoneme-based
Wordle and Word Search activities for classroom use, print/download them as
standalone HTML files, manage a reusable word bank and saved activity
configurations in a database, and (as of Assessment 3) monitor usage
through a live operational dashboard.

- **Assessment 1** — frontend builder, in-browser preview, and standalone
  HTML export for both activity types.
- **Assessment 2** — backend + database layer: a Prisma/SQLite-backed word
  bank with full CRUD, saved activity configurations, a REST API, and
  Docker containerization.
- **Assessment 3** — data-driven dashboard, usage/observability tracking,
  simulated historical data, Playwright end-to-end tests, a JMeter load
  test plan, and an accessibility pass ahead of Lighthouse auditing.

## Tech stack

- **Next.js 16** (App Router) / **React 19**
- **Prisma 6** + **SQLite** for persistence
- **Zod** for request validation
- **Playwright** for end-to-end testing; **JMeter** for load testing;
  **Lighthouse** for accessibility auditing
- Plain CSS custom properties for theming (light/dark/OLED) — no component
  library
- **Docker** — multi-stage build, runs migrations + seeding on container
  start (see [Running with Docker](#running-with-docker))

## Getting started

```bash
npm install                 # also runs `prisma generate` (postinstall)
cp .env.example .env        # sets DATABASE_URL to a local SQLite file
npx prisma migrate dev      # creates prisma/dev.db and applies the schema,
                             # then seeds the starter word bank automatically
npm run dev                 # http://localhost:3000
```

If you ever need to reseed without a fresh migration:

```bash
npm run db:seed
```

To inspect the database directly:

```bash
npm run db:studio
```

## Project structure

```
app/
  wordle/page.tsx            Wordle builder (corpus + DB word bank + save)
  word-search/page.tsx       Word Search builder (same)
  words/page.tsx             Word Bank — CRUD UI for the word list
  activities/page.tsx        Saved Activities — list / open / delete
  dashboard/page.tsx         Assessment 3: operational dashboard
  settings/page.tsx          Theme, layout, size preferences (cookies)
  about/page.tsx             Project write-up + demo video
  health/route.ts            GET /health — liveness + DB check

  api/
    words/route.ts           GET (list, filterable), POST (create)
    words/[id]/route.ts      GET, PATCH, DELETE
    activities/route.ts      GET (list, filterable), POST (create)
    activities/[id]/route.ts GET, PATCH, DELETE
    metrics/events/route.ts  POST — log a generation/page-view event
    metrics/dashboard/route.ts  GET — aggregated dashboard metrics

  lib/
    prisma.ts                PrismaClient singleton
    validation.ts             Zod schemas for words + activities + events
    words-service.ts          Word CRUD + phoneme JSON encode/decode
    activities-service.ts     Activity CRUD, word linking/ordering
    metrics-service.ts        Event logging + dashboard aggregation queries
    metrics-client.ts         Client-side: page-view tracking hook + event logger
    api-response.ts           Shared JSON response + error helpers
    types.ts                  Frontend-facing TS types (WordRecord, etc.)
    wordCorpus.ts              Built-in starter word list (also the seed source)
    download.ts / preferences.ts   Unchanged from Assessment 1

prisma/
  schema.prisma               Database schema (see below)
  seed.ts                     Seeds the word bank + simulated usage events

e2e/
  word-bank-crud.spec.ts      Playwright: builder CRUD use case
  wordle-preview.spec.ts      Playwright: user generation/preview use case

jmeter/
  phoneme-builder-load-test.jmx   Staged load test (x1 through x10000)
```

## Database schema

Three models, all in `prisma/schema.prisma`:

- **`Word`** — a single phoneme-based word: `english`, `phonemes`,
  `difficulty` (phoneme count), `source` ("corpus" or "custom").
  `phonemes` is stored as a **JSON-encoded array of strings**
  (e.g. `["tʃ","ɪ","n"]`) rather than one column per character, because
  SQLite has no native array type *and* individual phonemes can be more
  than one character wide (`tʃ`, `əʉ`, `ɜː`, …) — splitting on character
  boundaries would break them apart. A unique constraint on
  `(english, phonemes)` prevents exact duplicates.

- **`Activity`** — a saved Wordle or Word Search configuration: `type`,
  `title`, `showHints`, `numGuesses` (Wordle) or `rows`/`cols` (Word
  Search), plus a `theme`/`layout`/`size` snapshot so a saved activity
  regenerates looking the way it did when saved.

- **`ActivityWord`** — join table linking an `Activity` to its `Word`(s),
  with a `position` column to preserve order. A Wordle activity has exactly
  one row; a Word Search activity has two or more. Deleting an `Activity`
  or a `Word` cascades to the relevant `ActivityWord` rows.

- **`UsageEvent`** *(Assessment 3)* — one flexible event log rather than a
  separate table per metric: `type` (`GENERATION_SUCCESS` |
  `GENERATION_FAILURE` | `PAGE_VIEW`), an optional `activityType`,
  `durationMs` (for page views), and a `detail` string (the failure reason,
  shown in the dashboard's alerts feed). Every dashboard number — success
  counts, failure counts, average time on page, most-used builder — is just
  an aggregation over this one table.

## API

All endpoints return JSON. Errors follow `{ error: string, details?: ... }`
with an appropriate status code (400 validation, 404 not found, 409
conflict, 500 server error).

| Method | Path                  | Description                                             |
|--------|-----------------------|-----------------------------------------------------------|
| GET    | `/health`             | Liveness + DB connectivity check                          |
| GET    | `/api/words`          | List words. Query params: `difficulty`, `search`          |
| POST   | `/api/words`          | Create a word — `{ english, phonemes: string[], source? }`|
| GET    | `/api/words/:id`      | Get one word                                               |
| PATCH  | `/api/words/:id`      | Update a word (partial body)                               |
| DELETE | `/api/words/:id`      | Delete a word (cascades to any activities using it)        |
| GET    | `/api/activities`     | List activities. Query param: `type` (`WORDLE`\|`WORD_SEARCH`) |
| POST   | `/api/activities`     | Save a new activity (see shape below)                      |
| GET    | `/api/activities/:id` | Get one activity, including its ordered word list          |
| PATCH  | `/api/activities/:id` | Update an activity (partial body, re-validated as a whole) |
| DELETE | `/api/activities/:id` | Delete an activity                                          |
| POST   | `/api/metrics/events` | Log a usage event (generation success/failure, page view)  |
| GET    | `/api/metrics/dashboard` | Aggregated stats for the `/dashboard` page               |

**Activity request body:**

```jsonc
{
  "type": "WORDLE",              // or "WORD_SEARCH"
  "title": "Chin",
  "showHints": true,
  "numGuesses": 6,                // WORDLE only
  // "rows": 10, "cols": 10,      // WORD_SEARCH only
  "theme": "light",
  "layout": "comfortable",
  "size": "medium",
  "words": [
    { "english": "chin", "phonemes": ["tʃ", "ɪ", "n"] }
    // or reference an existing Word Bank entry: { "id": "clx..." }
  ]
}
```

Each entry in `words` is either a reference to an existing Word Bank entry
(`{ id }`) or a brand-new word, which gets upserted into the Word Bank so
it's reusable in future activities too. A `WORDLE` activity must have
exactly one word and a `numGuesses`; a `WORD_SEARCH` activity must have at
least two words and `rows`/`cols`. Both the initial `POST` and any `PATCH`
are validated against this shape (a `PATCH` is merged onto the existing
activity and the *merged* result is re-validated, so it can't end up
half-updated in an inconsistent state).

## Validation & error handling

Every write endpoint validates its body with a Zod schema
(`app/lib/validation.ts`) before touching the database — malformed input
(empty word, whitespace inside a phoneme symbol, a Wordle activity with two
words, etc.) is rejected with a `400` and a field-by-field message list
rather than reaching Prisma. Known Prisma errors (unique constraint clashes,
"record not found" on update/delete) are mapped to `409`/`404` in
`app/lib/api-response.ts`; anything unexpected falls back to a logged `500`.

## Dashboard, observability & simulated data (Assessment 3)

The `/dashboard` page gives an operational view of the whole app:

- A **health banner**, backed by `/health` (DB connectivity check).
- **Stat cards**: total/Wordle/Word Search activity counts, word bank size,
  most-used builder type, average time on page, and generation
  success/failure counts with a success rate.
- An **alerts feed** listing the most recent failed generations with their
  actual reason (see below), so problems are visible without reading logs.

**What counts as a "failure" is grounded in real conditions already in the
code**, not fabricated for the sake of having error states:
- *Wordle*: clicking Generate without both a phoneme word and an English
  word.
- *Word Search*: clicking Generate with nothing selected (the app falls
  back to a random 5-word puzzle so the person isn't blocked — but the
  fallback itself is logged as a failure), or when some words don't fit in
  the grid after 100 placement attempts and get silently dropped.

**Simulated input records:** `prisma/seed.ts` inserts ~150 historical
`UsageEvent` rows (a realistic mix of page views and generation attempts,
skewed toward Wordle and an ~85% success rate) spread across the last two
weeks, so the dashboard has meaningful data immediately rather than
starting empty. It skips this step if events already exist, so re-running
the seed command is always safe.

**Real-time tracking**, layered on top of that simulated baseline:
`app/lib/metrics-client.ts` logs a `GENERATION_SUCCESS`/`GENERATION_FAILURE`
event every time Generate is clicked in either builder, and a
`useTrackPageView` hook reports how long each builder page stayed open
(via `visibilitychange`/`pagehide`, using `navigator.sendBeacon` so the
report survives the tab actually closing). Both are intentionally simple,
best-effort instrumentation — a crashed tab won't always report — rather
than a full analytics implementation.

## Testing

### Playwright (end-to-end)

```bash
npx playwright install chromium   # first time only — downloads the browser
npm run test:e2e                  # headless
npm run test:e2e:ui               # interactive UI mode
```

Two tests, covering both required use cases:
- **`e2e/word-bank-crud.spec.ts`** — a builder use case: full Create, Read,
  Update, Delete on a Word Bank entry via the `/words` page.
- **`e2e/wordle-preview.spec.ts`** — a user use case: entering a word in
  the Wordle builder and previewing the generated activity.

`playwright.config.ts` starts `npm run dev` automatically if it isn't
already running, so there's no need to start the server by hand first.

### JMeter (load testing)

Open `jmeter/phoneme-builder-load-test.jmx` in the JMeter GUI (or run
headless with `jmeter -n -t ...`). The app needs to already be running
(`npm run dev` or the Docker container) at `localhost:3000`.

It contains **five Thread Groups — x1, x10, x100, x1000, x10000 — but only
one is enabled at a time.** Run them one at a time: enable a group
(right-click → Enable), disable the previous one, run, record the
Aggregate Report's throughput/average response time/error %, then move to
the next. Ramp-up time scales with thread count so JMeter doesn't try to
fire thousands of requests in the same instant.

**Expect the higher tiers to fail hard** — `npm run dev` (or even a Docker
container on a laptop) buckling under 1,000–10,000 concurrent users is the
expected, realistic result, not a broken test. That degradation curve
*is* the finding: note where response times start climbing and where
errors start appearing, and explain it in terms of what's actually
happening (a single dev server process, a single SQLite file, no
connection pooling at that scale) rather than treating it as something to
fix.

### Lighthouse (accessibility)

In Chrome: open the app, DevTools (F12) → Lighthouse tab → check
"Accessibility" → Analyze page load. Run it against a few key pages
(`/`, `/wordle`, `/word-search`, `/words`, `/dashboard`) since scores can
differ per page.

Before this was run, a pass was made through the codebase fixing the
common, predictable Lighthouse accessibility failures rather than waiting
to discover them: every form input now has a real accessible label (via
`<label>` or `aria-label`, not just a `placeholder`, which Lighthouse
doesn't count as a label), heading levels are sequential, and the
`<html>` tag declares `lang="en"`.

## Running with Docker

The app is fully containerized: a multi-stage `Dockerfile` builds it, and
the SQLite database lives on a named volume so data survives container
restarts/recreation.

**Easiest — Docker Compose (build + run in one step):**

```bash
docker compose up --build
```

Then open `http://localhost:3000`. On first run this creates the
`phoneme-data` volume, applies migrations, and seeds the starter word bank
and simulated usage data.

**Or plain Docker, if you'd rather not use Compose:**

```bash
docker build -t phoneme-builder .
docker volume create phoneme-data
docker run -p 3000:3000 -v phoneme-data:/app/data phoneme-builder
```

**Verifying the health check:**

```bash
curl http://localhost:3000/health
# {"status":"ok","database":"connected","time":"..."}
```

**Resetting the database** back to just the seeded starter data:

```bash
docker compose down -v
```

**What the container does on every start** (`docker-entrypoint.sh`): runs
`prisma migrate deploy` (applies any pending migrations — a no-op if
already up to date), then `prisma db seed` (skips any word or event batch
that already exists), then starts the Next.js server. All of this is safe
to run repeatedly, so restarting the container never duplicates or wipes
data.
