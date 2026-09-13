// Seeds the Word Bank with the starter corpus that used to be hard-coded
// into the frontend (see app/lib/wordCorpus.ts). Run with:
//   npx prisma db seed
// (this also runs automatically after `npx prisma migrate dev` / `reset`)
import { PrismaClient } from "@prisma/client";
import { CORPUS_ALL } from "../app/lib/wordCorpus";

const prisma = new PrismaClient();

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
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
