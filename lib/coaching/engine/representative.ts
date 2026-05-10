import type { Diagnosis, NoteObservation } from "./types";

// Per plan §10.1 — picks highest-confidence most-egregious instance.
// For category diagnoses (global, high/low, register, phrase-end), we filter by
// the detector's group; for single-note diagnoses (position, fatigue) the
// detector's focusNoteHints already nominate the focus.
export function pickRepresentative(
  diagnosis: Diagnosis,
  observations: NoteObservation[],
): NoteObservation | null {
  const candidates = filterForDetector(diagnosis, observations);
  if (candidates.length === 0) return null;

  let best: NoteObservation = candidates[0];
  let bestScore = scoreOf(best);
  for (let i = 1; i < candidates.length; i++) {
    const s = scoreOf(candidates[i]);
    if (s > bestScore) {
      bestScore = s;
      best = candidates[i];
    }
  }
  return best;
}

function scoreOf(n: NoteObservation): number {
  return Math.abs(n.signedCents) * Math.log(n.framesAboveClarity + 1);
}

function filterForDetector(diagnosis: Diagnosis, observations: NoteObservation[]): NoteObservation[] {
  const hints = diagnosis.focusNoteHints;
  if (hints && hints.length > 0) {
    const hintSet = new Set(hints.map((h) => `${h.keyIndex}:${h.notePosition}`));
    const direct = observations.filter((n) => hintSet.has(`${n.keyIndex}:${n.notePosition}`));
    if (direct.length > 0) return direct;
  }

  switch (diagnosis.detectorId) {
    case "global-sharp":
      return observations.filter((n) => n.signedCents > 0);
    case "global-flat":
      return observations.filter((n) => n.signedCents < 0);
    case "high-note-flat":
    case "high-note-sharp": {
      const top = topTertileMidiThreshold(observations);
      return observations.filter((n) =>
        n.targetMidi >= top &&
        (diagnosis.detectorId === "high-note-flat" ? n.signedCents < 0 : n.signedCents > 0),
      );
    }
    case "low-note-flat": {
      const bot = bottomTertileMidiThreshold(observations);
      return observations.filter((n) => n.targetMidi <= bot && n.signedCents < 0);
    }
    case "register-mismatch": {
      // Pick from whichever group is more egregious.
      const top = topTertileMidiThreshold(observations);
      const bot = bottomTertileMidiThreshold(observations);
      return observations.filter((n) => n.targetMidi >= top || n.targetMidi <= bot);
    }
    default:
      return observations;
  }
}

function topTertileMidiThreshold(obs: NoteObservation[]): number {
  if (obs.length === 0) return Number.POSITIVE_INFINITY;
  const sorted = [...obs].map((n) => n.targetMidi).sort((a, b) => a - b);
  const idx = Math.floor((sorted.length * 2) / 3);
  return sorted[idx];
}

function bottomTertileMidiThreshold(obs: NoteObservation[]): number {
  if (obs.length === 0) return Number.NEGATIVE_INFINITY;
  const sorted = [...obs].map((n) => n.targetMidi).sort((a, b) => a - b);
  const idx = Math.max(0, Math.floor(sorted.length / 3) - 1);
  return sorted[idx];
}
