const NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NAME_TO_PC: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4,
  F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9,
  "A#": 10, Bb: 10, B: 11,
};

export function noteToMidi(name: string): number {
  const match = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(name.trim());
  if (!match) throw new Error(`Invalid note name: ${name}`);
  const [, letter, accidental, octaveStr] = match;
  const pc = NAME_TO_PC[letter.toUpperCase() + accidental];
  if (pc === undefined) throw new Error(`Invalid note name: ${name}`);
  // MIDI: C-1 = 0, C0 = 12, C4 = 60
  return (parseInt(octaveStr, 10) + 1) * 12 + pc;
}

export function midiToNote(midi: number): string {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES_SHARP[pc]}${octave}`;
}

export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function hzToMidi(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

const NOTE_VALUE_RATIOS: Record<string, number> = {
  "1n": 4, "2n": 2, "4n": 1, "8n": 0.5, "16n": 0.25, "32n": 0.125,
  "2t": 4 / 3, "4t": 2 / 3, "8t": 1 / 3, "16t": 1 / 6,
  "2.": 3, "4.": 1.5, "8.": 0.75, "16.": 0.375,
};

export function noteValueToSeconds(noteValue: string, bpm: number): number {
  const ratio = NOTE_VALUE_RATIOS[noteValue];
  if (ratio === undefined) throw new Error(`Unknown note value: ${noteValue}`);
  return (60 / bpm) * ratio;
}

export type ChordQuality = "major" | "minor";

// Returns midi pitches of a closed-position triad above (and including) rootMidi.
export function triadFromRoot(rootMidi: number, quality: ChordQuality = "major"): number[] {
  const third = quality === "major" ? 4 : 3;
  return [rootMidi, rootMidi + third, rootMidi + 7];
}

// Voicing a chord into a target octave window: shift root up/down by 12 until
// it sits inside [lowMidi, lowMidi + 12].
export function voicingInWindow(rootMidi: number, lowMidi: number, quality: ChordQuality = "major"): number[] {
  let r = rootMidi;
  while (r < lowMidi) r += 12;
  while (r >= lowMidi + 12) r -= 12;
  return triadFromRoot(r, quality);
}
