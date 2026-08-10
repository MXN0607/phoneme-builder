"use client";

import { useEffect, useState } from "react";
import { Fredoka } from "next/font/google";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type Theme = "light" | "dark" | "oled";
type Layout = "comfortable" | "compact";
type Size = "small" | "medium" | "large";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value};path=/;max-age=${60 * 60 * 24 * 365}`;
}

export default function SettingsPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [layout, setLayout] = useState<Layout>("comfortable");
  const [size, setSize] = useState<Size>("medium");

  useEffect(() => {
    const savedTheme = getCookie("theme") as Theme | null;
    const savedLayout = getCookie("layout") as Layout | null;
    const savedSize = getCookie("size") as Size | null;
    if (savedTheme) setTheme(savedTheme);
    if (savedLayout) setLayout(savedLayout);
    if (savedSize) setSize(savedSize);
  }, []);

  function handleThemeChange(next: Theme) {
    setTheme(next);
    setCookie("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  function handleLayoutChange(next: Layout) {
    setLayout(next);
    setCookie("layout", next);
    document.documentElement.setAttribute("data-layout", next);
  }

  function handleSizeChange(next: Size) {
    setSize(next);
    setCookie("size", next);
    document.documentElement.setAttribute("data-size", next);
  }

  return (
    <div
      className={fredoka.className}
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "2rem 1rem",
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: "2.3rem", marginBottom: "1.5rem" }}>Settings</h2>

      <div style={{ textAlign: "left" }}>
        <div style={{ marginBottom: "2rem" }}>
          <strong>Theme</strong>
          <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <input
                type="radio"
                name="theme"
                checked={theme === "light"}
                onChange={() => handleThemeChange("light")}
              />
              Light
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <input
                type="radio"
                name="theme"
                checked={theme === "dark"}
                onChange={() => handleThemeChange("dark")}
              />
              Dark
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <input
                type="radio"
                name="theme"
                checked={theme === "oled"}
                onChange={() => handleThemeChange("oled")}
              />
              OLED
            </label>
          </div>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <strong>Layout Density</strong>
          <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <input
                type="radio"
                name="layout"
                checked={layout === "comfortable"}
                onChange={() => handleLayoutChange("comfortable")}
              />
              Comfortable
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <input
                type="radio"
                name="layout"
                checked={layout === "compact"}
                onChange={() => handleLayoutChange("compact")}
              />
              Compact
            </label>
          </div>
        </div>

        <div>
          <strong>Text &amp; Element Size</strong>
          <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <input
                type="radio"
                name="size"
                checked={size === "small"}
                onChange={() => handleSizeChange("small")}
              />
              Small
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <input
                type="radio"
                name="size"
                checked={size === "medium"}
                onChange={() => handleSizeChange("medium")}
              />
              Medium
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <input
                type="radio"
                name="size"
                checked={size === "large"}
                onChange={() => handleSizeChange("large")}
              />
              Large
            </label>
          </div>
        </div>

        <p style={{ marginTop: "2rem", fontSize: "0.9rem", color: "var(--muted, #64748b)" }}>
          Changes are saved automatically and applied across the whole site.
        </p>
      </div>
    </div>
  );
}