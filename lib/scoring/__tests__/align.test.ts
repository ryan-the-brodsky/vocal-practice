import {
  segment,
  filterSegments,
  matchToTargets,
  alignAndScore,
  type Segment,
} from "../align";
import {
  samplesFromMidiSequence,
  inTune,
  flat,
  octaveOff,
} from "@/test/fixtures/pitchSamples";
import type { PitchSample } from "@/lib/pitch/detector";

// ---------------------------------------------------------------------------
// Helpers for hand-crafting silence frames inside otherwise stable streams.
// ---------------------------------------------------------------------------

function silenceFrame(timestamp: number): PitchSample {
  return { hz: null, midi: null, cents: null, clarity: 0, rmsDb: -60, timestamp };
}

function buildSegmentByHand(
  startMs: number,
  endMs: number,
  medianMidi: number,
  frameCount = 30,
): Segment {
  const stepMs = (endMs - startMs) / Math.max(1, frameCount - 1);
  const frames = Array.from({ length: frameCount }, (_, i) => ({
    tMs: i * stepMs,
    hz: 440 * Math.pow(2, (medianMidi - 69) / 12),
    snappedMidi: medianMidi,
    centsVsMedian: 0,
    clarity: 0.92,
  }));
  return { startMs, endMs, medianPitchMidi: medianMidi, frames };
}

// ---------------------------------------------------------------------------
// segment()
// ---------------------------------------------------------------------------

