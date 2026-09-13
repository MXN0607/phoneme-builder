import { NextRequest } from "next/server";
import { jsonOk, jsonError, validationError, handleApiError } from "@/app/lib/api-response";
import { wordInputSchema } from "@/app/lib/validation";
import { listWords, createWord } from "@/app/lib/words-service";

// GET /api/words?difficulty=3&search=ch
// Lists the word bank, optionally filtered by phoneme count and/or a
// case-insensitive substring match on the English word.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const difficultyParam = searchParams.get("difficulty");
    const search = searchParams.get("search") ?? undefined;

    const difficulty = difficultyParam ? Number(difficultyParam) : undefined;
    if (difficultyParam && (!Number.isInteger(difficulty) || difficulty! < 1)) {
      return jsonError(400, "difficulty must be a positive integer");
    }

    const words = await listWords({ difficulty, search });
    return jsonOk(words);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/words
// Adds a new word to the bank. Body: { english, phonemes: string[], source? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (body === null) {
      return jsonError(400, "Request body must be valid JSON");
    }

    const parsed = wordInputSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const word = await createWord(parsed.data);
    return jsonOk(word, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
