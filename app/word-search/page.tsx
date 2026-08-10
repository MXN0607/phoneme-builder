"use client";

import { useState, useEffect } from "react";
import { downloadHtmlFile } from "../lib/download";
import { getSitePreferences, THEME_COLORS, SIZE_SCALE, SitePreferences } from "../lib/preferences";
import { CorpusWord, CORPUS_3, CORPUS_4, CORPUS_5, CORPUS_ALL, pickRandomCorpusWords } from "../lib/wordCorpus";

type Cell = {
  phoneme: string;
  partOfWord: boolean;
};

type Pos = { r: number; c: number };

type PlacedWord = {
  phonemes: string[];
  positions: Pos[];
};

const FILLER_PHONEMES = [
  "æ", "ɪ", "ʊ", "ɒ", "ʌ", "e", "ɜː", "ɔː", "uː", "iː",
  "b", "d", "f", "g", "m", "n", "s", "t", "v", "ʃ", "tʃ", "dʒ", "ŋ",
];

const DIRECTIONS = [
  { dr: 0, dc: 1 },
  { dr: 1, dc: 0 },
  { dr: 1, dc: 1 },
];

const ANSWER_HIGHLIGHT_BG = "#facc15";
const HIGHLIGHT_TEXT_COLOR = "#1f2937";

function randomPhoneme() {
  return FILLER_PHONEMES[Math.floor(Math.random() * FILLER_PHONEMES.length)];
}

function generateGrid(words: string[][], rows: number, cols: number) {
  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ phoneme: "", partOfWord: false }))
  );

  const placedWords: PlacedWord[] = [];

  for (const word of words) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 100) {
      attempts++;
      const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const startRow = Math.floor(Math.random() * rows);
      const startCol = Math.floor(Math.random() * cols);

      const endRow = startRow + dir.dr * (word.length - 1);
      const endCol = startCol + dir.dc * (word.length - 1);
      if (endRow >= rows || endCol >= cols) continue;

      let fits = true;
      for (let i = 0; i < word.length; i++) {
        const r = startRow + dir.dr * i;
        const c = startCol + dir.dc * i;
        const existing = grid[r][c].phoneme;
        if (existing !== "" && existing !== word[i]) {
          fits = false;
          break;
        }
      }
      if (!fits) continue;

      const positions: Pos[] = [];
      for (let i = 0; i < word.length; i++) {
        const r = startRow + dir.dr * i;
        const c = startCol + dir.dc * i;
        grid[r][c] = { phoneme: word[i], partOfWord: true };
        positions.push({ r, c });
      }
      placed = true;
      placedWords.push({ phonemes: word, positions });
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].phoneme === "") {
        grid[r][c] = { phoneme: randomPhoneme(), partOfWord: false };
      }
    }
  }

  return { grid, placedWords };
}

function computeLinePath(start: Pos, end: Pos): Pos[] | null {
  const rowDiff = end.r - start.r;
  const colDiff = end.c - start.c;

  if (rowDiff === 0 && colDiff === 0) return [start];
  if (rowDiff !== 0 && colDiff !== 0 && Math.abs(rowDiff) !== Math.abs(colDiff)) {
    return null;
  }

  const steps = Math.max(Math.abs(rowDiff), Math.abs(colDiff));
  const stepR = rowDiff === 0 ? 0 : rowDiff / Math.abs(rowDiff);
  const stepC = colDiff === 0 ? 0 : colDiff / Math.abs(colDiff);

  const path: Pos[] = [];
  for (let i = 0; i <= steps; i++) {
    path.push({ r: start.r + stepR * i, c: start.c + stepC * i });
  }
  return path;
}

function positionsMatch(a: Pos[], b: Pos[]): boolean {
  if (a.length !== b.length) return false;
  const sameOrder = a.every((p, i) => p.r === b[i].r && p.c === b[i].c);
  if (sameOrder) return true;
  const reversed = [...b].reverse();
  return a.every((p, i) => p.r === reversed[i].r && p.c === reversed[i].c);
}