describe("segment()", () => {
  it("returns [] on empty input", () => {
    expect(segment([], 0)).toEqual([]);
  });

  it("returns [] when every sample is silence (hz === null)", () => {
    const samples: PitchSample[] = [];
    for (let t = 0; t < 1000; t += 20) samples.push(silenceFrame(t));
    expect(segment(samples, 0)).toEqual([]);
  });

  it("merges a stable in-tune burst into one segment with the correct median", () => {
    const samples = inTune([60], { perNoteMs: 600, leadInMs: 0 });
    const segs = segment(samples, 0);
    expect(segs.length).toBe(1);
    expect(segs[0]!.medianPitchMidi).toBeCloseTo(60, 1);
    expect(segs[0]!.frames.length).toBeGreaterThan(20);
  });

  it("bridges short silences (gap < silenceGapMs) into a single segment via continuous active frames", () => {
    // Two passed bursts separated by a 100ms gap of silence (default silenceGapMs = 150).
    const burst1 = inTune([60], { perNoteMs: 200 });
    const burst2 = inTune([60], { perNoteMs: 200 }).map((s) => ({
      ...s,
      timestamp: s.timestamp + 300, // shift second burst so gap between bursts ≈ 100ms
    }));
    // Insert a couple silence frames in the gap (timestamps 200..280).
    const gapFrames: PitchSample[] = [];
    for (let t = 200; t < 300; t += 20) gapFrames.push(silenceFrame(t));
    const all = [...burst1, ...gapFrames, ...burst2].sort(
      (a, b) => a.timestamp - b.timestamp,
    );
    const segs = segment(all, 0);
    expect(segs.length).toBe(1);
  });

  it("splits when a silence gap >= silenceGapMs separates two passed bursts", () => {
    const burst1 = inTune([60], { perNoteMs: 200 });
    const burst2 = inTune([60], { perNoteMs: 200 }).map((s) => ({
      ...s,
      timestamp: s.timestamp + 600, // 400ms gap >> 150ms silenceGapMs
    }));
    const gapFrames: PitchSample[] = [];
    for (let t = 200; t < 600; t += 20) gapFrames.push(silenceFrame(t));
    const all = [...burst1, ...gapFrames, ...burst2].sort(
      (a, b) => a.timestamp - b.timestamp,
    );
    const segs = segment(all, 0);
    expect(segs.length).toBe(2);
  });

  it("splits on a legato-slur frame jump > 200¢", () => {
    // Stable 60 burst, then a single frame that jumps 4 semitones (400¢).
    const a = inTune([60], { perNoteMs: 200 });
    const b = inTune([64], { perNoteMs: 200 }).map((s) => ({
      ...s,
      timestamp: s.timestamp + 200,
    }));
    const segs = segment([...a, ...b], 0);
    expect(segs.length).toBe(2);
    expect(segs[0]!.medianPitchMidi).toBeCloseTo(60, 1);
    expect(segs[1]!.medianPitchMidi).toBeCloseTo(64, 1);
  });

  it("splits on coherence violation: deviation from running median > pitchCoherenceCents", () => {
    // Build a stream that drifts ~80¢ from the established median in one frame.
    // Use perNoteCents to apply a +80 cents offset starting partway through, but
    // the simpler way is to concatenate two runs with a 0.8-semitone offset.
    const a = inTune([60], { perNoteMs: 200 });
    // Generate frames at 60.8 (80¢ sharp): use centsOffset=+80 on midi=60.
    const b = samplesFromMidiSequence([60], { perNoteMs: 200, centsOffset: 80 }).map(
      (s) => ({ ...s, timestamp: s.timestamp + 200 }),
    );
    const segs = segment([...a, ...b], 0, { pitchCoherenceCents: 75 });
    // Coherence threshold 75 < 80 → split
    expect(segs.length).toBe(2);
  });

  it("discards samples whose timestamp is < leadInEndMs", () => {
    const samples = inTune([60], { perNoteMs: 800 });
    // leadInEndMs = 400 → drops the first ~half of frames.
    const segs = segment(samples, 400);
    expect(segs.length).toBe(1);
    // First retained frame's tMs is 0 (segment-relative).
    expect(segs[0]!.frames[0]!.tMs).toBe(0);
    // Segment startMs ≥ 400 (the first sample whose timestamp passed the gate).
    expect(segs[0]!.startMs).toBeGreaterThanOrEqual(400);
  });

  it("frames whose clarity fails the gate do not extend the segment", () => {
    // 5 stable frames, then a frame with clarity 0.5 — that frame should not appear.
    const stable = inTune([60], { perNoteMs: 100 }).map((s) => ({ ...s, clarity: 0.95 }));
    const lowClarity: PitchSample = {
      hz: 261.63, midi: 60, cents: 0, clarity: 0.5, rmsDb: -20,
      timestamp: 110,
    };
    const segs = segment([...stable, lowClarity], 0);
    expect(segs.length).toBe(1);
    // No frame in the segment should have clarity 0.5.
    expect(segs[0]!.frames.every((f) => f.clarity > 0.85)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// filterSegments()
// ---------------------------------------------------------------------------

describe("filterSegments()", () => {
  it("drops segments with fewer than segMinFrames frames", () => {
    const segs = [buildSegmentByHand(0, 100, 60, 4)];
    expect(filterSegments(segs)).toEqual([]);
  });

  it("drops segments shorter than segMinDurationMs", () => {
    // 5 frames in only 40ms (< 80ms default) → drop
    const segs = [buildSegmentByHand(0, 40, 60, 5)];
    expect(filterSegments(segs)).toEqual([]);
  });

  it("drops a short pre-attack wobble (false start) at the same pitch as a longer neighbor", () => {
    const wobble = buildSegmentByHand(0, 100, 60, 6);   // 100ms, just past minDur
    const main = buildSegmentByHand(180, 700, 60, 30);  // 520ms, gap = 80ms ≤ 150
    const out = filterSegments([wobble, main]);
    expect(out.length).toBe(1);
    expect(out[0]!.startMs).toBe(180);
  });

  it("keeps a short segment at a different pitch from its longer neighbor", () => {
    const wobble = buildSegmentByHand(0, 100, 62, 6);   // 2 semitones above neighbor
    const main = buildSegmentByHand(180, 700, 60, 30);
    const out = filterSegments([wobble, main]);
    expect(out.length).toBe(2);
  });

  it("keeps a standalone short segment when no longer neighbor is nearby", () => {
    const lone = buildSegmentByHand(0, 150, 60, 10);
    expect(filterSegments([lone])).toEqual([lone]);
  });

  it("keeps a short segment when its longer neighbor is far away (gap > falseStartNeighborGapMs)", () => {
    const wobble = buildSegmentByHand(0, 100, 60, 6);   // 100ms, same pitch
    // Gap from end of wobble (100) to start of main (500) is 400ms > 150 default → kept.
    const main = buildSegmentByHand(500, 1000, 60, 25);
    const out = filterSegments([wobble, main]);
    expect(out.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// matchToTargets()
// ---------------------------------------------------------------------------

describe("matchToTargets()", () => {
  it("zips 1:1 when M === N (exact count match)", () => {
    const segs = [
      buildSegmentByHand(0, 200, 60),
      buildSegmentByHand(200, 400, 64),
      buildSegmentByHand(400, 600, 67),
    ];
    const out = matchToTargets(segs, [60, 64, 67]);
    expect(out.length).toBe(3);
    expect(out[0]).toBe(segs[0]);
    expect(out[1]).toBe(segs[1]);
    expect(out[2]).toBe(segs[2]);
  });

  it("returns N nulls when there are no segments", () => {
    expect(matchToTargets([], [60, 64, 67])).toEqual([null, null, null]);
  });

  it("returns [] when there are no targets", () => {
    expect(matchToTargets([buildSegmentByHand(0, 200, 60)], [])).toEqual([]);
  });

  it("with M > N (extra noise segment), DP skips one segment to align the rest", () => {
    const segs = [
      buildSegmentByHand(0, 200, 60),
      buildSegmentByHand(200, 400, 64),
      buildSegmentByHand(400, 600, 67),
      buildSegmentByHand(600, 800, 72),
    ];
    const out = matchToTargets(segs, [60, 64, 67]);
    expect(out.length).toBe(3);
    expect(out.every((s) => s !== null)).toBe(true);
  });

  it("with M < N (missed target), nulls fall in the right slot when alignment is unambiguous", () => {
    const segs = [
      buildSegmentByHand(0, 200, 60),
      buildSegmentByHand(400, 600, 67),
    ];
    const out = matchToTargets(segs, [60, 64, 67]);
    expect(out[0]).toBe(segs[0]);
    expect(out[1]).toBeNull();
    expect(out[2]).toBe(segs[1]);
  });

  it("pitch-distance cost picks the alignment that minimizes total semitone distance", () => {
    // Segments [62, 67], targets [60, 64, 67]. The cheapest alignment is to skip
    // target[0] and match {62→64, 67→67} (cost 2+0+6=8) rather than match
    // {62→60, 67→64} and skip target[2] (cost 2+3+6=11).
    const segs = [
      buildSegmentByHand(0, 200, 62),
      buildSegmentByHand(200, 400, 67),
    ];
    const out = matchToTargets(segs, [60, 64, 67]);
    expect(out[0]).toBeNull();
    expect(out[1]).toBe(segs[0]);
    expect(out[2]).toBe(segs[1]);
  });

  it("returns all-nulls when matched fraction < MIN_MATCH_FRACTION (0.4)", () => {
    // 1 segment vs 5 targets → at most 1 match, fraction = 0.2 < 0.4 → all-nulls.
    const segs = [buildSegmentByHand(0, 200, 60)];
    const out = matchToTargets(segs, [60, 64, 67, 72, 76]);
    expect(out).toEqual([null, null, null, null, null]);
  });

  it("with M much greater than N, traceback consumes leftover segments via skip-segment steps", () => {
    // 5 segments at midi 60 vs 1 target at 60 → DP must skip 4 segments after
    // the lone match. Exercises the `j === 0 → i--` traceback branch.
    const segs = [
      buildSegmentByHand(0, 200, 60),
      buildSegmentByHand(200, 400, 60),
      buildSegmentByHand(400, 600, 60),
      buildSegmentByHand(600, 800, 60),
      buildSegmentByHand(800, 1000, 60),
    ];
    const out = matchToTargets(segs, [60]);
    expect(out.length).toBe(1);
    expect(out[0]).not.toBeNull();
  });

  it("octave-down (sub-harmonic) segments still match their true target instead of being skipped", () => {
    // Singer sang the 5-note scale right, but pitchy reported the lower notes an
    // octave low (chest-voice sub-harmonic latch) and only 6 of the 9 notes
    // survived segmentation. With M < N the DP must match — the octave-aware
    // cost should pull each errored segment onto its real degree, not drop it
    // ("—") or mis-match it to a coincidentally-closer wrong target.
    const targets = [55, 57, 59, 60, 62, 60, 59, 57, 55]; // tonic G3, 5-note scale
    const segs = [
      buildSegmentByHand(0, 600, 43),     // G2 = G3 − 12  (degree 1)
      buildSegmentByHand(650, 1250, 45),  // A2 = A3 − 12  (degree 2)
      buildSegmentByHand(1300, 1900, 47), // B2 = B3 − 12  (degree 3)
      buildSegmentByHand(1950, 2550, 48), // C3 = C4 − 12  (degree 4)
      buildSegmentByHand(2600, 3200, 45), // A2 = A3 − 12  (descending degree 2)
      buildSegmentByHand(3250, 3850, 43), // G2 = G3 − 12  (final degree 1)
    ];
    const out = matchToTargets(segs, targets);
    // All 6 segments placed (pre-fix the octave-blind cost would skip them all
    // and trip the reliability gate → all-nulls).
    expect(out.filter((s) => s !== null).length).toBe(6);
    // Every matched segment sits on a target an exact octave away.
    out.forEach((seg, i) => {
      if (seg === null) return;
      expect((targets[i]! - seg.medianPitchMidi) % 12).toBe(0);
    });
  });

  it("a genuine wrong note (a tritone off, no octave structure) is not folded into the target", () => {
    // Segment at 66, targets [60, 67]. 66 is 6 semitones above 60 — a wrong
    // note, not a harmonic — so it must match 67 (distance 1), not pretend to
    // be an octave-shifted 60.
    const segs = [buildSegmentByHand(0, 600, 66)];
    const out = matchToTargets(segs, [60, 67]);
    expect(out[0]).toBeNull();
    expect(out[1]).toBe(segs[0]);
  });
});

// ---------------------------------------------------------------------------
// alignAndScore() — end-to-end
// ---------------------------------------------------------------------------

describe("alignAndScore() — end-to-end", () => {
  it("scores a perfectly in-tune 5-note arpeggio at >95% accuracy with negligible cents drift", () => {
    const samples = inTune([60, 64, 67, 72, 76], { perNoteMs: 600 });
    const scores = alignAndScore(samples, [60, 64, 67, 72, 76], 0, []);
    expect(scores.length).toBe(5);
    for (const n of scores) {
      expect(n.framesAboveClarity).toBeGreaterThan(0);
      expect(n.accuracyPct).toBeGreaterThan(95);
      expect(Math.abs(n.meanCentsDeviation)).toBeLessThan(5);
    }
  });

  it("scores a 60¢-flat performance with mean ≈ -60¢ and 0% accuracy on every note", () => {
    const samples = flat([60, 64, 67, 72, 76], 60, { perNoteMs: 600 });
    const scores = alignAndScore(samples, [60, 64, 67, 72, 76], 0, []);
    for (const n of scores) {
      expect(n.framesAboveClarity).toBeGreaterThan(0);
      expect(n.meanCentsDeviation).toBeCloseTo(-60, 0);
      expect(n.accuracyPct).toBeLessThan(5);
    }
  });

  it("an octave-down error on note 2 is snapped against the target and scores in tune", () => {
    const samples = octaveOff([60, 64, 67, 72, 76], 2, { perNoteMs: 600 });
    const scores = alignAndScore(samples, [60, 64, 67, 72, 76], 0, []);
    expect(scores.length).toBe(5);
    // After snapOctave, the octave-down note should land within ±50¢ of target.
    expect(Math.abs(scores[2]!.meanCentsDeviation)).toBeLessThan(50);
    expect(scores[2]!.accuracyPct).toBeGreaterThan(50);
  });

  it("an octave-up error on note 2 is also snapped (singer one octave too high)", () => {
    // Synthesize the melody but substitute target+12 for note 2 (octave-up sing).
    const samples = inTune([60, 64, 67 + 12, 72, 76], { perNoteMs: 600 });
    const scores = alignAndScore(samples, [60, 64, 67, 72, 76], 0, []);
    expect(scores.length).toBe(5);
    expect(Math.abs(scores[2]!.meanCentsDeviation)).toBeLessThan(50);
    expect(scores[2]!.accuracyPct).toBeGreaterThan(50);
  });

  it("a uniformly octave-low performance (sub-harmonic on every note) still scores in tune", () => {
    // Singer sang the right notes; pitchy reported every note an octave low.
    const targets = [60, 62, 64, 65, 67];
    const samples = inTune(targets.map((m) => m - 12), { perNoteMs: 600 });
    const scores = alignAndScore(samples, targets, 0, []);
    expect(scores.length).toBe(5);
    for (const n of scores) {
      expect(n.framesAboveClarity).toBeGreaterThan(0);
      expect(Math.abs(n.meanCentsDeviation)).toBeLessThan(50);
      expect(n.accuracyPct).toBeGreaterThan(90);
    }
  });

  it("returns an empty NoteScore (zeroed, accuracy 0, no trace) for unmatched targets", () => {
    // Only 1 stable note in the input, but 5 targets → reliability gate trips.
    const samples = inTune([60], { perNoteMs: 600 });
    const scores = alignAndScore(samples, [60, 64, 67, 72, 76], 0, []);
    expect(scores.length).toBe(5);
    for (const n of scores) {
      expect(n.framesAboveClarity).toBe(0);
      expect(n.accuracyPct).toBe(0);
      expect(n.trace).toEqual([]);
    }
  });

  it("trace is truncated to MAX_TRACE_FRAMES (200) for very long notes", () => {
    // 5 seconds @ 50fps = 250 frames in a single segment.
    const samples = inTune([60], { perNoteMs: 5000 });
    const scores = alignAndScore(samples, [60], 0, []);
    expect(scores[0]!.trace!.length).toBe(200);
    // But framesAboveClarity reflects the actual segment frame count, not the cap.
    expect(scores[0]!.framesAboveClarity).toBeGreaterThan(200);
  });
});
