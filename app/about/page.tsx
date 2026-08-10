import { Fredoka } from "next/font/google";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function AboutPage() {
  return (
    <div
      className={fredoka.className}
      style={{
        maxWidth: "700px",
        margin: "0 auto",
        padding: "2rem 1rem",
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: "2.3rem", marginBottom: "1.5rem" }}>About This Project</h2>

      <div style={{ textAlign: "left", lineHeight: 1.6 }}>
        <p>
          The Phoneme Activity Builder is a web application for Speech Pathology
          teachers to create classroom activities built around phonemes rather
          than standard English spelling. The tool currently offers two
          activity types: a phoneme-based Wordle game and a phoneme-based Word
          Search puzzle. Teachers configure an activity, preview it directly in
          the browser, and generate a playable result for their students.
        </p>

        <p>
          <strong>This assessment (Assessment 1) is frontend only.</strong> It
          focuses on interface design, usability, and the interactive builder
          and preview experience. There is no database or dynamic word list
          management yet — the Word Search draws from a small fixed bank of
          phoneme words, and the Wordle builder works with a single
          teacher-entered word. Database-backed word lists and richer
          generation options are planned for later assessments.
        </p>

        <h3 style={{ marginTop: "2rem" }}>Wordle</h3>
        <p>
          Teachers enter a phoneme-based target word and its English
          equivalent, choose whether hint tooltips are shown, and set the
          number of guesses. Students then guess the word phoneme by phoneme
          using an on-screen phoneme keyboard, with tile colours showing how
          close each guess is — similar to classic Wordle, but built around
          phonemic sounds instead of letters.
        </p>

        <h3 style={{ marginTop: "1.5rem" }}>Word Search</h3>
        <p>
          Each time a puzzle is generated, five phoneme-based words are
          randomly selected from a fixed word bank and placed into a grid.
          Students find the words by clicking and dragging across the grid in
          any direction, with found words highlighted and crossed off the
          list automatically.
        </p>

        <h3 style={{ marginTop: "1.5rem" }}>Demo Video</h3>
        <p>
          A short video walking through how to use the website is available
          below.
        </p>
        <div
          style={{
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "1rem",
            textAlign: "center",
            color: "var(--muted, #64748b)",
          }}
        >
          [Embed or link your demo video here]
        </div>

        <h3 style={{ marginTop: "1.5rem" }}>Student Details:</h3>
        <p>
          Minh Xuan Nguyen
          <br />
          Student Number: 22451358
        </p>
      </div>
    </div>
  );
}