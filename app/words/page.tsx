"use client";

import { useEffect, useMemo, useState } from "react";
import type { WordRecord, ApiErrorBody } from "@/app/lib/types";

type FormState = {
  english: string;
  phonemes: string;
};

const emptyForm: FormState = { english: "", phonemes: "" };

function parsePhonemeInput(raw: string): string[] {
  return raw
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    if (body.details && typeof body.details === "object") {
      const messages = Object.values(body.details as Record<string, string[]>).flat();
      if (messages.length) return messages.join(" ");
    }
    return body.error ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export default function WordBankPage() {
  const [words, setWords] = useState<WordRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | number>("all");

  const [addForm, setAddForm] = useState<FormState>(emptyForm);
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadWords() {
    try {
      const res = await fetch("/api/words");
      if (!res.ok) throw new Error(await readError(res));
      setWords((await res.json()) as WordRecord[]);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load words");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Fetch-on-mount: intentional, one-shot load of the word bank.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWords();
  }, []);

  const tiers = useMemo(() => {
    const set = new Set(words.map((w) => w.difficulty));
    return Array.from(set).sort((a, b) => a - b);
  }, [words]);

  const visibleWords = useMemo(() => {
    return words
      .filter((w) => tierFilter === "all" || w.difficulty === tierFilter)
      .filter((w) =>
        search.trim() ? w.english.toLowerCase().includes(search.trim().toLowerCase()) : true
      );
  }, [words, tierFilter, search]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);

    const phonemes = parsePhonemeInput(addForm.phonemes);
    if (!addForm.english.trim() || phonemes.length === 0) {
      setAddError("Enter an English word and at least one phoneme.");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ english: addForm.english.trim(), phonemes, source: "custom" }),
      });
      if (!res.ok) throw new Error(await readError(res));
      const created = (await res.json()) as WordRecord;
      setWords((prev) => [...prev, created]);
      setAddForm(emptyForm);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add word");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(word: WordRecord) {
    setEditingId(word.id);
    setEditForm({ english: word.english, phonemes: word.phonemes.join(" ") });
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(emptyForm);
    setEditError(null);
  }

  async function saveEdit(id: string) {
    setEditError(null);
    const phonemes = parsePhonemeInput(editForm.phonemes);
    if (!editForm.english.trim() || phonemes.length === 0) {
      setEditError("Enter an English word and at least one phoneme.");
      return;
    }

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/words/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ english: editForm.english.trim(), phonemes }),
      });
      if (!res.ok) throw new Error(await readError(res));
      const updated = (await res.json()) as WordRecord;
      setWords((prev) => prev.map((w) => (w.id === id ? updated : w)));
      cancelEdit();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this word? It will also be removed from any saved activities that use it.")) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/words/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error(await readError(res));
      setWords((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete word");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
      <h2>Word Bank</h2>
      <p style={{ color: "var(--muted, #64748b)" }}>
        Phoneme-based words stored in the database. Words added here become available to pick
        from when building Wordle and Word Search activities, and are reused across every
        activity you save.
      </p>

      <form
        onSubmit={handleAdd}
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          alignItems: "flex-end",
          border: "1px solid var(--border-color, #cbd5e1)",
          borderRadius: "12px",
          padding: "1rem",
          marginBottom: "1.5rem",
          background: "var(--card-bg, #fff)",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem" }}>English word</span>
          <input
            value={addForm.english}
            onChange={(e) => setAddForm((f) => ({ ...f, english: e.target.value }))}
            placeholder="chin"
            style={inputStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem" }}>Phonemes (space-separated)</span>
          <input
            value={addForm.phonemes}
            onChange={(e) => setAddForm((f) => ({ ...f, phonemes: e.target.value }))}
            placeholder="tʃ ɪ n"
            style={{ ...inputStyle, fontFamily: "monospace" }}
          />
        </label>
        <button type="submit" disabled={adding} style={primaryButtonStyle}>
          {adding ? "Adding…" : "Add word"}
        </button>
        {addError && <p style={errorTextStyle}>{addError}</p>}
      </form>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search words…"
          style={{ ...inputStyle, minWidth: "200px" }}
        />
        <button
          onClick={() => setTierFilter("all")}
          style={tierFilter === "all" ? tierButtonActiveStyle : tierButtonStyle}
        >
          All
        </button>
        {tiers.map((tier) => (
          <button
            key={tier}
            onClick={() => setTierFilter(tier)}
            style={tierFilter === tier ? tierButtonActiveStyle : tierButtonStyle}
          >
            {tier} phonemes
          </button>
        ))}
      </div>

      {loading && <p>Loading word bank…</p>}
      {loadError && <p style={errorTextStyle}>{loadError}</p>}

      {!loading && !loadError && visibleWords.length === 0 && (
        <p style={{ color: "var(--muted, #64748b)" }}>No words match your filters yet.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {visibleWords.map((word) => {
          const isEditing = editingId === word.id;
          return (
            <div
              key={word.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
                border: "1px solid var(--border-color, #cbd5e1)",
                borderRadius: "10px",
                padding: "0.75rem 1rem",
                background: "var(--card-bg, #fff)",
              }}
            >
              {isEditing ? (
                <>
                  <input
                    value={editForm.english}
                    onChange={(e) => setEditForm((f) => ({ ...f, english: e.target.value }))}
                    style={{ ...inputStyle, maxWidth: "160px" }}
                  />
                  <input
                    value={editForm.phonemes}
                    onChange={(e) => setEditForm((f) => ({ ...f, phonemes: e.target.value }))}
                    style={{ ...inputStyle, fontFamily: "monospace", maxWidth: "200px" }}
                  />
                  <button onClick={() => saveEdit(word.id)} disabled={savingEdit} style={primaryButtonStyle}>
                    {savingEdit ? "Saving…" : "Save"}
                  </button>
                  <button onClick={cancelEdit} style={secondaryButtonStyle}>
                    Cancel
                  </button>
                  {editError && <p style={errorTextStyle}>{editError}</p>}
                </>
              ) : (
                <>
                  <strong style={{ minWidth: "100px" }}>{word.english}</strong>
                  <span style={{ fontFamily: "monospace", color: "var(--muted, #64748b)" }}>
                    /{word.phonemes.join(" ")}/
                  </span>
                  <span style={badgeStyle}>{word.difficulty} phonemes</span>
                  <span style={{ ...badgeStyle, opacity: 0.7 }}>{word.source}</span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => startEdit(word)} style={secondaryButtonStyle}>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(word.id)}
                      disabled={deletingId === word.id}
                      style={dangerButtonStyle}
                    >
                      {deletingId === word.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.5rem 0.6rem",
  borderRadius: "6px",
  border: "1px solid var(--border-color, #cbd5e1)",
  background: "var(--background, #fff)",
  color: "var(--foreground, #171717)",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  border: "none",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "0.4rem 0.8rem",
  borderRadius: "6px",
  border: "1px solid var(--border-color, #cbd5e1)",
  background: "transparent",
  color: "var(--foreground, #171717)",
  cursor: "pointer",
};

const dangerButtonStyle: React.CSSProperties = {
  padding: "0.4rem 0.8rem",
  borderRadius: "6px",
  border: "1px solid #dc2626",
  background: "transparent",
  color: "#dc2626",
  cursor: "pointer",
};

const tierButtonStyle: React.CSSProperties = {
  padding: "0.4rem 0.8rem",
  borderRadius: "999px",
  border: "1px solid var(--border-color, #cbd5e1)",
  background: "transparent",
  color: "var(--foreground, #171717)",
  cursor: "pointer",
  fontSize: "0.85rem",
};

const tierButtonActiveStyle: React.CSSProperties = {
  ...tierButtonStyle,
  background: "#2563eb",
  borderColor: "#2563eb",
  color: "#fff",
};

const badgeStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  padding: "0.15rem 0.5rem",
  borderRadius: "999px",
  border: "1px solid var(--border-color, #cbd5e1)",
  color: "var(--muted, #64748b)",
};

const errorTextStyle: React.CSSProperties = {
  color: "#dc2626",
  fontSize: "0.85rem",
  margin: 0,
};
