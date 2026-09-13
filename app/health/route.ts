import { prisma } from "@/app/lib/prisma";
import { jsonOk, jsonError } from "@/app/lib/api-response";

// GET /health — used to confirm the app (and its database connection) is
// up. Returns 200 with a small status payload, or 503 if the database
// can't be reached.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return jsonOk({ status: "ok", database: "connected", time: new Date().toISOString() });
  } catch (error) {
    console.error("Health check failed:", error);
    return jsonError(503, "Database unreachable");
  }
}
