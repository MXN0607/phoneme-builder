"use client";

import { useEffect, useState } from "react";
import type { DashboardMetrics } from "@/app/lib/metrics-service";

type HealthState = "checking" | "ok" | "down";

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function formatPercent(rate: number | null): string {
  if (rate === null) return "—";
  return `${Math.round(rate * 100)}%`;
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthState>("checking");

  async function loadDashboard() {
    try {
      const [metricsRes, healthRes] = await Promise.all([
        fetch("/api/metrics/dashboard"),
        fetch("/health"),
      ]);

      if (!metricsRes.ok) throw new Error(`Failed to load metrics (${metricsRes.status})`);
      setMetrics((await metricsRes.json()) as DashboardMetrics);
      setLoadError(null);
      setHealth(healthRes.ok ? "ok" : "down");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load dashboard");
      setHealth("down");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Dashboard load: intentional, one-shot fetch of current metrics.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
  }, []);

  if (loading) {
    return <p style={{ maxWidth: "960px", margin: "0 auto" }}>Loading dashboard…</p>;
  }

  if (loadError || !metrics) {
    return (
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <h2>Dashboard</h2>
        <p style={{ color: "#dc2626" }}>{loadError ?? "No data available."}</p>
        <button onClick={loadDashboard} style={secondaryButtonStyle}>
          Retry
        </button>
      </div>
    );
  }

  const totalActivities = metrics.activityCounts.WORDLE + metrics.activityCounts.WORD_SEARCH;

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto" }}>
      <h2>Dashboard</h2>
      <p style={{ color: "var(--muted, #64748b)" }}>
        Operational overview of the Phoneme Builder — stored content, usage, and system health.
      </p>

      {/* Health banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          border: `1px solid ${health === "ok" ? "#16a34a" : "#dc2626"}`,
          background: health === "ok" ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
          borderRadius: "10px",
          padding: "0.75rem 1rem",
          margin: "1rem 0 1.5rem",
        }}
      >
        <span
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: health === "ok" ? "#16a34a" : "#dc2626",
            flexShrink: 0,
          }}
        />
        <strong>{health === "ok" ? "All systems operational" : "Database unreachable"}</strong>
        <span style={{ color: "var(--muted, #64748b)", fontSize: "0.85rem" }}>
          — checked via <code>/health</code>
        </span>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        <StatCard label="Total activities" value={String(totalActivities)} />
        <StatCard label="Wordle activities" value={String(metrics.activityCounts.WORDLE)} />
        <StatCard label="Word Search activities" value={String(metrics.activityCounts.WORD_SEARCH)} />
        <StatCard
          label="Most-used builder"
          value={
            metrics.mostUsedType === "WORDLE"
              ? "Wordle"
              : metrics.mostUsedType === "WORD_SEARCH"
              ? "Word Search"
              : "—"
          }
        />
        <StatCard label="Word bank size" value={String(metrics.wordBankCount)} />
        <StatCard label="Avg. time on page" value={formatDuration(metrics.averageTimeOnPageMs)} />
        <StatCard
          label="Successful generations"
          value={String(metrics.generation.successCount)}
          accent="#16a34a"
        />
        <StatCard
          label="Failed generations"
          value={String(metrics.generation.failureCount)}
          accent={metrics.generation.failureCount > 0 ? "#dc2626" : undefined}
        />
        <StatCard
          label="Generation success rate"
          value={formatPercent(metrics.generation.successRate)}
        />
      </div>

      {/* Alerts feed */}
      <h3 style={{ marginBottom: "0.5rem" }}>Recent alerts</h3>
      {metrics.recentFailures.length === 0 ? (
        <p style={{ color: "var(--muted, #64748b)" }}>
          No failed generations recorded — nothing to show here.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {metrics.recentFailures.map((failure) => (
            <div
              key={failure.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.6rem",
                border: "1px solid #f59e0b",
                background: "rgba(245,158,11,0.08)",
                borderRadius: "8px",
                padding: "0.6rem 0.9rem",
              }}
            >
              <span aria-hidden="true">⚠️</span>
              <div>
                <strong style={{ fontSize: "0.85rem" }}>
                  {failure.activityType === "WORDLE"
                    ? "Wordle"
                    : failure.activityType === "WORD_SEARCH"
                    ? "Word Search"
                    : "Unknown"}{" "}
                  generation issue
                </strong>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--muted, #64748b)" }}>
                  {failure.detail ?? "No further detail recorded."}
                </p>
              </div>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "0.75rem",
                  color: "var(--muted, #64748b)",
                  whiteSpace: "nowrap",
                }}
              >
                {formatRelativeTime(String(failure.createdAt))}
              </span>
            </div>
          ))}
        </div>
      )}

      <button onClick={loadDashboard} style={{ ...secondaryButtonStyle, marginTop: "1.5rem" }}>
        Refresh
      </button>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div
      style={{
        border: "1px solid var(--border-color, #cbd5e1)",
        borderRadius: "10px",
        padding: "0.9rem 1rem",
        background: "var(--card-bg, #fff)",
      }}
    >
      <div style={{ fontSize: "1.6rem", fontWeight: 700, color: accent }}>{value}</div>
      <div style={{ fontSize: "0.8rem", color: "var(--muted, #64748b)" }}>{label}</div>
    </div>
  );
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  border: "1px solid var(--border-color, #cbd5e1)",
  background: "transparent",
  color: "var(--foreground, #171717)",
  cursor: "pointer",
};
