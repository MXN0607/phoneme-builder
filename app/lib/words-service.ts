import { prisma } from "./prisma";
import type { Word } from "@prisma/client";
import type { WordInput, WordUpdateInput } from "./validation";

// The DB stores `phonemes` as a JSON-encoded string (SQLite has no native
// array column type — see the comment in schema.prisma). Everywhere outside
// this file, callers should only ever see/send a real string[].
export type SerializedWord = Omit<Word, "phonemes"> & { phonemes: string[] };

export function serializeWord(word: Word): SerializedWord {
  return { ...word, phonemes: JSON.parse(word.phonemes) as string[] };
}

export async function listWords(filter?: { difficulty?: number; search?: string }) {
  const words = await prisma.word.findMany({
    where: {
      difficulty: filter?.difficulty,
      english: filter?.search
        ? { contains: filter.search }
        : undefined,
    },
    orderBy: [{ difficulty: "asc" }, { english: "asc" }],
  });
  return words.map(serializeWord);
}

export async function getWord(id: string) {
  const word = await prisma.word.findUnique({ where: { id } });
  return word ? serializeWord(word) : null;
}

export async function createWord(input: WordInput) {
  const word = await prisma.word.create({
    data: {
      english: input.english,
      phonemes: JSON.stringify(input.phonemes),
      difficulty: input.phonemes.length,
      source: input.source,
    },
  });
  return serializeWord(word);
}

export async function updateWord(id: string, input: WordUpdateInput) {
  const word = await prisma.word.update({
    where: { id },
    data: {
      english: input.english,
      source: input.source,
      ...(input.phonemes
        ? { phonemes: JSON.stringify(input.phonemes), difficulty: input.phonemes.length }
        : {}),
    },
  });
  return serializeWord(word);
}

export async function deleteWord(id: string) {
  await prisma.word.delete({ where: { id } });
}

// Used when saving an Activity: each word in the payload is either a
// reference to an existing Word Bank entry ({ id }), or a brand-new word
// typed straight into the builder. Brand-new words are upserted into the
// Word Bank so future activities can reuse them too — `onConflictDoUpdate`
// isn't available for SQLite composite uniques through Prisma's `upsert`
// shorthand here, so a find-then-create keeps it simple and explicit.
export async function resolveWordRef(
  ref: { id: string } | WordInput
): Promise<Word> {
  if ("id" in ref) {
    const word = await prisma.word.findUniqueOrThrow({ where: { id: ref.id } });
    return word;
  }

  const phonemesJson = JSON.stringify(ref.phonemes);
  const existing = await prisma.word.findUnique({
    where: { english_phonemes: { english: ref.english, phonemes: phonemesJson } },
  });
  if (existing) return existing;

  return prisma.word.create({
    data: {
      english: ref.english,
      phonemes: phonemesJson,
      difficulty: ref.phonemes.length,
      source: ref.source,
    },
  });
}
