export type Theme = "light" | "dark" | "oled";
export type Layout = "comfortable" | "compact";
export type Size = "small" | "medium" | "large";

export type SitePreferences = {
  theme: Theme;
  layout: Layout;
  size: Size;
};

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getSitePreferences(): SitePreferences {
  const theme = (getCookie("theme") as Theme) || "light";
  const layout = (getCookie("layout") as Layout) || "comfortable";
  const size = (getCookie("size") as Size) || "medium";
  return { theme, layout, size };
}

type ThemeColorSet = { background: string; foreground: string; border: string };

export const THEME_COLORS: Record<Theme, ThemeColorSet> = {
  light: { background: "#ffffff", foreground: "#171717", border: "#cbd5e1" },
  dark: { background: "#0f172a", foreground: "#f1f5f9", border: "#334155" },
  oled: { background: "#000000", foreground: "#ffffff", border: "#333333" },
};

export const SIZE_SCALE: Record<Size, number> = {
  small: 0.85,
  medium: 1,
  large: 1.25,
};