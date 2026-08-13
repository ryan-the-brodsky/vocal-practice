import { planExercise } from "@/lib/exercises/engine";
import { exerciseLibrary } from "@/lib/exercises/library";
import { noteValueToSeconds } from "@/lib/exercises/music";
import { resolveDetectorTuning } from "@/lib/pitch/tuning";
import {
  DEFAULT_TEMPO_SCALE,
  MAX_BPM,
  MIN_BPM,
  TEMPO_SCALES,
  appliedTempoLabel,
  effectiveBpm,
  fractionForTempoScale,
  nextDistinctTempoScale,
  snapTempoScale,
  stepTempoScale,
  tempoScaleFromFraction,
  tempoScaleLabel,
} from "../tempo";

describe("snapTempoScale", () => {
  it("returns offered values unchanged", () => {
    for (const s of TEMPO_SCALES) expect(snapTempoScale(s)).toBe(s);
  });

  it("snaps to the nearest notch", () => {
    expect(snapTempoScale(0.94)).toBe(0.9);
    expect(snapTempoScale(0.96)).toBe(1);
    expect(snapTempoScale(1.17)).toBe(1.2);
  });

  it("clamps beyond the ends", () => {
    expect(snapTempoScale(0.1)).toBe(0.6);
    expect(snapTempoScale(9)).toBe(1.4);
  });

  it("falls back to normal on garbage", () => {
    expect(snapTempoScale(Number.NaN)).toBe(DEFAULT_TEMPO_SCALE);
    expect(snapTempoScale(Number.POSITIVE_INFINITY)).toBe(DEFAULT_TEMPO_SCALE);
  });
});

describe("stepTempoScale", () => {
  it("moves one notch in each direction", () => {
    expect(stepTempoScale(1, 1)).toBe(1.1);
    expect(stepTempoScale(1, -1)).toBe(0.9);
  });

  it("clamps at the ends instead of wrapping", () => {
    expect(stepTempoScale(1.4, 1)).toBe(1.4);
    expect(stepTempoScale(0.6, -1)).toBe(0.6);
  });

  it("snaps an off-grid value before stepping", () => {
    expect(stepTempoScale(0.97, -1)).toBe(0.9);
  });
});

describe("effectiveBpm", () => {
  it("scales and rounds", () => {
    expect(effectiveBpm(100, 1)).toBe(100);
    expect(effectiveBpm(100, 0.8)).toBe(80);
    expect(effectiveBpm(90, 1.3)).toBe(117);
    expect(effectiveBpm(72, 0.7)).toBe(50);
  });

  it("clamps to the absolute guard rails", () => {
    expect(effectiveBpm(150, 1.4)).toBe(MAX_BPM);
    expect(effectiveBpm(60, 0.6)).toBeGreaterThanOrEqual(MIN_BPM);
    expect(effectiveBpm(50, 0.6)).toBe(MIN_BPM);
  });

  it("passes through a nonsense base tempo untouched", () => {
    expect(effectiveBpm(0, 0.8)).toBe(0);
    expect(Number.isNaN(effectiveBpm(Number.NaN, 0.8))).toBe(true);
  });

  // Derived from the library, not hand-listed — a hardcoded list drifts the
  // moment an exercise is added, and it was already missing the two fastest
  // (140, 144), which are exactly the ones that reach the ceiling.
  it("covers every shipped descriptor tempo without leaving the guard rails", () => {
    const tempos = [...new Set(exerciseLibrary.map((e) => e.tempo))];
    expect(tempos.length).toBeGreaterThan(5);
    for (const tempo of tempos) {
      for (const s of TEMPO_SCALES) {
        const bpm = effectiveBpm(tempo, s);
        expect(bpm).toBeGreaterThanOrEqual(MIN_BPM);
        expect(bpm).toBeLessThanOrEqual(MAX_BPM);
      }
    }
  });

  // The fast 8th-note drills are the reason MAX_BPM exists: below ~0.15 s a
  // note no longer yields a stable segment for align.ts to score.
  it("keeps the fastest drills above the segment-detection floor", () => {
    for (const ex of exerciseLibrary.filter((e) => e.noteValue === "8n")) {
      const topBpm = effectiveBpm(ex.tempo, TEMPO_SCALES[TEMPO_SCALES.length - 1]);
      const secPerNote = (60 / topBpm) * 0.5;
      expect(secPerNote).toBeGreaterThan(0.15);
    }
  });
});

