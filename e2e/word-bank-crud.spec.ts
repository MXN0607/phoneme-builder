import { test, expect } from "@playwright/test";

// Builder use case: full CRUD (Create, Read, Update, Delete) on a Word
// Bank entry, via the /words page.
test("Word Bank: create, read, update, and delete a word", async ({ page }) => {
  // Unique per run so repeated test runs never collide with real data or
  // with each other.
  const original = `e2e-test-${Date.now()}`;
  const renamed = `${original}-renamed`;

  // The Delete button uses a native confirm() dialog — Playwright
  // auto-dismisses dialogs unless a handler is registered, so without
  // this the delete step below would silently do nothing.
  page.on("dialog", (dialog) => dialog.accept());

  await page.goto("/words");

  // --- Create ---
  await page.getByLabel("English word").fill(original);
  await page.getByLabel("Phonemes (space-separated)").fill("t s t");
  await page.getByRole("button", { name: "Add word" }).click();

  // --- Read ---
  const row = page.locator(`[data-testid="word-row"][data-word-english="${original}"]`);
  await expect(row).toBeVisible();
  await expect(row.getByText("3 phonemes")).toBeVisible();

  // --- Update ---
  await row.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Edit English word").fill(renamed);
  await page.getByRole("button", { name: "Save" }).click();

  const renamedRow = page.locator(`[data-testid="word-row"][data-word-english="${renamed}"]`);
  await expect(renamedRow).toBeVisible();

  // --- Delete ---
  await renamedRow.getByRole("button", { name: "Delete" }).click();
  await expect(renamedRow).not.toBeVisible();
});
