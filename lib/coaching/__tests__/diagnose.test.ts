import { diagnoseSession } from "../engine/diagnose";
import { pickRepresentative } from "../engine/representative";
import type { NoteObservation, SessionInput } from "../engine/types";
import { ADVICE_CARDS_BY_ID } from "../library/cards";
import { DETECTOR_MAPPINGS_BY_ID } from "../library/mappings";

function obs(opts: Partial<NoteObservation>): NoteObservation {
  return {
    keyIndex: 0,
    notePosition: 0,
    scaleDegree: 0,
    targetMidi: 60,
    signedCents: 0,
    framesAboveClarity: 10,
    ...opts,
  };
}

describe("diagnoseSession (orchestrator)", () => {
  test("planted high-note-flat session: top diagnosis is high-note-flat with mappable cards", () => {
    const notes: NoteObservation[] = [];
    // Single key, 12 notes ascending. Top tertile (highest 4) is severely flat.
    for (let p = 0; p < 12; p++) {
      notes.push(
        obs({
          keyIndex: 0,
          notePosition: p,
          targetMidi: 60 + p,
          signedCents: p >= 8 ? -40 : 0,
        }),
      );
    }
    const input: SessionInput = { notes, keyCount: 1 };
    const ranked = diagnoseSession(input);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked.some((d) => d.detectorId === "high-note-flat")).toBe(true);
    const top = ranked[0];

    const mapping = DETECTOR_MAPPINGS_BY_ID[top.detectorId];
    expect(mapping).toBeDefined();
    if (mapping.symptomCardId) {
      expect(ADVICE_CARDS_BY_ID[mapping.symptomCardId]).toBeDefined();
    }
    for (const cid of mapping.candidateCauseCardIds) {
      expect(ADVICE_CARDS_BY_ID[cid]).toBeDefined();
    }
  });

  test("clean session yields no diagnoses", () => {
    const notes: NoteObservation[] = [];
    for (let k = 0; k < 3; k++) {
      for (let p = 0; p < 5; p++) {
        notes.push(
          obs({
            keyIndex: k,
            notePosition: p,
            targetMidi: 60 + k + p,
            signedCents: p % 2 === 0 ? 4 : -3,
          }),
        );
      }
    }
    expect(diagnoseSession({ notes, keyCount: 3 })).toEqual([]);
  });

  test("position-consistent wins when one position is consistently off across keys", () => {
    const notes: NoteObservation[] = [];
    for (let k = 0; k < 5; k++) {
      for (let p = 0; p < 5; p++) {
        notes.push(
          obs({
            keyIndex: k,
            notePosition: p,
            targetMidi: 60 + k + p,
            // Only the 4th position is severely flat.
            signedCents: p === 3 ? -50 : 0,
          }),
        );
      }
    }
    const ranked = diagnoseSession({ notes, keyCount: 5 });
    expect(ranked.some((d) => d.detectorId === "position-consistent")).toBe(true);
    const m = DETECTOR_MAPPINGS_BY_ID["position-consistent"];
    expect(m.symptomCardId).toBeNull();
    for (const cid of m.candidateCauseCardIds) {
      expect(ADVICE_CARDS_BY_ID[cid]).toBeDefined();
    }
  });

  test("pickRepresentative selects the most-egregious match for a category diagnosis", () => {
    const notes: NoteObservation[] = [];
    // Four high notes; one is ridiculously flat with high frame count, others mildly off.
    for (let i = 0; i < 9; i++) {
      const isWorst = i === 8;
      notes.push(
        obs({
          keyIndex: 0,
          notePosition: i,
          targetMidi: 60 + i,
          signedCents: i >= 6 ? (isWorst ? -75 : -28) : 0,
          framesAboveClarity: isWorst ? 40 : 10,
        }),
      );
    }
    const ranked = diagnoseSession({ notes, keyCount: 1 });
    const top = ranked.find((d) => d.detectorId === "high-note-flat");
    expect(top).toBeDefined();
    const focus = pickRepresentative(top!, notes);
    expect(focus).not.toBeNull();
    expect(focus!.notePosition).toBe(8);
  });

  test("global-sharp surfaces with mapping to s/sharp", () => {
    const notes: NoteObservation[] = [];
    for (let k = 0; k < 2; k++) {
      for (let p = 0; p < 5; p++) {
        notes.push(obs({ keyIndex: k, notePosition: p, targetMidi: 60 + k + p, signedCents: 35 }));
      }
    }
    const ranked = diagnoseSession({ notes, keyCount: 2 });
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0].detectorId).toBe("global-sharp");
    const m = DETECTOR_MAPPINGS_BY_ID["global-sharp"];
    expect(m.symptomCardId).toBe("s/sharp");
    expect(ADVICE_CARDS_BY_ID["s/sharp"]).toBeDefined();
  });
});
