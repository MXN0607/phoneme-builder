"use client";

import { useState } from "react";
import { downloadHtmlFile } from "../lib/download";
import { getSitePreferences, THEME_COLORS, SIZE_SCALE, SitePreferences } from "../lib/preferences";

type KeyCell = { symbol: string; hint: string } | null;

const KEYBOARD: KeyCell[][] = [
  [
    { symbol: "p", hint: "P as in pat" },
    { symbol: "t", hint: "T as in top" },
    { symbol: "k", hint: "K as in cat" },
    null,
  ],
  [
    { symbol: "b", hint: "B as in bat" },
    { symbol: "d", hint: "D as in dog" },
    { symbol: "g", hint: "G as in go" },
    null,
  ],
  [
    { symbol: "n", hint: "N as in net" },
    { symbol: "m", hint: "M as in map" },
    { symbol: "ŋ", hint: "NG as in sing" },
    null,
  ],
  [
    { symbol: "f", hint: "F as in fan" },
    { symbol: "s", hint: "S as in sun" },
    { symbol: "θ", hint: "TH as in thin" },
    { symbol: "ʃ", hint: "SH as in ship" },
  ],
  [
    { symbol: "v", hint: "V as in van" },
    { symbol: "z", hint: "Z as in zoo" },
    { symbol: "ð", hint: "TH as in this" },
    { symbol: "ʒ", hint: "S as in measure" },
  ],
  [
    { symbol: "l", hint: "L as in log" },
    { symbol: "ɹ", hint: "R as in run" },
    { symbol: "w", hint: "W as in win" },
    { symbol: "j", hint: "Y as in yes" },
  ],
  [
    { symbol: "h", hint: "H as in hat" },
    { symbol: "tʃ", hint: "CH as in chin" },
    { symbol: "dʒ", hint: "J as in jam" },
    null,
  ],
  [
    { symbol: "iː", hint: "EE as in see" },
    { symbol: "ɪ", hint: "I as in sit" },
    { symbol: "e", hint: "E as in bed" },
    { symbol: "eː", hint: "AIR as in hair" },
  ],
  [
    { symbol: "æ", hint: "A as in cat" },
    { symbol: "ɐ", hint: "U as in sun" },
    { symbol: "ɐː", hint: "AR as in car" },
    { symbol: "ɜː", hint: "ER as in bird" },
  ],
  [
    { symbol: "ʉː", hint: "OO as in boot" },
    { symbol: "ɔ", hint: "O as in hot" },
    { symbol: "oː", hint: "OR as in for" },
    { symbol: "ʊ", hint: "OO as in book" },
  ],
  [
    { symbol: "æɪ", hint: "AY as in day" },
    { symbol: "ae", hint: "I as in my" },
    { symbol: "oɪ", hint: "OY as in boy" },
    { symbol: "əʉ", hint: "O as in go" },
  ],
  [
    { symbol: "æɔ", hint: "OW as in cow" },
    { symbol: "ɪə", hint: "EAR as in near" },
    null,
    { symbol: "ə", hint: "A as in about" },
  ],
];

type FeedbackStatus = "correct" | "present" | "absent";

function computeFeedback(guess: string[], target: string[]): FeedbackStatus[] {
  const result: FeedbackStatus[] = new Array(guess.length).fill("absent");
  const targetUsed = new Array(target.length).fill(false);

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === target[i]) {
      result[i] = "correct";
      targetUsed[i] = true;
    }
  }
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === "correct") continue;
    const j = target.findIndex((t, idx) => t === guess[i] && !targetUsed[idx]);
    if (j !== -1) {
      result[i] = "present";
      targetUsed[j] = true;
    }
  }
  return result;
}

const cellColors: Record<FeedbackStatus, string> = {
  correct: "#86efac",
  present: "#fde68a",
  absent: "#cbd5e1",
};

const inputStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  padding: "0.5rem 0.7rem",
  width: "100%",
  boxSizing: "border-box" as const,
  marginTop: "0.25rem",
  fontFamily: "monospace",
};

// Builds a fully self-contained HTML document: markup, CSS, and a vanilla-JS
// re-implementation of the guess/feedback logic. No React, no site chrome.
function buildWordleHtml(
  targetWord: string[],
  targetEnglish: string,
  numGuesses: number,
  showHints: boolean
): string {
  const wordLength = targetWord.length;

  const gridRows = Array.from({ length: numGuesses }, (_, r) =>
    '<div class="grid-row">' +
    Array.from(
      { length: wordLength },
      (_, c) => '<div class="tile" data-row="' + r + '" data-col="' + c + '"></div>'
    ).join("") +
    "</div>"
  ).join("");

  const keyboardRows = KEYBOARD.map(
    (row) =>
      '<div class="key-row">' +
      row
        .map((cell) => {
          if (!cell) return '<div class="key blank"></div>';
          const titleAttr = showHints
            ? ' title="' + cell.hint.replace(/"/g, "&quot;") + '"'
            : "";
          return (
            '<button class="key" data-symbol="' +
            cell.symbol +
            '"' +
            titleAttr +
            ">" +
            cell.symbol +
            "</button>"
          );
        })
        .join("") +
      "</div>"
  ).join("");

  const targetWordJson = JSON.stringify(targetWord);
  const targetEnglishJson = JSON.stringify(targetEnglish);

  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    "<title>Phoneme Wordle</title>",
    "<style>",
    "body { font-family: 'Trebuchet MS', Verdana, sans-serif; text-align: center; padding: 2rem 1rem; background: #ffffff; color: #171717; }",
    "h1 { font-size: 2.3rem; margin-bottom: 1.5rem; }",
    "#grid { display: inline-block; margin-bottom: 1.5rem; }",
    ".grid-row { display: flex; gap: 0.4rem; margin-bottom: 0.4rem; justify-content: center; }",
    ".tile { width: 48px; height: 48px; border: 1px solid #94a3b8; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-family: monospace; }",
    ".tile.correct { background-color: #86efac; }",
    ".tile.present { background-color: #fde68a; }",
    ".tile.absent { background-color: #cbd5e1; }",
    "#keyboard { display: inline-block; border: 1px solid #94a3b8; border-radius: 6px; overflow: hidden; }",
    ".key-row { display: flex; }",
    ".key { width: 90px; height: 44px; border: 1px solid #cbd5e1; background: transparent; cursor: pointer; font-family: monospace; font-weight: 600; font-size: 1rem; }",
    ".key.blank { cursor: default; }",
    ".key:disabled { cursor: default; opacity: 0.6; }",
    "#controls { margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: center; }",
    "#controls button { border-radius: 6px; padding: 0.5rem 1.5rem; cursor: pointer; font-weight: 600; }",
    "#backspace { border: 1px solid #cbd5e1; background: transparent; }",
    "#enter { border: 1px solid #475569; background-color: #64748b; color: #fff; }",
    "#message { margin-top: 1rem; font-weight: 700; }",
    "</style>",
    "</head>",
    "<body>",
    "<h1>PHONEME'LE</h1>",
    '<div id="grid">' + gridRows + "</div>",
    '<div id="keyboard">' + keyboardRows + "</div>",
    '<div id="controls">',
    '<button id="backspace">⌫</button>',
    '<button id="enter">ENTER</button>',
    "</div>",
    '<p id="message"></p>',
    "<script>",
    "var targetWord = " + targetWordJson + ";",
    "var targetEnglish = " + targetEnglishJson + ";",
    "var numGuesses = " + numGuesses + ";",
    "var guesses = [];",
    "var currentGuess = [];",
    "var gameStatus = 'playing';",
    "",
    "function computeFeedback(guess, target) {",
    "  var result = guess.map(function () { return 'absent'; });",
    "  var used = target.map(function () { return false; });",
    "  for (var i = 0; i < guess.length; i++) {",
    "    if (guess[i] === target[i]) { result[i] = 'correct'; used[i] = true; }",
    "  }",
    "  for (var i = 0; i < guess.length; i++) {",
    "    if (result[i] === 'correct') continue;",
    "    var j = -1;",
    "    for (var k = 0; k < target.length; k++) {",
    "      if (target[k] === guess[i] && !used[k]) { j = k; break; }",
    "    }",
    "    if (j !== -1) { result[i] = 'present'; used[j] = true; }",
    "  }",
    "  return result;",
    "}",
    "",
    "function renderRow(rowIndex, letters, feedback) {",
    "  for (var c = 0; c < targetWord.length; c++) {",
    '    var tile = document.querySelector(\'.tile[data-row="\' + rowIndex + \'"][data-col="\' + c + \'"]\');',
    "    if (!tile) continue;",
    "    tile.textContent = letters[c] || '';",
    "    tile.classList.remove('correct', 'present', 'absent');",
    "    if (feedback) tile.classList.add(feedback[c]);",
    "  }",
    "}",
    "",
    "function setKeysDisabled(disabled) {",
    "  document.querySelectorAll('.key[data-symbol]').forEach(function (btn) { btn.disabled = disabled; });",
    "  document.getElementById('backspace').disabled = disabled;",
    "  document.getElementById('enter').disabled = disabled;",
    "}",
    "",
    "function handleKey(symbol) {",
    "  if (gameStatus !== 'playing') return;",
    "  if (currentGuess.length >= targetWord.length) return;",
    "  currentGuess.push(symbol);",
    "  renderRow(guesses.length, currentGuess, null);",
    "}",
    "",
    "function handleBackspace() {",
    "  if (gameStatus !== 'playing') return;",
    "  currentGuess.pop();",
    "  renderRow(guesses.length, currentGuess, null);",
    "}",
    "",
    "function handleEnter() {",
    "  if (gameStatus !== 'playing') return;",
    "  if (currentGuess.length !== targetWord.length) {",
    "    document.getElementById('message').textContent = 'Not enough phonemes for this guess.';",
    "    document.getElementById('message').style.color = '#dc2626';",
    "    return;",
    "  }",
    "  document.getElementById('message').textContent = '';",
    "  var feedback = computeFeedback(currentGuess, targetWord);",
    "  renderRow(guesses.length, currentGuess, feedback);",
    "  var won = currentGuess.join('') === targetWord.join('');",
    "  guesses.push(currentGuess);",
    "  currentGuess = [];",
    "  if (won) {",
    "    gameStatus = 'won';",
    "    setKeysDisabled(true);",
    "    document.getElementById('message').textContent = 'Correct! The word is \"' + targetEnglish + '\".';",
    "    document.getElementById('message').style.color = '#16a34a';",
    "  } else if (guesses.length >= numGuesses) {",
    "    gameStatus = 'lost';",
    "    setKeysDisabled(true);",
    "    document.getElementById('message').textContent = 'Out of guesses. The word was \"' + targetEnglish + '\".';",
    "    document.getElementById('message').style.color = '#dc2626';",
    "  }",
    "}",
    "",
    "document.querySelectorAll('.key[data-symbol]').forEach(function (btn) {",
    "  btn.addEventListener('click', function () { handleKey(btn.getAttribute('data-symbol')); });",
    "});",
    "document.getElementById('backspace').addEventListener('click', handleBackspace);",
    "document.getElementById('enter').addEventListener('click', handleEnter);",
    "</script>",
    "</body>",
    "</html>",
  ].join("\n");
}

