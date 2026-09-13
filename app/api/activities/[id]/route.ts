import { NextRequest } from "next/server";
import { jsonOk, jsonError, validationError, handleApiError } from "@/app/lib/api-response";
import { activityInputSchema, activityUpdateSchema } from "@/app/lib/validation";
import { getActivity, updateActivity, deleteActivity } from "@/app/lib/activities-service";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/activities/:id
// Returns the full activity, including its ordered words with phonemes —
// everything the frontend needs to regenerate the Wordle/Word Search HTML.
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const activity = await getActivity(id);
    if (!activity) return jsonError(404, "Activity not found");
    return jsonOk(activity);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/activities/:id
// Accepts a partial update. Because Wordle/Word Search have different
// required fields (numGuesses vs. rows+cols, 1 word vs. 2+ words), the
// partial payload is merged onto the existing activity and the *merged*
// result is re-validated against the full activity schema — so a PATCH
// can't leave the activity in an inconsistent state.
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (body === null) {
      return jsonError(400, "Request body must be valid JSON");
    }

    const parsed = activityUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const existing = await getActivity(id);
    if (!existing) return jsonError(404, "Activity not found");

    const merged = {
      type: parsed.data.type ?? existing.type,
      title: parsed.data.title ?? existing.title,
      showHints: parsed.data.showHints ?? existing.showHints,
      numGuesses: parsed.data.numGuesses ?? existing.numGuesses ?? undefined,
      rows: parsed.data.rows ?? existing.rows ?? undefined,
      cols: parsed.data.cols ?? existing.cols ?? undefined,
      theme: parsed.data.theme ?? existing.theme,
      layout: parsed.data.layout ?? existing.layout,
      size: parsed.data.size ?? existing.size,
      words: parsed.data.words ?? existing.words.map((word: { id: string }) => ({ id: word.id })),
    };

    const revalidated = activityInputSchema.safeParse(merged);
    if (!revalidated.success) {
      return validationError(revalidated.error);
    }

    const activity = await updateActivity(id, revalidated.data);
    return jsonOk(activity);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/activities/:id
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deleteActivity(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
