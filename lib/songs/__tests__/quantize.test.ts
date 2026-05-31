import { quantizeMelody } from "../quantize";
import type { TimeSignature } from "../../analyze/types";

const TS_4_4: TimeSignature = { num: 4, den: 4 };
const TS_3_4: TimeSignature = { num: 3, den: 4 };

describe("quantizeMelody — basics", () => {
  test("empty input returns one empty measure", () => {
    const q = quantizeMelody([], TS_4_4);
    expect(q.measures).toHaveLength(1);
    expect(q.measures[0]!.items).toHaveLength(0);
    expect(q.beatsPerMeasure).toBe(4);
  });

  test("four quarter notes fill exactly one 4/4 measure", () => {
    const notes = Array.from({ length: 4 }, () => ({
      midi: 67,
      durationBeats: 1,
      restAfterBeats: 0,
    }));
    const q = quantizeMelody(notes, TS_4_4);
    expect(q.measures).toHaveLength(1);
    expect(q.measures[0]!.items).toHaveLength(4);
    for (const it of q.measures[0]!.items) {
      expect(it.kind).toBe("note");
      expect(it.duration).toBe("q");
    }
  });

  test("a half note becomes a single 'h' item", () => {
    const notes = [{ midi: 67, durationBeats: 2, restAfterBeats: 2 }];
    const q = quantizeMelody(notes, TS_4_4);
    expect(q.measures).toHaveLength(1);
    const items = q.measures[0]!.items;
    expect(items[0]).toMatchObject({ kind: "note", duration: "h", tiedFromPrev: false, tiedToNext: false });
    // The trailing two beats of silence should produce a half rest.
    expect(items.some((it) => it.kind === "rest" && it.duration === "hr")).toBe(true);
  });

  test("a dotted-quarter becomes 'qd'", () => {
    const notes = [{ midi: 67, durationBeats: 1.5, restAfterBeats: 0.5 }];
    const q = quantizeMelody(notes, TS_4_4);
    expect(q.measures[0]!.items[0]).toMatchObject({ kind: "note", duration: "qd" });
  });

  test("a note crossing a barline emits two tied notes", () => {
    // 4/4. A 6-beat held note starting at beat 0 spans the whole first measure
    // plus the first 2 beats of the second.
    const notes = [{ midi: 67, durationBeats: 6, restAfterBeats: 0 }];
    const q = quantizeMelody(notes, TS_4_4);
    expect(q.measures.length).toBeGreaterThanOrEqual(2);
    // Whole-measure piece in measure 0: should be tied forward.
    const m0Last = q.measures[0]!.items[q.measures[0]!.items.length - 1]!;
    expect(m0Last.kind).toBe("note");
    if (m0Last.kind === "note") expect(m0Last.tiedToNext).toBe(true);
    // Continuation in measure 1: first item ties from prev.
    const m1First = q.measures[1]!.items[0]!;
    expect(m1First.kind).toBe("note");
    if (m1First.kind === "note") expect(m1First.tiedFromPrev).toBe(true);
  });

  test("3/4 produces 3-beat measures", () => {
    const notes = Array.from({ length: 6 }, () => ({
      midi: 67,
      durationBeats: 1,
      restAfterBeats: 0,
    }));
    const q = quantizeMelody(notes, TS_3_4);
    expect(q.beatsPerMeasure).toBe(3);
    expect(q.measures).toHaveLength(2);
    expect(q.measures[0]!.items).toHaveLength(3);
    expect(q.measures[1]!.items).toHaveLength(3);
  });
});
