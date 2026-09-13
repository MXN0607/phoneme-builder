import { NextRequest } from "next/server";
import { jsonOk, jsonError, validationError, handleApiError } from "@/app/lib/api-response";
import { wordUpdateSchema } from "@/app/lib/validation";
import { getWord, updateWord, deleteWord } from "@/app/lib/words-service";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/words/:id
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const word = await getWord(id);
    if (!word) return jsonError(404, "Word not found");
    return jsonOk(word);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/words/:id
// Body: any subset of { english, phonemes, source }
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (body === null) {
      return jsonError(400, "Request body must be valid JSON");
    }

    const parsed = wordUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }
    if (Object.keys(parsed.data).length === 0) {
      return jsonError(400, "Request body must include at least one field to update");
    }

    const word = await updateWord(id, parsed.data);
    return jsonOk(word);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/words/:id
// Deleting a word also removes it from any saved activities that
// reference it (ActivityWord rows cascade — see schema.prisma).
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deleteWord(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
