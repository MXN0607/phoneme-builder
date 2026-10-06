import { test, expect } from "@playwright/test";

// User use case: entering a word in the Wordle builder and previewing the
// generated activity — the core "view a generated activity" flow.
test("Wordle: preview a generated activity", async ({ page }) => {
  await page.goto("/wordle");

  await expect(page.getByRole("heading", { name: "Phoneme Wordle Builder" })).toBeVisible();

  await page.getByLabel("Phoneme Word").fill("t s t");
  await page.getByLabel("English Word").fill("test");

  await page.getByRole("button", { name: "Preview" }).click();

  // Generating a preview swaps the page heading to the in-game title and
  // shows the playable board — a reliable signal the activity actually
  // generated from the entered data rather than just submitting a form.
  await expect(page.getByRole("heading", { name: "PHONEME'LE" })).toBeVisible();
});
