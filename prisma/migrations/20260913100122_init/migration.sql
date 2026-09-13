-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "english" TEXT NOT NULL,
    "phonemes" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'custom',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "showHints" BOOLEAN NOT NULL DEFAULT true,
    "numGuesses" INTEGER,
    "rows" INTEGER,
    "cols" INTEGER,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "layout" TEXT NOT NULL DEFAULT 'comfortable',
    "size" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ActivityWord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "position" INTEGER NOT NULL,
    "activityId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    CONSTRAINT "ActivityWord_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Word_english_phonemes_key" ON "Word"("english", "phonemes");

-- CreateIndex
CREATE INDEX "ActivityWord_activityId_position_idx" ON "ActivityWord"("activityId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityWord_activityId_wordId_key" ON "ActivityWord"("activityId", "wordId");
