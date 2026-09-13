import { z } from "zod";

// A single phoneme symbol, e.g. "b", "tʃ", "əʉ", "ɜː". Phonemes can be more
// than one character wide, so this only rules out empty strings, whitespace,
// and obviously-wrong input — it doesn't try to validate against a fixed
// IPA symbol list, since teachers may reasonably use symbols we didn't
// anticipate.
const phonemeSymbol = z
  .string()
  .trim()
  .min(1, "A phoneme symbol can't be empty")
  .max(6, "That doesn't look like a single phoneme symbol")
  .regex(/^\S+$/, "Phoneme symbols can't contain spaces");

export const wordInputSchema = z.object({
  english: z
    .string()
    .trim()
    .min(1, "English word is required")
    .max(64, "English word is too long"),
  phonemes: z
    .array(phonemeSymbol)
    .min(1, "At least one phoneme is required")
    .max(12, "That's a lot of phonemes for one word — double check it"),
  source: z.enum(["corpus", "custom"]).default("custom"),
});

export type WordInput = z.infer<typeof wordInputSchema>;

// All fields optional for PATCH — but if phonemes is provided it still has
// to be a non-empty array of valid symbols.
export const wordUpdateSchema = wordInputSchema.partial();

export type WordUpdateInput = z.infer<typeof wordUpdateSchema>;

// An activity's word list can reference existing Word Bank entries by id,
// or hand over a brand-new word inline (e.g. one typed straight into the
// builder rather than picked from the bank). The API layer is responsible
// for creating/looking up the Word row either way.
const activityWordRefSchema = z.union([
  z.object({ id: z.string().min(1) }),
  wordInputSchema,
]);

const baseActivitySchema = z.object({
  type: z.enum(["WORDLE", "WORD_SEARCH"]),
  title: z.string().trim().min(1, "Title is required").max(120),
  showHints: z.boolean().default(true),
  numGuesses: z.number().int().min(1).max(10).optional(),
  rows: z.number().int().min(4).max(20).optional(),
  cols: z.number().int().min(4).max(20).optional(),
  theme: z.enum(["light", "dark", "oled"]).default("light"),
  layout: z.enum(["comfortable", "compact"]).default("comfortable"),
  size: z.enum(["small", "medium", "large"]).default("medium"),
  words: z
    .array(activityWordRefSchema)
    .min(1, "An activity needs at least one word"),
});

function checkActivityShape(
  data: z.infer<typeof baseActivitySchema>,
  ctx: z.RefinementCtx
) {
  if (data.type === "WORDLE") {
    if (data.words.length !== 1) {
      ctx.addIssue({
        code: "custom",
        message: "Wordle activities need exactly one target word",
        path: ["words"],
      });
    }
    if (!data.numGuesses) {
      ctx.addIssue({
        code: "custom",
        message: "numGuesses is required for Wordle activities",
        path: ["numGuesses"],
      });
    }
  }

  if (data.type === "WORD_SEARCH") {
    if (data.words.length < 2) {
      ctx.addIssue({
        code: "custom",
        message: "Word Search activities need at least two words",
        path: ["words"],
      });
    }
    if (!data.rows || !data.cols) {
      ctx.addIssue({
        code: "custom",
        message: "rows and cols are required for Word Search activities",
        path: ["rows"],
      });
    }
  }
}

export const activityInputSchema = baseActivitySchema.superRefine(
  checkActivityShape
);

export type ActivityInput = z.infer<typeof activityInputSchema>;

// For updates we allow a partial payload, but if the caller changes `type`
// or `words` the same shape rules still need to hold — so we validate the
// merged result in the route handler rather than trying to express
// "conditionally required, but only if present" directly here.
export const activityUpdateSchema = baseActivitySchema.partial();

export type ActivityUpdateInput = z.infer<typeof activityUpdateSchema>;