// Builds a fully self-contained HTML document: markup, CSS, and a vanilla-JS
// re-implementation of the drag-to-select gameplay. No React, no site chrome.
function buildWordSearchHtml(
  grid: Cell[][],
  placedWords: PlacedWord[],
  prefs: SitePreferences
): string {
  const colors = THEME_COLORS[prefs.theme];
  const scale = SIZE_SCALE[prefs.size];
  const bodyPadding = prefs.layout === "compact" ? "1rem 0.5rem" : "2rem 1rem";
  const h1Size = prefs.layout === "compact" ? "1.7rem" : "2.3rem";

  const tableRows = grid
    .map(
      (row, r) =>
        "<tr>" +
        row
          .map(
            (cell, c) =>
              '<td data-r="' + r + '" data-c="' + c + '">' + cell.phoneme + "</td>"
          )
          .join("") +
        "</tr>"
    )
    .join("");

  const wordListHtml = placedWords
    .map(
      (w, i) =>
        '<span class="word-chip" data-index="' +
        i +
        '">' +
        w.phonemes.join(" ") +
        "</span>"
    )
    .join("");

  const placedWordsJson = JSON.stringify(
    placedWords.map((w) => ({ positions: w.positions }))
  );

  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    "<title>Phoneme Word Search</title>",
    "<style>",
    "body { font-family: 'Trebuchet MS', Verdana, sans-serif; text-align: center; padding: " +
      bodyPadding +
      "; background: " +
      colors.background +
      "; color: " +
      colors.foreground +
      "; zoom: " +
      scale +
      "; }",
    "h1 { font-size: " + h1Size + "; margin-bottom: 1.5rem; }",
    "table { border-collapse: collapse; margin: 0 auto; user-select: none; }",
    "td { border: 1px solid " +
      colors.border +
      "; width: 40px; height: 40px; text-align: center; cursor: pointer; font-weight: normal; font-family: monospace; }",
    "td.dragging { background-color: #fde68a; color: #1f2937; font-weight: bold; }",
    "td.found { background-color: #86efac; color: #1f2937; font-weight: bold; }",
    "#wordlist { margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; }",
    ".word-chip { border: 1px solid " +
      colors.border +
      "; border-radius: 4px; padding: 0.25rem 0.5rem; font-family: monospace; }",
    ".word-chip.found { background-color: #86efac; color: #1f2937; text-decoration: line-through; }",
    "#status { margin-top: 1rem; font-weight: 700; color: #16a34a; }",
    "</style>",
    "</head>",
    "<body>",
    "<h1>Phoneme Word Search</h1>",
    "<table>" + tableRows + "</table>",
    '<div id="wordlist">' + wordListHtml + "</div>",
    '<p id="status"></p>',
    "<script>",
    "var placedWords = " + placedWordsJson + ";",
    "var foundWords = new Set();",
    "var isDragging = false;",
    "var dragStart = null;",
    "var dragPath = [];",
    "",
    "function computeLinePath(start, end) {",
    "  var rowDiff = end.r - start.r;",
    "  var colDiff = end.c - start.c;",
    "  if (rowDiff === 0 && colDiff === 0) return [start];",
    "  if (rowDiff !== 0 && colDiff !== 0 && Math.abs(rowDiff) !== Math.abs(colDiff)) return null;",
    "  var steps = Math.max(Math.abs(rowDiff), Math.abs(colDiff));",
    "  var stepR = rowDiff === 0 ? 0 : rowDiff / Math.abs(rowDiff);",
    "  var stepC = colDiff === 0 ? 0 : colDiff / Math.abs(colDiff);",
    "  var path = [];",
    "  for (var i = 0; i <= steps; i++) { path.push({ r: start.r + stepR * i, c: start.c + stepC * i }); }",
    "  return path;",
    "}",
    "",
    "function positionsMatch(a, b) {",
    "  if (a.length !== b.length) return false;",
    "  var sameOrder = a.every(function (p, i) { return p.r === b[i].r && p.c === b[i].c; });",
    "  if (sameOrder) return true;",
    "  var reversed = b.slice().reverse();",
    "  return a.every(function (p, i) { return p.r === reversed[i].r && p.c === reversed[i].c; });",
    "}",
    "",
    "function clearDragHighlight() {",
    "  dragPath.forEach(function (p) {",
    '    var td = document.querySelector(\'td[data-r="\' + p.r + \'"][data-c="\' + p.c + \'"]\');',
    "    if (td) td.classList.remove('dragging');",
    "  });",
    "}",
    "",
    "function applyDragHighlight(path) {",
    "  path.forEach(function (p) {",
    '    var td = document.querySelector(\'td[data-r="\' + p.r + \'"][data-c="\' + p.c + \'"]\');',
    "    if (td) td.classList.add('dragging');",
    "  });",
    "}",
    "",
    "function markFound(index) {",
    "  foundWords.add(index);",
    "  placedWords[index].positions.forEach(function (p) {",
    '    var td = document.querySelector(\'td[data-r="\' + p.r + \'"][data-c="\' + p.c + \'"]\');',
    "    if (td) td.classList.add('found');",
    "  });",
    '  var chip = document.querySelector(\'.word-chip[data-index="\' + index + \'"]\');',
    "  if (chip) chip.classList.add('found');",
    "  if (foundWords.size === placedWords.length) {",
    "    document.getElementById('status').textContent = 'All words found!';",
    "  }",
    "}",
    "",
    "document.querySelectorAll('td[data-r]').forEach(function (td) {",
    "  var r = parseInt(td.getAttribute('data-r'), 10);",
    "  var c = parseInt(td.getAttribute('data-c'), 10);",
    "  td.addEventListener('mousedown', function () {",
    "    isDragging = true;",
    "    dragStart = { r: r, c: c };",
    "    dragPath = [{ r: r, c: c }];",
    "    applyDragHighlight(dragPath);",
    "  });",
    "  td.addEventListener('mouseenter', function () {",
    "    if (!isDragging || !dragStart) return;",
    "    var path = computeLinePath(dragStart, { r: r, c: c });",
    "    if (path) {",
    "      clearDragHighlight();",
    "      dragPath = path;",
    "      applyDragHighlight(dragPath);",
    "    }",
    "  });",
    "});",
    "",
    "window.addEventListener('mouseup', function () {",
    "  if (!isDragging) return;",
    "  isDragging = false;",
    "  clearDragHighlight();",
    "  var matchIndex = placedWords.findIndex(function (w, idx) {",
    "    return !foundWords.has(idx) && positionsMatch(w.positions, dragPath);",
    "  });",
    "  if (matchIndex !== -1) { markFound(matchIndex); }",
    "  dragStart = null;",
    "  dragPath = [];",
    "});",
    "</script>",
    "</body>",
    "</html>",
  ].join("\n");
}

