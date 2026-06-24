import { useEffect, useState } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

export type DemoMode = "standard" | "guided";

export interface DemoFrame {
  currentIndex: number;
  noteProgress: number;
  focusNoteIndex?: number;
}

// Timing knobs for the two demo timelines.
const NOTE_MS_STANDARD = 620; // per note in the continuous sweep
const NOTE_MS_GUIDED = 950; // "hold this note" duration
const MATCH_HOLD_MS = 380; // green "matched!" flash before advancing
const GAP_MS = 750; // pause showing the finished pattern before looping
const TICK_MS = 50; // ~20fps — plenty for the fill bar, light on re-renders

function standardFrame(noteCount: number, elapsed: number): DemoFrame {
  const sweep = noteCount * NOTE_MS_STANDARD;
  const cycle = sweep + GAP_MS;
  const t = elapsed % cycle;
  if (t >= sweep) return { currentIndex: noteCount, noteProgress: 0 }; // all notes "done" (dimmed)
  const idx = Math.min(noteCount - 1, Math.floor(t / NOTE_MS_STANDARD));
  const noteProgress = (t - idx * NOTE_MS_STANDARD) / NOTE_MS_STANDARD;
  return { currentIndex: idx, noteProgress };
}

function guidedFrame(noteCount: number, elapsed: number): DemoFrame {
  const per = NOTE_MS_GUIDED + MATCH_HOLD_MS;
  const run = noteCount * per;
  const cycle = run + GAP_MS;
  const t = elapsed % cycle;
  if (t >= run) return { currentIndex: noteCount, noteProgress: 0 };
  const idx = Math.min(noteCount - 1, Math.floor(t / per));
  const within = t - idx * per;
  if (within < NOTE_MS_GUIDED) {
    return { currentIndex: idx, noteProgress: within / NOTE_MS_GUIDED };
  }
  // Held long enough → flash it matched (green) before moving on.
  return { currentIndex: idx, noteProgress: 1, focusNoteIndex: idx };
}

function computeFrame(mode: DemoMode, noteCount: number, elapsed: number): DemoFrame {
  return mode === "standard" ? standardFrame(noteCount, elapsed) : guidedFrame(noteCount, elapsed);
}

// A representative still for reduced-motion: mid-pattern, current note fully sung.
function staticFrame(mode: DemoMode, noteCount: number): DemoFrame {
  const idx = Math.max(0, Math.floor((noteCount - 1) / 2));
  return mode === "guided"
    ? { currentIndex: idx, noteProgress: 1, focusNoteIndex: idx }
    : { currentIndex: idx, noteProgress: 1 };
}

const IDLE: DemoFrame = { currentIndex: -1, noteProgress: 0 };

// Non-interactive driver: steps currentIndex / noteProgress / focusNoteIndex on a
// timer so the real MelodyDisplay animates with no mic or audio. Honors
// prefers-reduced-motion by holding a single static frame.
export function useDemoDriver(mode: DemoMode, noteCount: number, active: boolean): DemoFrame {
  const reduced = useReducedMotion();
  const [frame, setFrame] = useState<DemoFrame>(IDLE);

  useEffect(() => {
    if (!active || noteCount === 0) {
      setFrame(IDLE);
      return;
    }
    if (reduced) {
      setFrame(staticFrame(mode, noteCount));
      return;
    }
    const start = Date.now();
    setFrame(computeFrame(mode, noteCount, 0));
    const id = setInterval(() => {
      setFrame(computeFrame(mode, noteCount, Date.now() - start));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [mode, noteCount, active, reduced]);

  return frame;
}
