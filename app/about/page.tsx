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
          <strong>Assessment 2 adds the backend and database layer</strong>{" "}
          behind the Assessment 1 interface. Word lists, phonemes, and
          activity settings are now stored in a SQLite database (via Prisma)
          instead of being hard-coded into the frontend, with a REST API and
          full create/read/update/delete support for both individual words
          and saved activity configurations.
        </p>

        <h3 style={{ marginTop: "2rem" }}>Word Bank</h3>
        <p>
          The <strong>Word Bank</strong> page manages the phoneme-based word
          list stored in the database — teachers can add new words, edit or
          delete existing ones, and filter by phoneme count. These words are
          reused everywhere: in the built-in corpus tiers, in a dedicated
          &quot;My Word Bank&quot; tier inside both builders, and whenever an
          activity is saved.
        </p>

        <h3 style={{ marginTop: "1.5rem" }}>Saved Activities</h3>
        <p>
          Both builders can save the current word(s) and settings as a
          reusable <strong>Activity</strong> — a Wordle target word, or a
          Word Search word list plus grid size. Saved activities appear on
          the <strong>Activities</strong> page, where they can be reopened
          into the relevant builder (to tweak and regenerate the HTML output)
          or deleted.
        </p>

        <h3 style={{ marginTop: "1.5rem" }}>Wordle</h3>
        <p>
          Teachers pick a phoneme-based target word — from the built-in
          corpus, from the database-backed Word Bank, or typed in by hand —
          choose whether hint tooltips are shown, and set the number of
          guesses. Students then guess the word phoneme by phoneme using an
          on-screen phoneme keyboard, with tile colours showing how close
          each guess is — similar to classic Wordle, but built around
          phonemic sounds instead of letters.
        </p>

        <h3 style={{ marginTop: "1.5rem" }}>Word Search</h3>
        <p>
          A puzzle starts with five phoneme-based words randomly selected
          from the built-in corpus, but teachers can add, remove, and swap in
          words from the database-backed Word Bank (or type new ones) before
          generating the grid. Students find the words by clicking and
          dragging across the grid in any direction, with found words
          highlighted and crossed off the list automatically.
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
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <video
              controls
              width="100%"
              style={{ maxWidth: "800px", borderRadius: "12px" }}
            >
              <source src="/guide.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
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