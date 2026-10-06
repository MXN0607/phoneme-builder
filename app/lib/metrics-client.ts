"use client";

import { useEffect } from "react";

type ActivityKind = "WORDLE" | "WORD_SEARCH";

function send(payload: object) {
  const body = JSON.stringify(payload);
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/metrics/events",
      new Blob([body], { type: "application/json" })
    );
  } else {
    fetch("/api/metrics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Observability is best-effort — a failed metrics call should never
      // interrupt the person's actual task.
    });
  }
}

// Fire-and-forget: logs one generation attempt. Call this from
// handleGenerate in the builder pages — never awaited, never blocks the
// actual download.
export function logGenerationEvent(
  success: boolean,
  activityType: ActivityKind,
  detail?: string
) {
  send({
    type: success ? "GENERATION_SUCCESS" : "GENERATION_FAILURE",
    activityType,
    detail,
  });
}

// Tracks how long someone spends on a builder page and reports it once
// they leave. Deliberately simple rather than a full analytics
// implementation (per the brief's own framing of "simulated input
// records") — a closed laptop or crashed tab won't always fire it.
export function useTrackPageView(activityType: ActivityKind) {
  useEffect(() => {
    const startTime = Date.now();
    let sent = false;

    function report() {
      if (sent) return;
      sent = true;
      const durationMs = Date.now() - startTime;
      if (durationMs < 500) return; // ignore accidental instant navigations
      send({ type: "PAGE_VIEW", activityType, durationMs });
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") report();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", report);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", report);
      report();
    };
  }, [activityType]);
}
