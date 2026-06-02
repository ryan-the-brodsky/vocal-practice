// Native fallback for VexFlowMelodyDisplay. VexFlow needs the DOM so we keep
// the existing MelodyDisplay path on native until a native engraver lands.

import MelodyDisplay, { type MelodyDisplayProps, type MelodyNote } from "./MelodyDisplay";
import type { TimeSignature } from "@/lib/songs/types";

export interface VexFlowMelodyDisplayProps {
  notes: { midi: number; durationBeats: number; restAfterBeats: number; syllable?: string }[];
  tonicMidi: number;
  timeSignature: TimeSignature;
  /** Index in `notes` of the currently-singing note; -1 when idle. */
  activeNoteIdx: number;
  targetRowWidth?: number;
  // Pass-throughs so the native fallback can hand off cleanly to MelodyDisplay.
  noteProgress?: MelodyDisplayProps["noteProgress"];
  focusNoteIndex?: MelodyDisplayProps["focusNoteIndex"];
  size?: MelodyDisplayProps["size"];
}

export default function VexFlowMelodyDisplay(p: VexFlowMelodyDisplayProps) {
  const melodyNotes: MelodyNote[] = p.notes.map((n) => ({
    midi: n.midi,
    syllable: n.syllable ?? "",
  }));
  return (
    <MelodyDisplay
      notes={melodyNotes}
      currentIndex={p.activeNoteIdx}
      noteProgress={p.noteProgress ?? 0}
      tonicMidi={p.tonicMidi}
      focusNoteIndex={p.focusNoteIndex}
      size={p.size}
    />
  );
}
