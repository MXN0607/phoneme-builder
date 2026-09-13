import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import type { ZodError } from "zod";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

// Turns a Zod validation failure into a 400 response with one readable
// message per invalid field, so the frontend can show something useful
// instead of a raw Zod error tree.
export function validationError(error: ZodError) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return jsonError(400, "Validation failed", fieldErrors);
}

// Maps the handful of Prisma error codes this app actually needs to handle
// into sensible HTTP responses, and re-throws anything else so it surfaces
// as a 500 with a logged stack trace instead of being silently swallowed.
export function handleApiError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return jsonError(409, "A record with that value already exists.", {
        fields: error.meta?.target,
      });
    }
    if (error.code === "P2025") {
      return jsonError(404, "Record not found.");
    }
  }

  console.error(error);
  return jsonError(500, "Something went wrong on the server.");
}
