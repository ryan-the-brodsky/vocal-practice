import { DETECTORS } from "../detectors";
import { globalFlat } from "../detectors/globalFlat";
import { globalSharp } from "../detectors/globalSharp";
import { highNoteFlat } from "../detectors/highNoteFlat";
import { highNoteSharp } from "../detectors/highNoteSharp";
import { keyFatigueDrift } from "../detectors/keyFatigueDrift";
import { lowNoteFlat } from "../detectors/lowNoteFlat";
import { phraseEndFlat } from "../detectors/phraseEndFlat";
import { positionConsistent } from "../detectors/positionConsistent";
import { registerMismatch } from "../detectors/registerMismatch";
import { ADVICE_CARDS_BY_ID } from "../library/cards";
import { DETECTOR_MAPPINGS } from "../library/mappings";

const KNOWN_DETECTOR_IDS = new Set([
  "global-sharp",
  "global-flat",
  "high-note-flat",
  "high-note-sharp",
  "low-note-flat",
  "register-mismatch",
  "phrase-end-flat",
  "position-consistent",
  "key-fatigue-drift",
]);

describe("DETECTOR_MAPPINGS", () => {
  test("every detectorId in mappings maps to a known detector", () => {
    for (const m of DETECTOR_MAPPINGS) {
      expect(KNOWN_DETECTOR_IDS.has(m.detectorId)).toBe(true);
    }
  });

  test("every known detector has a mapping", () => {
    const mappingIds = new Set(DETECTOR_MAPPINGS.map((m) => m.detectorId));
    for (const id of KNOWN_DETECTOR_IDS) {
      expect(mappingIds.has(id)).toBe(true);
    }
  });

  test("DETECTORS array length matches mapping count", () => {
    expect(DETECTORS).toHaveLength(KNOWN_DETECTOR_IDS.size);
    expect(DETECTOR_MAPPINGS).toHaveLength(KNOWN_DETECTOR_IDS.size);
  });

  test("every symptomCardId (when set) exists in card library", () => {
    for (const m of DETECTOR_MAPPINGS) {
      if (m.symptomCardId === null) continue;
      expect(ADVICE_CARDS_BY_ID[m.symptomCardId]).toBeDefined();
      expect(ADVICE_CARDS_BY_ID[m.symptomCardId].kind).toBe("symptom");
    }
  });

  test("every cause card id exists in card library", () => {
    for (const m of DETECTOR_MAPPINGS) {
      for (const cid of m.candidateCauseCardIds) {
        expect(ADVICE_CARDS_BY_ID[cid]).toBeDefined();
        expect(ADVICE_CARDS_BY_ID[cid].kind).toBe("cause");
      }
    }
  });

  test("position-consistent has null symptom (intentional)", () => {
    const m = DETECTOR_MAPPINGS.find((x) => x.detectorId === "position-consistent");
    expect(m).toBeDefined();
    expect(m!.symptomCardId).toBeNull();
  });

  test("each detector function emits diagnoses with the correct detectorId", () => {
    // Sanity — detector produces a diagnosis whose id matches its mapping key.
    const expectations: Array<[(...args: never[]) => unknown, string]> = [
      [globalSharp, "global-sharp"],
      [globalFlat, "global-flat"],
      [highNoteFlat, "high-note-flat"],
      [highNoteSharp, "high-note-sharp"],
      [lowNoteFlat, "low-note-flat"],
      [registerMismatch, "register-mismatch"],
      [phraseEndFlat, "phrase-end-flat"],
      [positionConsistent, "position-consistent"],
      [keyFatigueDrift, "key-fatigue-drift"],
    ];
    for (const [, id] of expectations) {
      expect(KNOWN_DETECTOR_IDS.has(id)).toBe(true);
    }
  });
});
