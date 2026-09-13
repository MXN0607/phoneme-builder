"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ActivityRecord, ApiErrorBody } from "@/app/lib/types";

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return body.error ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "WORDLE" | "WORD_SEARCH">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadActivities() {
    try {
      const res = await fetch("/api/activities");
      if (!res.ok) throw new Error(await readError(res));
      setActivities((await res.json()) as ActivityRecord[]);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load activities");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Fetch-on-mount: intentional, one-shot load of saved activities.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadActivities();
  }, []);

  const visible = useMemo(
    () => activities.filter((a) => typeFilter === "all" || a.type === typeFilter),
    [activities, typeFilter]
  );

  function openInBuilder(activity: ActivityRecord) {
    const path = activity.type === "WORDLE" ? "/wordle" : "/word-search";
    router.push(`${path}?activityId=${activity.id}`);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this saved activity? This can't be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error(await readError(res));
      setActivities((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete activity");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
      <h2>Saved Activities</h2>
      <p style={{ color: "var(--muted, #64748b)" }}>
        Wordle and Word Search configurations saved to the database. Open one to load it back
        into the builder, tweak it, and regenerate the HTML — or delete it when you&apos;re done
        with it.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {(["all", "WORDLE", "WORD_SEARCH"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setTypeFilter(value)}
            style={typeFilter === value ? tierButtonActiveStyle : tierButtonStyle}
          >
            {value === "all" ? "All" : value === "WORDLE" ? "Wordle" : "Word Search"}
          </button>
        ))}
      </div>

      {loading && <p>Loading activities…</p>}
      {loadError && <p style={errorTextStyle}>{loadError}</p>}
      {!loading && !loadError && visible.length === 0 && (
        <p style={{ color: "var(--muted, #64748b)" }}>
          No saved activities yet — build one in the Wordle or Word Search builder and hit{" "}
          <strong>Save Activity</strong>.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {visible.map((activity) => (
          <div
            key={activity.id}
            style={{
              border: "1px solid var(--border-color, #cbd5e1)",
              borderRadius: "12px",
              padding: "1rem",
              background: "var(--card-bg, #fff)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div style={{ flex: "1 1 260px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <strong>{activity.title}</strong>
                <span style={badgeStyle}>
                  {activity.type === "WORDLE" ? "Wordle" : "Word Search"}
                </span>
              </div>
              <p style={{ margin: "0.35rem 0 0", color: "var(--muted, #64748b)", fontSize: "0.9rem" }}>
                {activity.words.map((w) => w.english).join(", ")}
              </p>
              <p style={{ margin: "0.25rem 0 0", color: "var(--muted, #64748b)", fontSize: "0.8rem" }}>
                Updated {formatDate(activity.updatedAt)}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={() => openInBuilder(activity)} style={primaryButtonStyle}>
                Open in builder
              </button>
              <button
                onClick={() => handleDelete(activity.id)}
                disabled={deletingId === activity.id}
                style={dangerButtonStyle}
              >
                {deletingId === activity.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  border: "none",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
};

const dangerButtonStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  border: "1px solid #dc2626",
  background: "transparent",
  color: "#dc2626",
  cursor: "pointer",
};

const tierButtonStyle: React.CSSProperties = {
  padding: "0.4rem 0.8rem",
  borderRadius: "999px",
  border: "1px solid var(--border-color, #cbd5e1)",
  background: "transparent",
  color: "var(--foreground, #171717)",
  cursor: "pointer",
  fontSize: "0.85rem",
};

const tierButtonActiveStyle: React.CSSProperties = {
  ...tierButtonStyle,
  background: "#2563eb",
  borderColor: "#2563eb",
  color: "#fff",
};

const badgeStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  padding: "0.15rem 0.5rem",
  borderRadius: "999px",
  border: "1px solid var(--border-color, #cbd5e1)",
  color: "var(--muted, #64748b)",
};

const errorTextStyle: React.CSSProperties = {
  color: "#dc2626",
  fontSize: "0.85rem",
  margin: 0,
};
