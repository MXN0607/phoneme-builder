import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center", padding: "2rem 1rem" }}>
      <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        Welcome to the Phoneme Activity Builder
      </h2>
      <p style={{ marginBottom: "2rem", lineHeight: 1.6 }}>
        This tool helps teachers build phoneme-based Wordle and Word Search
        activities for Speech Pathology students. Choose an activity below to
        get started, or visit the About page to learn more about the project.
      </p>
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
        <Link
          href="/wordle"
          style={{
            border: "1px solid #475569",
            borderRadius: "8px",
            padding: "0.75rem 1.5rem",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Build a Wordle
        </Link>
        <Link
          href="/word-search"
          style={{
            border: "1px solid #475569",
            borderRadius: "8px",
            padding: "0.75rem 1.5rem",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Build a Word Search
        </Link>
      </div>
    </div>
  );
}