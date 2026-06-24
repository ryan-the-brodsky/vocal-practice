import { CAPABILITIES, capabilityMeta, isCapability, type Capability } from "../capabilities";
import { exerciseLibrary, groupByCapability, getExercise } from "../library";
import { PATHWAYS, getPathway, pathwayProgress } from "../pathways";

describe("capability taxonomy", () => {
  it("has unique ids and strictly ascending display order", () => {
    const ids = CAPABILITIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const orders = CAPABILITIES.map((c) => c.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("every capability has a non-empty label + blurb", () => {
    for (const c of CAPABILITIES) {
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.blurb.length).toBeGreaterThan(0);
    }
  });

  it("capabilityMeta + isCapability round-trip", () => {
    for (const c of CAPABILITIES) {
      expect(isCapability(c.id)).toBe(true);
      expect(capabilityMeta(c.id)?.label).toBe(c.label);
    }
    expect(isCapability("not-a-capability")).toBe(false);
    expect(capabilityMeta(undefined)).toBeNull();
  });
});

describe("library categorization", () => {
  it("every built-in exercise declares a valid capability", () => {
    for (const ex of exerciseLibrary) {
      expect(ex.capability).toBeDefined();
      expect(isCapability(ex.capability as string)).toBe(true);
    }
  });

  it("groupByCapability covers every exercise exactly once, in display order, no empty groups", () => {
    const groups = groupByCapability(exerciseLibrary);
    const flat = groups.flatMap((g) => g.exercises);
    expect(flat.length).toBe(exerciseLibrary.length);
    expect(new Set(flat.map((e) => e.id)).size).toBe(exerciseLibrary.length);
    for (const g of groups) expect(g.exercises.length).toBeGreaterThan(0);
    const order = (cap: Capability | null) =>
      cap === null ? 999 : CAPABILITIES.find((c) => c.id === cap)!.order;
    const orders = groups.map((g) => order(g.capability));
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("collects uncategorized exercises into a trailing 'imports' group", () => {
    const groups = groupByCapability([
      ...exerciseLibrary,
      { ...exerciseLibrary[0], id: "song-x__chunk-1", capability: undefined },
    ]);
    const last = groups[groups.length - 1];
    expect(last.capability).toBeNull();
    expect(last.exercises.some((e) => e.id === "song-x__chunk-1")).toBe(true);
  });
});

describe("pathways", () => {
  it("each pathway has a valid focus and references only real built-in exercises", () => {
    for (const p of PATHWAYS) {
      expect(isCapability(p.focus)).toBe(true);
      expect(p.exerciseIds.length).toBeGreaterThan(0);
      expect(new Set(p.exerciseIds).size).toBe(p.exerciseIds.length); // no dupes
      for (const id of p.exerciseIds) {
        expect(getExercise(id)).toBeDefined();
      }
    }
  });

  it("pathway ids are unique and getPathway resolves them", () => {
    const ids = PATHWAYS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PATHWAYS) expect(getPathway(p.id)?.name).toBe(p.name);
  });

  it("every built-in exercise appears in at least one pathway", () => {
    const inPaths = new Set(PATHWAYS.flatMap((p) => p.exerciseIds));
    for (const ex of exerciseLibrary) expect(inPaths.has(ex.id)).toBe(true);
  });

  it("pathwayProgress counts practiced + doneToday against the path", () => {
    const p = getPathway("build-your-mix")!;
    const prog = pathwayProgress(
      p,
      (id) => id === "goog-octave-arpeggio",
      () => false,
    );
    expect(prog).toEqual({ total: 2, practiced: 1, doneToday: 0 });
  });
});
