// Seeds the Word Bank with the starter corpus that used to be hard-coded
// into the frontend (see app/lib/wordCorpus.ts), plus a batch of simulated
// historical usage events so the Assessment 3 dashboard has something
// meaningful to show on a fresh database. Run with:
//   npx prisma db seed
// (this also runs automatically after `npx prisma migrate dev` / `reset`)
import { PrismaClient, type UsageEventType, type ActivityType } from "@prisma/client";
import { CORPUS_ALL } from "../app/lib/wordCorpus";

const prisma = new PrismaClient();

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

// Picks a random moment within the last `days` days — gives the dashboard
// a spread of "recent activity" rather than everything timestamped at once.
function randomPastDate(days: number): Date {
  const now = Date.now();
  const past = now - randomInt(0, days * 24 * 60 * 60 * 1000);
  return new Date(past);
}

const WORDLE_FAILURE_REASONS = ["Missing target word or English word"];
const WORD_SEARCH_FAILURE_REASONS = [
  "No words selected — generated from random corpus words instead",
  "1 of 5 words didn't fit in the grid",
  "2 of 6 words didn't fit in the grid",
];

async function seedUsageEvents() {
  const existingCount = await prisma.usageEvent.count();
  if (existingCount > 0) {
    console.log(`Usage events already present (${existingCount}) — skipping simulated data.`);
    return;
  }

  // Simulated usage, skewed toward Wordle being the more popular builder
  // and generation mostly succeeding — realistic enough to demonstrate
  // every dashboard metric without needing to manually click through the
  // app dozens of times first.
  const events: {
    type: UsageEventType;
    activityType: ActivityType | null;
    durationMs: number | null;
    detail: string | null;
    createdAt: Date;
  }[] = [];

  const GENERATION_ATTEMPTS = 60;
  for (let i = 0; i < GENERATION_ATTEMPTS; i++) {
    const activityType: ActivityType = Math.random() < 0.55 ? "WORDLE" : "WORD_SEARCH";
    const success = Math.random() < 0.85;
    events.push({
      type: success ? "GENERATION_SUCCESS" : "GENERATION_FAILURE",
      activityType,
      durationMs: null,
      detail: success
        ? null
        : pick(activityType === "WORDLE" ? WORDLE_FAILURE_REASONS : WORD_SEARCH_FAILURE_REASONS),
      createdAt: randomPastDate(14),
    });
  }

  const PAGE_VIEWS = 90;
  for (let i = 0; i < PAGE_VIEWS; i++) {
    events.push({
      type: "PAGE_VIEW",
      activityType: Math.random() < 0.55 ? "WORDLE" : "WORD_SEARCH",
      durationMs: randomInt(15_000, 240_000),
      detail: null,
      createdAt: randomPastDate(14),
    });
  }

  await prisma.usageEvent.createMany({ data: events });
  console.log(`Seed complete: ${events.length} simulated usage events created.`);
}

async function main() {
  let created = 0;
  let skipped = 0;

  for (const word of CORPUS_ALL) {
    const phonemesJson = JSON.stringify(word.phonemes);

    const existing = await prisma.word.findUnique({
      where: { english_phonemes: { english: word.english, phonemes: phonemesJson } },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.word.create({
      data: {
        english: word.english,
        phonemes: phonemesJson,
        difficulty: word.phonemes.length,
        source: "corpus",
      },
    });
    created++;
  }

  console.log(`Seed complete: ${created} words created, ${skipped} already present.`);

  await seedUsageEvents();
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
