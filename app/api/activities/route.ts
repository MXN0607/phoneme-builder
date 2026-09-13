import { NextRequest } from "next/server";
import { jsonOk, jsonError, validationError, handleApiError } from "@/app/lib/api-response";
import { activityInputSchema } from "@/app/lib/validation";
import { listActivities, createActivity } from "@/app/lib/activities-service";

// GET /api/activities?type=WORDLE
// Lists saved activities, most recently updated first.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    if (typeParam && typeParam !== "WORDLE" && typeParam !== "WORD_SEARCH") {
      return jsonError(400, "type must be WORDLE or WORD_SEARCH");
    }

    const type = typeParam as "WORDLE" | "WORD_SEARCH" | null;
    const activities = await listActivities({ type: type ?? undefined });
    return jsonOk(activities);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/activities
// Saves a Wordle or Word Search configuration. Body shape:
// {
//   type: "WORDLE" | "WORD_SEARCH",
//   title, showHints, numGuesses? | rows?+cols?,
//   theme, layout, size,
//   words: Array<{ id: string } | { english, phonemes, source? }>
// }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (body === null) {
      return jsonError(400, "Request body must be valid JSON");
    }

    const parsed = activityInputSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const activity = await createActivity(parsed.data);
    return jsonOk(activity, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
