import { NextRequest } from "next/server";
import { jsonOk, jsonError, validationError, handleApiError } from "@/app/lib/api-response";
import { usageEventInputSchema } from "@/app/lib/validation";
import { logUsageEvent } from "@/app/lib/metrics-service";

// POST /api/metrics/events
// Logs a single observability event: a successful or failed generation, or
// a page-view duration. Called from the builder pages (see
// app/lib/useTrackPageView.ts and the handleGenerate functions in
// app/wordle/page.tsx and app/word-search/page.tsx) — never by a person
// directly.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (body === null) {
      return jsonError(400, "Request body must be valid JSON");
    }

    const parsed = usageEventInputSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const event = await logUsageEvent(parsed.data);
    return jsonOk(event, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
