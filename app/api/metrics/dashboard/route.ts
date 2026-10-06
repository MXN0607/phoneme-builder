import { jsonOk, handleApiError } from "@/app/lib/api-response";
import { getDashboardMetrics } from "@/app/lib/metrics-service";

// GET /api/metrics/dashboard
// Everything the /dashboard page needs in one call: activity counts,
// generation success/failure counts, average time on page, the most-used
// activity type, and the most recent failures (for the alerts feed).
export async function GET() {
  try {
    const metrics = await getDashboardMetrics();
    return jsonOk(metrics);
  } catch (error) {
    return handleApiError(error);
  }
}