const tierButtonStyle = (selected: boolean) => ({
  border: selected ? "1px solid #1d4ed8" : "1px solid #cbd5e1",
  backgroundColor: selected ? "#2563eb" : "transparent",
  color: selected ? "#fff" : "inherit",
  borderRadius: "6px",
  padding: "0.35rem 0.6rem",
  cursor: "pointer",
  fontFamily: "monospace",
  fontSize: "0.9rem",
});

function CorpusTier({
  title,
  words,
  selectedEnglish,
  onToggle,
}: {
  title: string;
  words: CorpusWord[];
  selectedEnglish: Set<string>;
  onToggle: (word: CorpusWord) => void;
}) {
  return (
    <details style={{ marginBottom: "0.75rem" }}>
      <summary style={{ cursor: "pointer", fontWeight: 600, marginBottom: "0.5rem" }}>
        {title} ({words.length})
      </summary>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
        {words.map((word) => (
          <button
            key={word.english}
            onClick={() => onToggle(word)}
            style={tierButtonStyle(selectedEnglish.has(word.english))}
            title={word.phonemes.join(" ")}
          >
            {word.english}
          </button>
        ))}
      </div>
    </details>
  );
}

export default function WordSearchPage() {
  const [rows, setRows] = useState(10);
  const [cols, setCols] = useState(10);
  const [grid, setGrid] = useState<Cell[][] | null>(null);
  const [wordList, setWordList] = useState<PlacedWord[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);

  const [selectedWords, setSelectedWords] = useState<CorpusWord[]>([]);
  const [customEnglish, setCustomEnglish] = useState("");
  const [customPhonemes, setCustomPhonemes] = useState("");
  const [customError, setCustomError] = useState("");

  const [foundWords, setFoundWords] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Pos | null>(null);
  const [dragPath, setDragPath] = useState<Pos[]>([]);

  // Pick a random starting set of 5 words once the page has mounted
  // (kept out of the initial state to avoid a server/client mismatch).
  useEffect(() => {
    setSelectedWords(pickRandomCorpusWords(5));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever the selected words or grid dimensions change, rebuild the
  // puzzle immediately — no separate "build" step needed.
  useEffect(() => {
    if (selectedWords.length === 0) {
      setGrid(null);
      setWordList([]);
      return;
    }
    const phonemeArrays = selectedWords.map((w) => w.phonemes);
    const { grid: newGrid, placedWords } = generateGrid(phonemeArrays, rows, cols);
    setGrid(newGrid);
    setWordList(placedWords);
    setShowAnswers(false);
    setFoundWords(new Set());
    setIsDragging(false);
    setDragStart(null);
    setDragPath([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWords, rows, cols]);

  const selectedEnglish = new Set(selectedWords.map((w) => w.english));

  function toggleCorpusWord(word: CorpusWord) {
    setSelectedWords((prev) =>
      prev.some((w) => w.english === word.english)
        ? prev.filter((w) => w.english !== word.english)
        : [...prev, word]
    );
  }

  function handleRemoveSelected(index: number) {
    setSelectedWords((prev) => prev.filter((_, i) => i !== index));
  }

  function handleRandomize() {
    setSelectedWords(pickRandomCorpusWords(5));
  }

  function handleAddCustomWord() {
    const phonemes = customPhonemes.trim().split(/\s+/).filter(Boolean);
    const english = customEnglish.trim();
    if (phonemes.length === 0 || english === "") {
      setCustomError("Enter both a word and its phoneme spelling.");
      return;
    }
    setCustomError("");
    setSelectedWords((prev) => [...prev, { english, phonemes }]);
    setCustomEnglish("");
    setCustomPhonemes("");
  }

  // Builds and downloads the standalone HTML file using whatever puzzle is
  // currently shown. Never calls setState, so the live page never changes.
  function handleGenerate() {
    let exportGrid = grid;
    let exportWords = wordList;

    if (!exportGrid || exportWords.length === 0) {
      const chosen = pickRandomCorpusWords(5);
      const result = generateGrid(
        chosen.map((w) => w.phonemes),
        rows,
        cols
      );
      exportGrid = result.grid;
      exportWords = result.placedWords;
    }

    const prefs = getSitePreferences();
    const html = buildWordSearchHtml(exportGrid, exportWords, prefs);
    downloadHtmlFile("phoneme-word-search.html", html);
  }

  function handleCellMouseDown(r: number, c: number) {
    setIsDragging(true);
    setDragStart({ r, c });
    setDragPath([{ r, c }]);
  }

  function handleCellMouseEnter(r: number, c: number) {
    if (!isDragging || !dragStart) return;
    const path = computeLinePath(dragStart, { r, c });
    if (path) setDragPath(path);
  }

  function finishSelection() {
    setIsDragging((wasDragging) => {
      if (!wasDragging) return false;

      setWordList((currentWordList) => {
        setFoundWords((currentFound) => {
          const matchIndex = currentWordList.findIndex(
            (w, idx) => !currentFound.has(idx) && positionsMatch(w.positions, dragPath)
          );
          if (matchIndex === -1) return currentFound;
          const next = new Set(currentFound);
          next.add(matchIndex);
          return next;
        });
        return currentWordList;
      });

      return false;
    });
    setDragStart(null);
    setDragPath([]);
  }

  useEffect(() => {
    window.addEventListener("mouseup", finishSelection);
    return () => window.removeEventListener("mouseup", finishSelection);
  });

  const foundCellKeys = new Set<string>();
  wordList.forEach((w, idx) => {
    if (foundWords.has(idx)) {
      w.positions.forEach((p) => foundCellKeys.add(`${p.r}-${p.c}`));
    }
  });
  const dragPathKeys = new Set(dragPath.map((p) => `${p.r}-${p.c}`));

  const allFound = wordList.length > 0 && foundWords.size === wordList.length;

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "2rem 1rem",
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: "2.3rem", marginBottom: "0.5rem" }}>Phoneme Word Search</h2>

      <div
        style={{
          display: "flex",
          gap: "2rem",
          flexWrap: "wrap",
          justifyContent: "center",
          marginTop: "1.5rem",
          textAlign: "left",
        }}
      >
        <div style={{ minWidth: "280px", maxWidth: "340px" }}>
          <strong>Choose Words</strong>
          <p style={{ fontSize: "0.85rem", color: "var(--muted, #64748b)", marginTop: "0.25rem" }}>
            Click words below to add or remove them from the puzzle.
          </p>

          <div
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "0.75rem",
              marginTop: "0.5rem",
            }}
          >
            <CorpusTier
              title="3-Phoneme Words"
              words={CORPUS_3}
              selectedEnglish={selectedEnglish}
              onToggle={toggleCorpusWord}
            />
            <CorpusTier
              title="4-Phoneme Words"
              words={CORPUS_4}
              selectedEnglish={selectedEnglish}
              onToggle={toggleCorpusWord}
            />
            <CorpusTier
              title="5-Phoneme Words"
              words={CORPUS_5}
              selectedEnglish={selectedEnglish}
              onToggle={toggleCorpusWord}
            />
          </div>

          <button
            onClick={handleRandomize}
            style={{
              marginTop: "0.75rem",
              border: "1px solid #475569",
              borderRadius: "8px",
              padding: "0.5rem",
              color: "#fff",
              backgroundColor: "#64748b",
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            Randomize 5
          </button>

          <details
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "0.75rem",
              marginTop: "1rem",
            }}
          >
            <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>
              Add a Custom Word
            </summary>
            <div style={{ marginTop: "0.5rem" }}>
              <input
                type="text"
                value={customEnglish}
                onChange={(e) => setCustomEnglish(e.target.value)}
                placeholder="English word, e.g. dog"
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  padding: "0.4rem 0.6rem",
                  width: "100%",
                  boxSizing: "border-box",
                  marginBottom: "0.5rem",
                }}
              />
              <input
                type="text"
                value={customPhonemes}
                onChange={(e) => setCustomPhonemes(e.target.value)}
                placeholder="Phonemes, e.g. d ɒ g"
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  padding: "0.4rem 0.6rem",
                  width: "100%",
                  boxSizing: "border-box",
                  fontFamily: "monospace",
                }}
              />
              <button
                onClick={handleAddCustomWord}
                style={{
                  marginTop: "0.5rem",
                  border: "1px solid #1d4ed8",
                  borderRadius: "6px",
                  padding: "0.4rem",
                  color: "#fff",
                  backgroundColor: "#2563eb",
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                Add Word
              </button>
              {customError && (
                <p style={{ color: "#dc2626", fontSize: "0.85rem", marginTop: "0.4rem" }}>
                  {customError}
                </p>
              )}
            </div>
          </details>

          <div style={{ marginTop: "1rem" }}>
            <strong style={{ fontSize: "0.9rem" }}>Selected ({selectedWords.length})</strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
              {selectedWords.map((word, i) => (
                <span
                  key={`${word.english}-${i}`}
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    padding: "0.25rem 0.5rem",
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  {word.english}
                  <button
                    onClick={() => handleRemoveSelected(i)}
                    aria-label={`Remove ${word.english}`}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "#dc2626",
                      fontWeight: 700,
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "1.25rem", display: "flex", gap: "1rem" }}>
            <label>
              Rows
              <br />
              <input
                type="number"
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                min={5}
                max={20}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "0.4rem 0.6rem",
                  width: "100%",
                  boxSizing: "border-box",
                  marginTop: "0.25rem",
                }}
              />
            </label>
            <label>
              Cols
              <br />
              <input
                type="number"
                value={cols}
                onChange={(e) => setCols(Number(e.target.value))}
                min={5}
                max={20}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "0.4rem 0.6rem",
                  width: "100%",
                  boxSizing: "border-box",
                  marginTop: "0.25rem",
                }}
              />
            </label>
          </div>

          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {grid && (
              <button
                onClick={() => setShowAnswers((s) => !s)}
                style={{
                  border: "1px solid #475569",
                  borderRadius: "8px",
                  padding: "0.6rem",
                  color: "#fff",
                  backgroundColor: "#64748b",
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                {showAnswers ? "Hide Answers" : "Show Answers"}
              </button>
            )}
            <button
              onClick={handleGenerate}
              style={{
                border: "1px solid #1d4ed8",
                borderRadius: "8px",
                padding: "0.6rem",
                color: "#fff",
                backgroundColor: "#2563eb",
                fontWeight: 600,
                cursor: "pointer",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              Generate (Download HTML)
            </button>
          </div>
        </div>

        <div>
          {grid && (
            <>
              <table style={{ borderCollapse: "collapse", userSelect: "none" }}>
                <tbody>
                  {grid.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => {
                        const key = `${r}-${c}`;
                        const isFound = foundCellKeys.has(key);
                        const isDraggedOver = dragPathKeys.has(key);
                        const isAnswerReveal = showAnswers && cell.partOfWord;
                        const isHighlighted = isFound || isDraggedOver || isAnswerReveal;

                        return (
                          <td
                            key={c}
                            onMouseDown={() => handleCellMouseDown(r, c)}
                            onMouseEnter={() => handleCellMouseEnter(r, c)}
                            style={{
                              border: "1px solid #ccc",
                              width: "40px",
                              height: "40px",
                              textAlign: "center",
                              cursor: "pointer",
                              userSelect: "none",
                              fontWeight: isHighlighted ? "bold" : "normal",
                              color: isHighlighted ? HIGHLIGHT_TEXT_COLOR : undefined,
                              backgroundColor: isFound
                                ? "#86efac"
                                : isDraggedOver
                                ? "#fde68a"
                                : isAnswerReveal
                                ? ANSWER_HIGHLIGHT_BG
                                : "transparent",
                            }}
                          >
                            {cell.phoneme}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: "1rem" }}>
                <strong>Word List:</strong>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {wordList.map((word, i) => (
                    <span
                      key={i}
                      style={{
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        padding: "0.25rem 0.5rem",
                        fontFamily: "monospace",
                        backgroundColor: foundWords.has(i) ? "#86efac" : "transparent",
                        color: foundWords.has(i) ? HIGHLIGHT_TEXT_COLOR : undefined,
                        textDecoration: foundWords.has(i) ? "line-through" : "none",
                      }}
                    >
                      {word.phonemes.join(" ")}
                    </span>
                  ))}
                </div>
                {allFound && (
                  <p style={{ color: "#16a34a", fontWeight: 700, marginTop: "0.75rem" }}>
                    All words found!
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}