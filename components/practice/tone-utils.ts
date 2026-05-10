import { Colors } from "@/constants/theme";
import { midiToNote, noteToMidi } from "@/lib/exercises/music";
import type { AccompanimentPreset } from "@/lib/exercises/types";
import type { NoteEvent } from "@/lib/exercises/types";
import type { PitchSample } from "@/lib/pitch";
import type { Coaching, Tone } from "./types";

// Presets that double the piano melody — their signal can bleed into the mic.
const DOUBLED_PRESETS = new Set<AccompanimentPreset>(["beginner", "studio", "lip-trill"]);

/**
 * Returns the RMS noise-gate threshold in dBFS for the current context.
 * Raises the bar by 6 dB when the piano doubles the melody (can bleed into mic)
 * or when the user skipped headphone confirmation.
 */
export function rmsGateFor(
  preset: AccompanimentPreset | undefined,
  headphonesConfirmed: boolean,
): number {
  const bias =
    (preset !== undefined && DOUBLED_PRESETS.has(preset) ? 6 : 0) +
    (!headphonesConfirmed ? 6 : 0);
  return -45 + bias;
}

/** Returns the semantic color for a given tone, keyed to light or dark palette. */
export function toneColor(tone: Tone, scheme: "light" | "dark" = "light"): string {
  const c = Colors[scheme];
  switch (tone) {
    case "good":  return c.success;
    case "warn":  return c.warning;
    case "bad":   return c.error;
    default:      return c.textTertiary;
  }
}

/** Returns the muted background for a given tone. */
export function toneBackground(tone: Tone, scheme: "light" | "dark" = "light"): string {
  const c = Colors[scheme];
  switch (tone) {
    case "good":  return scheme === "light" ? "rgba(90,138,90,0.12)"  : "rgba(123,168,123,0.14)";
    case "warn":  return scheme === "light" ? "rgba(176,112,32,0.12)" : "rgba(212,154,72,0.14)";
    case "bad":   return scheme === "light" ? "rgba(160,64,48,0.12)"  : "rgba(194,98,77,0.14)";
    default:      return c.bgSurface;
  }
}

export function formatDelta(cents: number): string {
  const abs = Math.abs(cents);
  if (abs < 100) return `${cents > 0 ? "+" : cents < 0 ? "−" : ""}${Math.round(abs)}¢`;
  const semitones = abs / 100;
  return `${cents > 0 ? "↑" : "↓"}${semitones.toFixed(1)} semi`;
}

export function summarizeKey(meanCents: number, meanAccuracy: number): string {
  const abs = Math.abs(meanCents);
  if (meanAccuracy === 0 && abs < 1) return "—";
  if (abs < 15) return `In tune · ${Math.round(meanAccuracy)}%`;
  if (abs < 50)
    return `Slightly ${meanCents > 0 ? "sharp" : "flat"} (${formatDelta(meanCents)}) · ${Math.round(meanAccuracy)}%`;
  return `${meanCents > 0 ? "Sharp" : "Flat"} ${formatDelta(meanCents)} · ${Math.round(meanAccuracy)}%`;
}

export function coachingFor(
  sample: PitchSample | null,
  target: NoteEvent | null,
  status: "idle" | "loading" | "demo" | "playing" | "stopping",
  rmsGateDb: number = -45,
): Coaching {
  if (status !== "playing" || !target) {
    return {
      text: status === "loading" || status === "demo" ? "Loading…" : "Press Start when ready",
      tone: "idle",
      cents: null,
      pegged: false,
    };
  }
  if (!sample || sample.midi == null || sample.hz == null) {
    return { text: "Listening for your voice…", tone: "idle", cents: null, pegged: false };
  }
  if ((sample.rmsDb ?? -100) < rmsGateDb) {
    return { text: "Listening for your voice…", tone: "idle", cents: null, pegged: false };
  }

  const targetMidi = noteToMidi(target.noteName);
  const dev = (sample.midi - targetMidi) * 100 + (sample.cents ?? 0);
  const abs = Math.abs(dev);

  if (abs < 15) return { text: "On pitch ✓", tone: "good", cents: dev, pegged: false };
  if (abs < 50) {
    return {
      text: `Slightly ${dev > 0 ? "sharp" : "flat"} (${formatDelta(dev)})`,
      tone: "warn",
      cents: dev,
      pegged: false,
    };
  }
  if (abs < 100) {
    return {
      text: `${dev > 0 ? "Sharp" : "Flat"} by ${Math.round(abs)}¢`,
      tone: "bad",
      cents: dev,
      pegged: false,
    };
  }
  const sungNote = midiToNote(Math.round(sample.midi));
  const semitones = Math.round(dev / 100);
  const direction = semitones > 0 ? "down" : "up";
  return {
    text: `Singing ${sungNote} — try ${target.noteName} (${Math.abs(semitones)} st ${direction})`,
    tone: "bad",
    cents: dev,
    pegged: true,
  };
}

export function noteChipTone(scored: boolean, meanCents: number): Tone {
  if (!scored) return "idle";
  const abs = Math.abs(meanCents);
  if (abs < 25) return "good";
  if (abs < 60) return "warn";
  return "bad";
}
