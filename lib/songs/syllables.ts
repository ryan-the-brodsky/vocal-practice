// Parse lyrics into syllable tokens + zip them onto an analyzed note sequence,
// splitting held notes when the singer used one pitch for multiple syllables.
// Pitch detection cannot recover syllable count on a sustained pitch — the
// lyrics text is the only honest signal of how many notes belong there.

import type { ExtractedNote } from "../analyze/types";

/** Parse a raw lyrics string into syllable tokens. Whitespace splits words;
 *  hyphens within a word split syllables ("for-ev-er" → 3). Trailing
 *  punctuation is stripped; contractions stay intact. */
export function parseSyllables(lyrics: string): string[] {
  if (!lyrics) return [];
  const out: string[] = [];
  for (const word of lyrics.split(/\s+/)) {
    if (!word) continue;
    for (const raw of word.split("-")) {
      const cleaned = stripTrailingPunctuation(raw);
      if (cleaned.length === 0) continue;
      out.push(cleaned);
    }
  }
  return out;
}

// Strip leading and trailing punctuation (commas, periods, !, ?, quotes, etc).
// Apostrophes stay so "don't" remains one syllable.
function stripTrailingPunctuation(s: string): string {
  return s.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, "");
}

export interface MatchedNotes {
  /** Length = max(syllableCount, noteCount). One syllable per note. */
  notes: ExtractedNote[];
  /** For each entry in `notes`, the originating index in the input notes[]. */
  originalIndexMap: number[];
}

/** Zip parsed syllables onto the analyzed notes:
 *  - syllableCount === noteCount → 1:1 zip
 *  - syllableCount > noteCount → repeatedly bisect the longest single-syllable
 *    note until counts match (each bisect creates 2 notes from 1)
 *  - syllableCount < noteCount → trailing notes get empty-string syllables
 *  - empty/missing lyrics → return notes unchanged (with identity map) */
export function zipSyllablesToNotes(
  syllables: string[],
  notes: ExtractedNote[],
): MatchedNotes {
  if (syllables.length === 0) {
    return {
      notes: notes.slice(),
      originalIndexMap: notes.map((_, i) => i),
    };
  }

  // Carry an originalIdx alongside each working note so the index map survives splits.
  interface Working { note: ExtractedNote; originalIdx: number }
  let working: Working[] = notes.map((n, i) => ({ note: n, originalIdx: i }));

  // Bisect the longest note (stable: earliest wins ties) until we have enough.
  while (syllables.length > working.length) {
    const longestIdx = pickLongestIndex(working);
    if (longestIdx < 0) break;
    const w = working[longestIdx]!;
    const half = w.note.durationBeats / 2;
    if (half <= 0) break; // would create zero-duration notes; stop
    const midMs = (w.note.startMs + w.note.endMs) / 2;
    const left: ExtractedNote = { ...w.note, endMs: midMs, durationBeats: half };
    const right: ExtractedNote = { ...w.note, startMs: midMs, durationBeats: half };
    working = [
      ...working.slice(0, longestIdx),
      { note: left, originalIdx: w.originalIdx },
      { note: right, originalIdx: w.originalIdx },
      ...working.slice(longestIdx + 1),
    ];
  }

  // Assign syllables. Trailing notes (when notes outnumber syllables) → "".
  const outNotes: ExtractedNote[] = working.map((w, i) => {
    const syl = i < syllables.length ? syllables[i]! : "";
    return { ...w.note, syllable: syl };
  });

  return {
    notes: outNotes,
    originalIndexMap: working.map((w) => w.originalIdx),
  };
}

function pickLongestIndex(working: { note: ExtractedNote }[]): number {
  let bestIdx = -1;
  let bestDur = -Infinity;
  for (let i = 0; i < working.length; i++) {
    const d = working[i]!.note.durationBeats;
    if (d > bestDur) {
      bestDur = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}
