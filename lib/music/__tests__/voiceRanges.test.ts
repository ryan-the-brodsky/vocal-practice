import {
  validateDescriptorRanges,
  clampTonicToVoiceRange,
  VOICE_RANGES,
  type DescriptorLike,
} from "../voiceRanges";
import { exerciseLibrary } from "../../exercises/library";
import { noteToMidi } from "../../exercises/music";

describe("validateDescriptorRanges", () => {
  it("accepts a sensible tenor five-note scale that pushes past passaggio", () => {
    // Top tonic F4: peaks F4+7 = C5 (well above tenor passaggio F4 = MIDI 65).
    const desc: DescriptorLike = {
      id: "test",
      scaleDegrees: [0, 2, 4, 5, 7, 5, 4, 2, 0],
      voicePartRanges: { tenor: { lowest: "G3", highest: "F4", step: 1 } },
    };
    expect(validateDescriptorRanges(desc)).toEqual([]);
  });

  it("rejects a tenor range that's too low to traverse passaggio", () => {
    // Tenor passaggio is F4. Sung range D3-A3 is far below it.
    const desc: DescriptorLike = {
      id: "test-too-low",
      scaleDegrees: [0, 2, 4, 5, 7, 5, 4, 2, 0],
      voicePartRanges: { tenor: { lowest: "C3", highest: "D3", step: 1 } },
    };
    const issues = validateDescriptorRanges(desc);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.kind === "no-passaggio")).toBe(true);
  });

  it("rejects a tenor range that exceeds upper limit", () => {
    const desc: DescriptorLike = {
      id: "test-too-high",
      scaleDegrees: [0, 12],  // octave leap
      voicePartRanges: { tenor: { lowest: "G4", highest: "D5", step: 1 } },
    };
    const issues = validateDescriptorRanges(desc);
    expect(issues.some((i) => i.kind === "above")).toBe(true);
  });

  it("rejects step <= 0", () => {
    const desc: DescriptorLike = {
      id: "test-bad-step",
      scaleDegrees: [0, 7],
      voicePartRanges: { tenor: { lowest: "G3", highest: "D4", step: 0 } },
    };
    const issues = validateDescriptorRanges(desc);
    expect(issues.some((i) => i.kind === "step-invalid")).toBe(true);
  });

  it("rejects inverted range (lowest > highest)", () => {
    const desc: DescriptorLike = {
      id: "test-inverted",
      scaleDegrees: [0, 7],
      voicePartRanges: { tenor: { lowest: "D4", highest: "G3", step: 1 } },
    };
    const issues = validateDescriptorRanges(desc);
    expect(issues.some((i) => i.kind === "range-inverted")).toBe(true);
  });

  it("relaxes passaggio requirement for SOVT exercises", () => {
    // A short SOVT-style warmup that stays in the lowest octave of tenor —
    // sung range C3-G3 never approaches passaggio F4. Strict mode rejects;
    // SOVT mode passes (tolerance widens because chest-only lip-trills are
    // pedagogically valid).
    const desc: DescriptorLike = {
      id: "test-sovt",
      scaleDegrees: [0, 7, 0],
      voicePartRanges: { tenor: { lowest: "C3", highest: "C3", step: 1 } },
    };
    const strict = validateDescriptorRanges(desc, { sovt: false });
    const relaxed = validateDescriptorRanges(desc, { sovt: true });
    expect(strict.some((i) => i.kind === "no-passaggio")).toBe(true);
    expect(relaxed.some((i) => i.kind === "no-passaggio")).toBe(false);
  });
});

