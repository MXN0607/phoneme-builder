# Phoneme Activity Builder

A Next.js web app that lets Speech Pathology teachers build phoneme-based
Wordle and Word Search activities for classroom use, print/download them as
standalone HTML files, and (as of Assessment 2) manage a reusable word bank
and save activity configurations to a database.

- **Assessment 1** — frontend builder, in-browser preview, and standalone
  HTML export for both activity types.
- **Assessment 2** — backend + database layer: a Prisma/SQLite-backed word
  bank with full CRUD, saved activity configurations, and a REST API that
  the builder pages now read from and write to.

## Tech stack

- **Next.js 16** (App Router) / **React 19**
- **Prisma 6** + **SQLite** for persistence
- **Zod** for request validation
- Plain CSS custom properties for theming (light/dark/OLED) — no component
  library

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
  settings/page.tsx          Theme, layout, size preferences (cookies)
  about/page.tsx             Project write-up + demo video
  health/route.ts            GET /health — liveness + DB check

  api/
    words/route.ts           GET (list, filterable), POST (create)
    words/[id]/route.ts      GET, PATCH, DELETE
    activities/route.ts      GET (list, filterable), POST (create)
    activities/[id]/route.ts GET, PATCH, DELETE

  lib/
    prisma.ts                PrismaClient singleton
    validation.ts             Zod schemas for words + activities
    words-service.ts          Word CRUD + phoneme JSON encode/decode
    activities-service.ts     Activity CRUD, word linking/ordering
    api-response.ts           Shared JSON response + error helpers
    types.ts                  Frontend-facing TS types (WordRecord, etc.)
    wordCorpus.ts              Built-in starter word list (also the seed source)
    download.ts / preferences.ts   Unchanged from Assessment 1

prisma/
  schema.prisma               Database schema (see below)
  seed.ts                     Seeds the word bank from wordCorpus.ts
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