describe("appliedTempoLabel", () => {
  it("reports the multiplier when the guard rails don't bite", () => {
    expect(appliedTempoLabel(100, 1)).toBe("Normal");
    expect(appliedTempoLabel(100, 0.8)).toBe("20% slower");
    expect(appliedTempoLabel(90, 1.3)).toBe("30% faster");
  });

  it("reports the speed actually applied once clamped", () => {
    // 144 * 1.4 = 202 -> clamped to 176, which is only ~22% faster.
    expect(effectiveBpm(144, 1.4)).toBe(MAX_BPM);
    expect(appliedTempoLabel(144, 1.4)).toBe("22% faster");
    // 60 * 0.6 = 36 -> clamped to 40, which is only ~33% slower.
    expect(effectiveBpm(60, 0.6)).toBe(MIN_BPM);
    expect(appliedTempoLabel(60, 0.6)).toBe("33% slower");
  });
});

describe("nextDistinctTempoScale", () => {
  it("moves one notch when the guard rails aren't involved", () => {
    expect(nextDistinctTempoScale(100, 1, 1)).toBe(1.1);
    expect(nextDistinctTempoScale(100, 1, -1)).toBe(0.9);
  });

  it("returns null at the ends of the scale", () => {
    expect(nextDistinctTempoScale(100, 1.4, 1)).toBeNull();
    expect(nextDistinctTempoScale(100, 0.6, -1)).toBeNull();
  });

  // 144 bpm: 1.2 -> 173, but 1.3 (187) and 1.4 (202) both clamp to 176. Stepping
  // down one notch at a time would move the thumb without changing the bpm, and
  // calling that "spent" would leave both buttons dead at the top of the scale.
  it("skips past notches the clamp has collapsed together", () => {
    expect(effectiveBpm(144, 1.3)).toBe(effectiveBpm(144, 1.4));
    expect(nextDistinctTempoScale(144, 1.4, 1)).toBeNull();
    expect(nextDistinctTempoScale(144, 1.4, -1)).toBe(1.2);
  });
});

describe("tempoScaleLabel", () => {
  it("names the direction in words, not just a number", () => {
    expect(tempoScaleLabel(1)).toBe("Normal");
    expect(tempoScaleLabel(0.8)).toBe("20% slower");
    expect(tempoScaleLabel(1.3)).toBe("30% faster");
  });
});

// The screen feeds effectiveBpm() into planExercise as bpmOverride; these lock
// that contract so a refactor can't quietly drop the override again.
describe("engine wiring", () => {
  const exercise = exerciseLibrary.find((e) => e.id === "five-note-scale-mee-may-mah")!;
  const plan = (scale: number) =>
    planExercise({
      exercise,
      voicePart: "tenor",
      bpmOverride: effectiveBpm(exercise.tempo, scale),
    });
  const melodySpan = (iters: ReturnType<typeof plan>) => {
    const events = iters[0].events.filter((e) => e.type === "melody");
    const last = events[events.length - 1];
    return last.startTime + last.duration - events[0].startTime;
  };

  it("stretches the pattern when slowed and compresses it when sped up", () => {
    const normal = melodySpan(plan(1));
    expect(melodySpan(plan(0.7))).toBeCloseTo(normal / 0.7, 1);
    expect(melodySpan(plan(1.3))).toBeCloseTo(normal / 1.3, 1);
  });

  it("leaves the notes themselves alone", () => {
    const midis = (scale: number) =>
      plan(scale)[0].events.filter((e) => e.type === "melody").map((e) => e.midi);
    expect(midis(0.6)).toEqual(midis(1));
    expect(midis(1.4)).toEqual(midis(1));
  });

  it("crosses the detector's fast-note profile when a drill is sped up", () => {
    const goog = exerciseLibrary.find((e) => e.id === "goog-octave-arpeggio")!;
    const at = (scale: number) =>
      resolveDetectorTuning({
        noteSec: noteValueToSeconds(goog.noteValue, effectiveBpm(goog.tempo, scale)),
      });
    expect(at(1).octaveJumpFrames).toBe(3); // sustained profile at 90 bpm
    expect(at(1.4).octaveJumpFrames).toBe(1); // fast profile once notes drop under 0.30 s
  });
});

describe("track position", () => {
  it("maps the ends and the centre", () => {
    expect(fractionForTempoScale(0.6)).toBe(0);
    expect(fractionForTempoScale(1)).toBeCloseTo(0.5);
    expect(fractionForTempoScale(1.4)).toBe(1);
  });

  it("round-trips through a fraction", () => {
    for (const s of TEMPO_SCALES) {
      expect(tempoScaleFromFraction(fractionForTempoScale(s))).toBe(s);
    }
  });

  it("clamps drag positions outside the track", () => {
    expect(tempoScaleFromFraction(-3)).toBe(0.6);
    expect(tempoScaleFromFraction(4)).toBe(1.4);
    expect(tempoScaleFromFraction(Number.NaN)).toBe(DEFAULT_TEMPO_SCALE);
  });
});