describe("Library audit — every shipped exercise has sensible ranges", () => {
  // True SOVT exercises (lip trills, sirens) — driven by ID, not by descriptor
  // tags, so a misapplied "sovt" tag doesn't silently relax the validator and
  // hide a real range bug.
  const SOVT_EXERCISE_IDS = new Set(["rossini-lip-trill", "ng-siren"]);

  it("every voice-part range is anatomically plausible for its voice", () => {
    const allIssues: string[] = [];
    for (const desc of exerciseLibrary) {
      const isSovt = SOVT_EXERCISE_IDS.has(desc.id);
      const issues = validateDescriptorRanges(desc as DescriptorLike, { sovt: isSovt });
      for (const issue of issues) {
        if (isSovt && issue.kind === "below") continue;
        allIssues.push(issue.message);
      }
    }
    if (allIssues.length > 0) {
      // eslint-disable-next-line no-console
      console.error("Range audit failures:\n" + allIssues.join("\n"));
    }
    expect(allIssues).toEqual([]);
  });

  it("no two voice-part ranges within a descriptor are byte-identical", () => {
    const VOICE_PAIRS: ["soprano" | "alto" | "tenor" | "baritone" | "bass" | "mezzo", "soprano" | "alto" | "tenor" | "baritone" | "bass" | "mezzo"][] = [
      ["soprano", "alto"],
      ["soprano", "tenor"],
      ["soprano", "baritone"],
      ["alto", "tenor"],
      ["alto", "baritone"],
      ["tenor", "baritone"],
    ];
    const identicalCases: string[] = [];
    for (const desc of exerciseLibrary) {
      for (const [a, b] of VOICE_PAIRS) {
        const ra = desc.voicePartRanges[a];
        const rb = desc.voicePartRanges[b];
        if (!ra || !rb) continue;
        if (ra.lowest === rb.lowest && ra.highest === rb.highest && ra.step === rb.step) {
          identicalCases.push(`${desc.id}: ${a} and ${b} ranges are byte-identical`);
        }
      }
    }
    expect(identicalCases).toEqual([]);
  });

  it("voice ranges within each descriptor follow soprano > alto > tenor > baritone (by lowest tonic)", () => {
    const HIGH_TO_LOW: ("soprano" | "alto" | "tenor" | "baritone")[] = ["soprano", "alto", "tenor", "baritone"];
    const inversions: string[] = [];
    for (const desc of exerciseLibrary) {
      const definedVoices = HIGH_TO_LOW.filter((v) => desc.voicePartRanges[v]);
      for (let i = 1; i < definedVoices.length; i++) {
        const higher = definedVoices[i - 1];
        const lower = definedVoices[i];
        const hLow = noteToMidi(desc.voicePartRanges[higher]!.lowest);
        const lLow = noteToMidi(desc.voicePartRanges[lower]!.lowest);
        if (hLow <= lLow) {
          inversions.push(
            `${desc.id}: ${higher} lowest (${desc.voicePartRanges[higher]!.lowest}) is not above ${lower} lowest (${desc.voicePartRanges[lower]!.lowest})`,
          );
        }
      }
    }
    expect(inversions).toEqual([]);
  });

  it("every shipped exercise defines all 4 voice parts (soprano, alto, tenor, baritone)", () => {
    const missing: string[] = [];
    const REQUIRED: ("soprano" | "alto" | "tenor" | "baritone")[] = ["soprano", "alto", "tenor", "baritone"];
    for (const desc of exerciseLibrary) {
      for (const vp of REQUIRED) {
        if (!desc.voicePartRanges[vp]) {
          missing.push(`${desc.id}: missing ${vp} range`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("warns when peaks exceed the native Salamander pitch-shift cap of F#5 (MIDI 78)", () => {
    // Native player can pitch-shift only ±6 semitones from the nearest sample,
    // capping playable melody pitches at F#5 (sample C5 + 6). Above this, the
    // native player produces audible artifacts. Web is unaffected.
    const NATIVE_CAP = noteToMidi("F#5");
    const overcap: string[] = [];
    for (const desc of exerciseLibrary) {
      const maxDeg = Math.max(...desc.scaleDegrees);
      for (const [vp, r] of Object.entries(desc.voicePartRanges)) {
        if (!r) continue;
        const peak = noteToMidi(r.highest) + maxDeg;
        if (peak > NATIVE_CAP) {
          overcap.push(`${desc.id} ${vp}: peaks at MIDI ${peak} (above native cap ${NATIVE_CAP} = F#5)`);
        }
      }
    }
    // This test asserts the CURRENT scope of native compatibility — not pass/fail.
    // The list of out-of-cap entries is an explicit follow-up in CLAUDE.md.
    // Use a snapshot to lock the known cases so a regression (silently introducing
    // a new out-of-cap entry) is visible in PR diffs.
    expect(overcap.sort()).toMatchSnapshot();
  });
});

describe("clampTonicToVoiceRange", () => {
  const fiveNoteTenor = { lowest: "G3", highest: "D4" };

  it("returns saved tonic when in range", () => {
    expect(clampTonicToVoiceRange(noteToMidi("A3"), fiveNoteTenor)).toBe(noteToMidi("A3"));
  });

  it("clamps below-range tonic to lowest", () => {
    expect(clampTonicToVoiceRange(noteToMidi("C3"), fiveNoteTenor)).toBe(noteToMidi("G3"));
  });

  it("clamps above-range tonic to lowest", () => {
    expect(clampTonicToVoiceRange(noteToMidi("E4"), fiveNoteTenor)).toBe(noteToMidi("G3"));
  });

  it("returns equal-to-bound tonics unchanged (inclusive)", () => {
    expect(clampTonicToVoiceRange(noteToMidi("G3"), fiveNoteTenor)).toBe(noteToMidi("G3"));
    expect(clampTonicToVoiceRange(noteToMidi("D4"), fiveNoteTenor)).toBe(noteToMidi("D4"));
  });

  it("simulates voice-part switching: stale tenor tonic clamped to baritone range", () => {
    const baritone = { lowest: "C3", highest: "G3" };
    const tenorSavedTonic = noteToMidi("D4"); // a tenor-y choice
    const clamped = clampTonicToVoiceRange(tenorSavedTonic, baritone);
    expect(clamped).toBe(noteToMidi("C3")); // clamped to baritone lowest
  });

  it("simulates voice-part switching: low baritone tonic clamped to tenor lowest", () => {
    const tenor = { lowest: "G3", highest: "D4" };
    const baritoneSavedTonic = noteToMidi("Bb2"); // baritone-y
    const clamped = clampTonicToVoiceRange(baritoneSavedTonic, tenor);
    expect(clamped).toBe(noteToMidi("G3"));
  });
});

describe("VOICE_RANGES", () => {
  it("each voice's passaggio sits within its lowest..highest", () => {
    for (const [vp, r] of Object.entries(VOICE_RANGES)) {
      expect(r.passaggio).toBeGreaterThan(r.lowest);
      expect(r.passaggio).toBeLessThan(r.highest);
    }
  });

  it("voice ranges follow gender-conventional ordering: bass < baritone < tenor < alto < mezzo < soprano (by lowest)", () => {
    const order: (keyof typeof VOICE_RANGES)[] = ["bass", "baritone", "tenor", "alto", "mezzo", "soprano"];
    for (let i = 1; i < order.length; i++) {
      expect(VOICE_RANGES[order[i]].lowest).toBeGreaterThan(VOICE_RANGES[order[i - 1]].lowest);
    }
  });
});
