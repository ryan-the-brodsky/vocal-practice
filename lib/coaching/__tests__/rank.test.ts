import { priorityScore } from "../engine/rank";
import type { Diagnosis } from "../engine/types";

function d(opts: Partial<Diagnosis>): Diagnosis {
  return {
    detectorId: "x",
    severity: 0,
    observations: 0,
    stddev: 30,
    evidenceText: "",
    ...opts,
  };
}

describe("priorityScore", () => {
  test("higher severity wins when other terms equal", () => {
    const a = d({ severity: 30, observations: 5, stddev: 10 });
    const b = d({ severity: 50, observations: 5, stddev: 10 });
    expect(priorityScore(b)).toBeGreaterThan(priorityScore(a));
  });

  test("more observations wins when severity and stddev are equal", () => {
    const a = d({ severity: 25, observations: 3, stddev: 15 });
    const b = d({ severity: 25, observations: 12, stddev: 15 });
    expect(priorityScore(b)).toBeGreaterThan(priorityScore(a));
  });

  test("lower stddev (more consistent) wins when other terms equal", () => {
    const a = d({ severity: 25, observations: 6, stddev: 60 });
    const b = d({ severity: 25, observations: 6, stddev: 5 });
    expect(priorityScore(b)).toBeGreaterThan(priorityScore(a));
  });

  test("known triple sorts in expected order", () => {
    const flat = d({ detectorId: "global-flat", severity: -30, observations: 12, stddev: 15 });
    const fatigue = d({ detectorId: "key-fatigue-drift", severity: 8, observations: 24, stddev: 20 });
    const phraseEnd = d({ detectorId: "phrase-end-flat", severity: -25, observations: 4, stddev: 5 });
    const ranked = [flat, fatigue, phraseEnd].sort((a, b) => priorityScore(b) - priorityScore(a));
    expect(ranked[0].detectorId).toBe("global-flat");
  });

  test("severity of zero ranks last", () => {
    const a = d({ severity: 0, observations: 100, stddev: 1 });
    const b = d({ severity: -25, observations: 6, stddev: 30 });
    expect(priorityScore(b)).toBeGreaterThan(priorityScore(a));
  });
});