export default function WordlePage() {
  const [phonemeWordInput, setPhonemeWordInput] = useState("");
  const [englishWordInput, setEnglishWordInput] = useState("");
  const [showHints, setShowHints] = useState(true);
  const [numGuesses, setNumGuesses] = useState(6);

  const [generated, setGenerated] = useState(false);
  const [targetWord, setTargetWord] = useState<string[]>([]);
  const [targetEnglish, setTargetEnglish] = useState("");

  const [guesses, setGuesses] = useState<string[][]>([]);
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing");
  const [message, setMessage] = useState("");

  function handlePreview() {
    const parsedTarget = phonemeWordInput.trim().split(/\s+/).filter(Boolean);
    if (parsedTarget.length === 0 || englishWordInput.trim() === "") {
      setMessage("Enter both a phoneme word and its English word first.");
      return;
    }
    setTargetWord(parsedTarget);
    setTargetEnglish(englishWordInput.trim());
    setGuesses([]);
    setCurrentGuess([]);
    setGameStatus("playing");
    setMessage("");
    setGenerated(true);
  }

  function handleBackToBuilder() {
    setGenerated(false);
    setMessage("");
  }

  // Builds and downloads the standalone HTML file. Uses the currently
  // previewed word if one exists; otherwise reads directly from the form
  // inputs. Never calls state setters that alter the live preview.
  function handleGenerate() {
    let exportTarget = targetWord;
    let exportEnglish = targetEnglish;

    if (exportTarget.length === 0) {
      const parsed = phonemeWordInput.trim().split(/\s+/).filter(Boolean);
      if (parsed.length === 0 || englishWordInput.trim() === "") {
        setMessage("Enter both a phoneme word and its English word first.");
        return;
      }
      exportTarget = parsed;
      exportEnglish = englishWordInput.trim();
    }

    const html = buildWordleHtml(exportTarget, exportEnglish, numGuesses, showHints);
    const safeName = exportEnglish.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadHtmlFile(`phoneme-wordle-${safeName}.html`, html);
  }

  function handleKeyClick(symbol: string) {
    if (gameStatus !== "playing") return;
    if (currentGuess.length >= targetWord.length) return;
    setCurrentGuess([...currentGuess, symbol]);
  }

  function handleBackspace() {
    if (gameStatus !== "playing") return;
    setCurrentGuess(currentGuess.slice(0, -1));
  }

  function handleEnter() {
    if (gameStatus !== "playing") return;
    if (currentGuess.length !== targetWord.length) {
      setMessage("Not enough phonemes for this guess.");
      return;
    }
    setMessage("");
    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);

    if (currentGuess.join("") === targetWord.join("")) {
      setGameStatus("won");
    } else if (newGuesses.length >= numGuesses) {
      setGameStatus("lost");
    }
    setCurrentGuess([]);
  }

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "2rem 1rem",
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: "2.3rem", marginBottom: "0.5rem" }}>
        {generated ? "PHONEME'LE" : "Phoneme Wordle Builder"}
      </h2>

      {!generated && (
        <div style={{ maxWidth: "320px", margin: "1.5rem auto 0", textAlign: "left" }}>
          <label>
            <strong>Phoneme Word</strong>
            <br />
            <input
              type="text"
              value={phonemeWordInput}
              onChange={(e) => setPhonemeWordInput(e.target.value)}
              placeholder="e.g. tʃ ɪ n"
              style={inputStyle}
            />
          </label>

          <div style={{ marginTop: "1rem" }}>
            <label>
              <strong>English Word</strong>
              <br />
              <input
                type="text"
                value={englishWordInput}
                onChange={(e) => setEnglishWordInput(e.target.value)}
                placeholder="e.g. chin"
                style={inputStyle}
              />
            </label>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <strong>Show hints</strong>
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <input
                  type="radio"
                  name="showHints"
                  checked={showHints === true}
                  onChange={() => setShowHints(true)}
                />
                Yes
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <input
                  type="radio"
                  name="showHints"
                  checked={showHints === false}
                  onChange={() => setShowHints(false)}
                />
                No
              </label>
            </div>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <label>
              <strong>Number of Guesses</strong>
              <br />
              <input
                type="number"
                value={numGuesses}
                onChange={(e) => setNumGuesses(Number(e.target.value))}
                min={1}
                max={10}
                style={inputStyle}
              />
            </label>
          </div>

          <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <button
              onClick={handlePreview}
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
              Preview
            </button>
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

          {message && <p style={{ color: "#dc2626", marginTop: "0.75rem" }}>{message}</p>}
        </div>
      )}

      {generated && (
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button
            onClick={handleBackToBuilder}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "0.4rem 0.9rem",
              background: "transparent",
              cursor: "pointer",
              marginBottom: "1.5rem",
            }}
          >
            ← Build Another Word
          </button>

          <div
            style={{
              display: "flex",
              gap: "2rem",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "flex-start",
            }}
          >
            <div>
              {Array.from({ length: numGuesses }).map((_, rowIndex) => {
                const submittedGuess = guesses[rowIndex];
                const isCurrentRow = rowIndex === guesses.length && gameStatus === "playing";
                const feedback = submittedGuess
                  ? computeFeedback(submittedGuess, targetWord)
                  : null;

                return (
                  <div key={rowIndex} style={{ display: "flex", gap: "0.4rem", marginBottom: "0.4rem" }}>
                    {Array.from({ length: targetWord.length }).map((__, colIndex) => {
                      const phoneme = submittedGuess
                        ? submittedGuess[colIndex]
                        : isCurrentRow
                        ? currentGuess[colIndex]
                        : "";
                      const bg = feedback ? cellColors[feedback[colIndex]] : "transparent";

                      return (
                        <div
                          key={colIndex}
                          style={{
                            width: "48px",
                            height: "48px",
                            border: "1px solid #94a3b8",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontFamily: "monospace",
                            backgroundColor: bg,
                          }}
                        >
                          {phoneme || ""}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 90px)",
                border: "1px solid #94a3b8",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              {KEYBOARD.flatMap((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const key = `${rowIndex}-${colIndex}`;
                  if (!cell) {
                    return <div key={key} style={{ border: "1px solid #cbd5e1", padding: "0.6rem" }} />;
                  }
                  return (
                    <button
                      key={key}
                      onClick={() => handleKeyClick(cell.symbol)}
                      title={showHints ? cell.hint : undefined}
                      disabled={gameStatus !== "playing"}
                      style={{
                        border: "1px solid #cbd5e1",
                        padding: "0.6rem",
                        background: "transparent",
                        cursor: gameStatus === "playing" ? "pointer" : "default",
                        fontFamily: "monospace",
                        fontWeight: 600,
                        fontSize: "1rem",
                      }}
                    >
                      {cell.symbol}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "1rem" }}>
            <button
              onClick={handleBackspace}
              disabled={gameStatus !== "playing"}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                padding: "0.5rem 1rem",
                cursor: gameStatus === "playing" ? "pointer" : "default",
              }}
            >
              ⌫
            </button>
            <button
              onClick={handleEnter}
              disabled={gameStatus !== "playing"}
              style={{
                border: "1px solid #475569",
                borderRadius: "6px",
                padding: "0.5rem 1.5rem",
                backgroundColor: "#64748b",
                color: "#fff",
                fontWeight: 600,
                cursor: gameStatus === "playing" ? "pointer" : "default",
              }}
            >
              ENTER
            </button>
          </div>

          {message && <p style={{ color: "#dc2626", marginTop: "1rem" }}>{message}</p>}

          {gameStatus === "won" && (
            <p style={{ color: "#16a34a", fontWeight: 700, marginTop: "1rem" }}>
              Correct! The word is &quot;{targetEnglish}&quot;.
            </p>
          )}
          {gameStatus === "lost" && (
            <p style={{ color: "#dc2626", fontWeight: 700, marginTop: "1rem" }}>
              Out of guesses. The word was &quot;{targetEnglish}&quot;.
            </p>
          )}
        </div>
      )}
    </div>
  );
}