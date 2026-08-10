import type { Metadata } from "next";
import Script from "next/script";
import { Fredoka } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Phoneme Builder",
  description: "Phoneme-based Wordle and Word Search builder for Speech Pathology classrooms",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={fredoka.className} suppressHydrationWarning>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var themeMatch = document.cookie.match(/(?:^|; )theme=([^;]*)/);
                  var theme = themeMatch ? themeMatch[1] : "light";
                  document.documentElement.setAttribute("data-theme", theme);

                  var layoutMatch = document.cookie.match(/(?:^|; )layout=([^;]*)/);
                  var layout = layoutMatch ? layoutMatch[1] : "comfortable";
                  document.documentElement.setAttribute("data-layout", layout);

                  var sizeMatch = document.cookie.match(/(?:^|; )size=([^;]*)/);
                  var size = sizeMatch ? sizeMatch[1] : "medium";
                  document.documentElement.setAttribute("data-size", size);
                } catch (e) {}
              })();
            `,
          }}
        />

        <header style={{ padding: "1rem", borderBottom: "1px solid #ccc", textAlign: "center" }}>
          <h1 style={{ margin: 0 }}>Phoneme Activity Builder</h1>
        </header>

        <NavBar />

        <main style={{ padding: "1rem" }}>{children}</main>

        <footer
          style={{
            padding: "1rem",
            borderTop: "1px solid #ccc",
            marginTop: "2rem",
            textAlign: "center",
          }}
        >
          <p>Minh Xuan Nguyen — Student Number: 22451358</p>
        </footer>
      </body>
    </html>
  );
}