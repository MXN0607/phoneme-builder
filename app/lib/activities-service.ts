import { prisma } from "./prisma";
import { resolveWordRef, serializeWord } from "./words-service";
import type { ActivityInput, ActivityUpdateInput } from "./validation";
import type { Prisma } from "@prisma/client";

const withWords = {
  words: {
    include: { word: true },
    orderBy: { position: "asc" as const },
  },
} satisfies Prisma.ActivityInclude;

type ActivityWithWords = Prisma.ActivityGetPayload<{ include: typeof withWords }>;

// Flattens the Activity -> ActivityWord -> Word chain into a shape the
// frontend can hand straight to the HTML generators: the join table is an
// implementation detail, so callers just see an ordered list of words.
function serializeActivity(activity: ActivityWithWords) {
  const { words, ...rest } = activity;
  return {
    ...rest,
    words: words
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((link) => serializeWord(link.word)),
  };
}

export async function listActivities(filter?: { type?: "WORDLE" | "WORD_SEARCH" }) {
  const activities = await prisma.activity.findMany({
    where: { type: filter?.type },
    include: withWords,
    orderBy: { updatedAt: "desc" },
  });
  return activities.map(serializeActivity);
}

export async function getActivity(id: string) {
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: withWords,
  });
  return activity ? serializeActivity(activity) : null;
}

export async function createActivity(input: ActivityInput) {
  // Resolve every word reference (existing id, or a brand-new inline word)
  // to a real Word row before opening the transaction, so a typo in an id
  // fails fast with a clear 404 rather than mid-transaction.
  const resolvedWords = await Promise.all(input.words.map(resolveWordRef));

  const activity = await prisma.activity.create({
    data: {
      type: input.type,
      title: input.title,
      showHints: input.showHints,
      numGuesses: input.numGuesses,
      rows: input.rows,
      cols: input.cols,
      theme: input.theme,
      layout: input.layout,
      size: input.size,
      words: {
        create: resolvedWords.map((word, position) => ({
          position,
          wordId: word.id,
        })),
      },
    },
    include: withWords,
  });

  return serializeActivity(activity);
}

export async function updateActivity(id: string, input: ActivityUpdateInput) {
  const resolvedWords = input.words
    ? await Promise.all(input.words.map(resolveWordRef))
    : null;

  const activity = await prisma.$transaction(async (tx) => {
    if (resolvedWords) {
      // Replacing the word list: drop the old links and write fresh ones
      // with clean sequential positions, rather than trying to diff old
      // vs. new (an activity's word list is short, so this is simpler and
      // just as fast).
      await tx.activityWord.deleteMany({ where: { activityId: id } });
    }

    return tx.activity.update({
      where: { id },
      data: {
        type: input.type,
        title: input.title,
        showHints: input.showHints,
        numGuesses: input.numGuesses,
        rows: input.rows,
        cols: input.cols,
        theme: input.theme,
        layout: input.layout,
        size: input.size,
        ...(resolvedWords
          ? {
              words: {
                create: resolvedWords.map((word, position) => ({
                  position,
                  wordId: word.id,
                })),
              },
            }
          : {}),
      },
      include: withWords,
    });
  });

  return serializeActivity(activity);
}

export async function deleteActivity(id: string) {
  await prisma.activity.delete({ where: { id } });
}
