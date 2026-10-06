import { prisma } from "./prisma";
import type { UsageEventInput } from "./validation";

export async function logUsageEvent(input: UsageEventInput) {
  return prisma.usageEvent.create({
    data: {
      type: input.type,
      activityType: input.activityType,
      durationMs: input.durationMs,
      detail: input.detail,
    },
  });
}

export type DashboardMetrics = {
  activityCounts: { WORDLE: number; WORD_SEARCH: number };
  wordBankCount: number;
  generation: {
    successCount: number;
    failureCount: number;
    // successCount / (successCount + failureCount), or null if there have
    // been no generation attempts at all yet.
    successRate: number | null;
  };
  mostUsedType: "WORDLE" | "WORD_SEARCH" | null;
  averageTimeOnPageMs: number | null;
  recentFailures: Array<{
    id: string;
    activityType: string | null;
    detail: string | null;
    createdAt: Date;
  }>;
};

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [
    wordleCount,
    wordSearchCount,
    wordBankCount,
    successCount,
    failureCount,
    durationAgg,
    recentFailures,
    generationsByType,
  ] = await Promise.all([
    prisma.activity.count({ where: { type: "WORDLE" } }),
    prisma.activity.count({ where: { type: "WORD_SEARCH" } }),
    prisma.word.count(),
    prisma.usageEvent.count({ where: { type: "GENERATION_SUCCESS" } }),
    prisma.usageEvent.count({ where: { type: "GENERATION_FAILURE" } }),
    prisma.usageEvent.aggregate({
      where: { type: "PAGE_VIEW" },
      _avg: { durationMs: true },
    }),
    prisma.usageEvent.findMany({
      where: { type: "GENERATION_FAILURE" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, activityType: true, detail: true, createdAt: true },
    }),
    prisma.usageEvent.groupBy({
      by: ["activityType"],
      where: {
        type: { in: ["GENERATION_SUCCESS", "GENERATION_FAILURE"] },
        activityType: { not: null },
      },
      _count: { _all: true },
    }),
  ]);

  // "Most-used" reflects actual generation attempts (how much each builder
  // is actually being used), not how many Activities happen to be saved.
  let mostUsedType: "WORDLE" | "WORD_SEARCH" | null = null;
  let topCount = 0;
  for (const row of generationsByType) {
    if (row.activityType && row._count._all > topCount) {
      mostUsedType = row.activityType as "WORDLE" | "WORD_SEARCH";
      topCount = row._count._all;
    }
  }

  const totalAttempts = successCount + failureCount;

  return {
    activityCounts: { WORDLE: wordleCount, WORD_SEARCH: wordSearchCount },
    wordBankCount,
    generation: {
      successCount,
      failureCount,
      successRate: totalAttempts > 0 ? successCount / totalAttempts : null,
    },
    mostUsedType,
    averageTimeOnPageMs: durationAgg._avg.durationMs,
    recentFailures,
  };
}
