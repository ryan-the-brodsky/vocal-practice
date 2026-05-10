import type { NoteEvent } from "../exercises/types";
import { midiToNote } from "../exercises/music";

export type PlaybackVariant =
  | "target-note"
  | "your-note"
  | "phrase-target"
  | "phrase-your-version";

export interface FocusNote {
  positionInIteration: number;
  targetMidi: number;
  medianHz: number;
  syllable: string;
}

function hzToNearestMidi(hz: number): number {
  return Math.round(69 + 12 * Math.log2(hz / 440));
}

function cloneEvent(event: NoteEvent): NoteEvent {
  return { ...event };
}

function cloneEvents(events: NoteEvent[]): NoteEvent[] {
  return events.map(cloneEvent);
}

export function buildContrastPlayback(
  focus: FocusNote,
  iterationEvents: NoteEvent[],
  variant: PlaybackVariant,
): NoteEvent[] {
  switch (variant) {
    case "target-note": {
      return [
        {
          type: "melody",
          midi: focus.targetMidi,
          noteName: midiToNote(focus.targetMidi),
          syllable: focus.syllable,
          startTime: 0,
          duration: 1.0,
          velocity: 0.85,
          isTarget: true,
        },
      ];
    }
    case "your-note": {
      const midi = hzToNearestMidi(focus.medianHz);
      return [
        {
          type: "melody",
          midi,
          noteName: midiToNote(midi),
          syllable: focus.syllable,
          startTime: 0,
          duration: 1.0,
          velocity: 0.85,
          isTarget: false,
          hzOverride: focus.medianHz,
        },
      ];
    }
    case "phrase-target": {
      return cloneEvents(iterationEvents);
    }
    case "phrase-your-version": {
      const cloned = cloneEvents(iterationEvents);
      let melodySeen = 0;
      for (const ev of cloned) {
        if (ev.type !== "melody") continue;
        if (melodySeen === focus.positionInIteration) {
          ev.hzOverride = focus.medianHz;
          break;
        }
        melodySeen += 1;
      }
      return cloned;
    }
  }
}
