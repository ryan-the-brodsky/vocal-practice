import type { MelodyAnalysis } from "../../analyze/types";
import type { KeyIteration } from "../../exercises/types";
import { noteToMidi } from "../../exercises/music";
import type { KeyAttemptResult } from "../../scoring/types";
import type { NoteObservation, SessionInput } from "./types";

const MIN_FRAMES = 1;

// Build a SessionInput from live/historical session data.
export function fromKeyAttempts(
  keyAttempts: KeyAttemptResult[],
  iterations: KeyIteration[],
): SessionInput {
  const notes: NoteObservation[] = [];
  for (let k = 0; k < keyAttempts.length; k++) {
    const attempt = keyAttempts[k];
    const tonicMidi = safeNoteToMidi(attempt.tonic);
    const iter = iterations[k];
    for (let i = 0; i < attempt.notes.length; i++) {
      const note = attempt.notes[i];
      if (!note) continue;
      if (note.framesAboveClarity < MIN_FRAMES) continue;
      notes.push({
        keyIndex: k,
        notePosition: i,
        scaleDegree: tonicMidi !== null ? note.targetMidi - tonicMidi : 0,
        targetMidi: note.targetMidi,
        signedCents: note.meanCentsDeviation,
        framesAboveClarity: note.framesAboveClarity,
        trace: note.trace,
        syllable: pickSyllable(iter, i),
      });
    }
  }
  return { notes, keyCount: keyAttempts.length };
}

// Build a SessionInput from a MelodyAnalysis blob (imports). Slice C5 wires this.
export function fromMelodyAnalysis(analysis: MelodyAnalysis): SessionInput {
  const notes: NoteObservation[] = [];
  for (let i = 0; i < analysis.notes.length; i++) {
    const n = analysis.notes[i];
    notes.push({
      keyIndex: 0,
      notePosition: i,
      scaleDegree: n.scaleDegree,
      targetMidi: n.snappedMidi,
      signedCents: n.centsOff,
      framesAboveClarity: Math.max(1, n.framesUsed),
      syllable: n.syllable,
    });
  }
  return { notes, keyCount: 1 };
}

function safeNoteToMidi(name: string): number | null {
  try {
    return noteToMidi(name);
  } catch {
    return null;
  }
}

function pickSyllable(iter: KeyIteration | undefined, position: number): string | undefined {
  if (!iter) return undefined;
  const melody = iter.events.filter((e) => e.type === "melody");
  return melody[position]?.syllable;
}
