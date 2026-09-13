"use client";

import Link from "next/link";
import { useState } from "react";

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 1.5rem",
        borderBottom: "1px solid #ccc",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", gap: "1.5rem" }}>
        <Link href="/">Home</Link>
        <Link href="/wordle">Wordle</Link>
        <Link href="/word-search">Word Search</Link>
        <Link href="/words">Word Bank</Link>
        <Link href="/activities">Activities</Link>
      </div>

      <button
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Open menu"
        style={{
          border: "1px solid #cbd5e1",
          borderRadius: "6px",
          padding: "0.4rem 0.7rem",
          background: "transparent",
          cursor: "pointer",
          fontSize: "1.2rem",
        }}
      >
        ☰
      </button>

      {menuOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: "1.5rem",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "0.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            backgroundColor: "inherit",
            zIndex: 10,
          }}
        >
          <Link href="/about" onClick={() => setMenuOpen(false)}>
            About
          </Link>
          <Link href="/settings" onClick={() => setMenuOpen(false)}>
            Settings
          </Link>
        </div>
      )}
    </nav>
  );
}