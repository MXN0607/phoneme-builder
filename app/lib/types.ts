export type WordRecord = {
  id: string;
  english: string;
  phonemes: string[];
  difficulty: number;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type ActivityKind = "WORDLE" | "WORD_SEARCH";
export type Theme = "light" | "dark" | "oled";
export type Layout = "comfortable" | "compact";
export type Size = "small" | "medium" | "large";

export type ActivityRecord = {
  id: string;
  type: ActivityKind;
  title: string;
  showHints: boolean;
  numGuesses: number | null;
  rows: number | null;
  cols: number | null;
  theme: Theme;
  layout: Layout;
  size: Size;
  createdAt: string;
  updatedAt: string;
  words: WordRecord[];
};

export type ApiErrorBody = {
  error: string;
  details?: unknown;
};
