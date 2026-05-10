import type { KeyIteration, NoteEvent } from "../exercises/types";
import type { PitchSample } from "../pitch/detector";
import type { AlignConfig } from "../scoring/align";
import { Scorer } from "../scoring/score";
import type { KeyAttemptResult, NoteScore } from "../scoring/types";

export interface KeyStartInfo {
  tonic: string;
  startTime: number; // seconds, relative to audio start
}

export interface SessionTrackerSnapshot {
  currentKeyIndex: number;
  totalKeys: number;
  currentTonic: string | null;
  currentNoteIndex: number;
  currentNoteCount: number;
  currentLiveNotes: NoteScore[];
  completedKeys: KeyAttemptResult[];
  meanAccuracyPct: number;
  meanCentsDeviation: number;
}

export class SessionTracker {
  private readonly scorers: Scorer[] = [];
  private readonly melodyByKey: NoteEvent[][] = [];
  private completed: KeyAttemptResult[] = [];
  private currentIdx = 0;
  private finalized = false;

  constructor(
    private readonly iterations: KeyIteration[],
    private readonly keyStarts: KeyStartInfo[],
    private readonly audioStartMs: number,
    private readonly detectorStartMs: number,
    alignConfig?: AlignConfig,
  ) {
    for (const iter of iterations) {
      const targets = iter.events.filter((e) => e.type === "melody");
      this.melodyByKey.push(targets);
      // leadInEndMs: key-relative ms when the melody begins (cue + lead-in ticks).
      const leadInEndMs = iter.melodyStartSec * 1000;
      const syllables = targets.map((e) => e.syllable ?? "");
      this.scorers.push(new Scorer(targets, leadInEndMs, syllables, alignConfig));
    }
  }

  pushSample(sample: PitchSample): void {
    if (this.finalized) return;

    // Advance key index based on raw audio timeline (no latency shift needed
    // for key-boundary detection — a few ms imprecision here is harmless).
    const sessionRelMs = this.detectorStartMs + sample.timestamp - this.audioStartMs;
    if (sessionRelMs < 0) return;
    const sessionRelSec = sessionRelMs / 1000;

    let newIdx = this.currentIdx;
    for (let i = 0; i < this.keyStarts.length; i++) {
      if (sessionRelSec >= this.keyStarts[i]!.startTime) newIdx = i;
    }

    while (this.currentIdx < newIdx) {
      const result = this.scorers[this.currentIdx]!.finalize(
        this.keyStarts[this.currentIdx]!.tonic,
      );
      this.completed.push(result);
      this.currentIdx++;
    }

    const keyStartSec = this.keyStarts[this.currentIdx]!.startTime;
    const keyRelMs = (sessionRelSec - keyStartSec) * 1000;

    // Append sample with key-relative timestamp; Scorer buffers it.
    this.scorers[this.currentIdx]!.append({
      ...sample,
      timestamp: keyRelMs,
    });
  }

  getSnapshot(currentSessionTimeSec: number): SessionTrackerSnapshot {
    const idx = this.currentIdx;
    const tonic = this.keyStarts[idx]?.tonic ?? null;
    const melody = this.melodyByKey[idx] ?? [];
    const keyStartSec = this.keyStarts[idx]?.startTime ?? 0;
    const keyRelSec = Math.max(0, currentSessionTimeSec - keyStartSec);

    let noteIdx = 0;
    for (let i = 0; i < melody.length; i++) {
      if (keyRelSec >= melody[i]!.startTime) noteIdx = i;
    }

    const live = this.scorers[idx]?.getNoteSnapshots() ?? [];

    const sumAcc = this.completed.reduce((s, k) => s + k.meanAccuracyPct, 0);
    const sumDev = this.completed.reduce((s, k) => s + k.meanCentsDeviation, 0);

    return {
      currentKeyIndex: idx,
      totalKeys: this.iterations.length,
      currentTonic: tonic,
      currentNoteIndex: noteIdx,
      currentNoteCount: melody.length,
      currentLiveNotes: live,
      completedKeys: this.completed,
      meanAccuracyPct:
        this.completed.length > 0 ? sumAcc / this.completed.length : 0,
      meanCentsDeviation:
        this.completed.length > 0 ? sumDev / this.completed.length : 0,
    };
  }

  finalize(): KeyAttemptResult[] {
    if (this.finalized) return this.completed;
    this.finalized = true;
    while (this.currentIdx < this.scorers.length) {
      const result = this.scorers[this.currentIdx]!.finalize(
        this.keyStarts[this.currentIdx]!.tonic,
      );
      // Only keep keys where at least one segment was matched
      if (result.notes.some((n) => n.framesAboveClarity > 0)) {
        this.completed.push(result);
      }
      this.currentIdx++;
    }
    return this.completed;
  }
}
