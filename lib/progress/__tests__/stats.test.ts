import {
  summarizeSessions,
  progressForExercise,
  thisWeekSummary,
  bestKeyPerExercise,
  bestSessionAccuracy,
  rollingAccuracy,
} from "../stats";
import { seedSessionRecord, inTuneFiveNoteSession } from "@/test/fixtures/sessions";

const DAY_MS = 24 * 60 * 60 * 1000;
const FIXED_NOW = Date.UTC(2026, 4, 10, 12, 0, 0); // 2026-05-10T12:00:00Z (deterministic)

describe("summarizeSessions", () => {
  it("returns a zeroed summary on empty input", () => {
    expect(summarizeSessions([])).toEqual({
      count: 0,
      totalDurationMs: 0,
      meanAccuracyPct: 0,
      meanCentsDeviation: 0,
      exercisesPracticed: [],
    });
  });

  it("aggregates count, durations, and exercise list across sessions", () => {
    const sessions = [
      inTuneFiveNoteSession("five-note-scale-mee-may-mah"),
      inTuneFiveNoteSession("descending-five-to-one-nay"),
      inTuneFiveNoteSession("five-note-scale-mee-may-mah"),
    ];
    const out = summarizeSessions(sessions);
    expect(out.count).toBe(3);
    expect(out.totalDurationMs).toBe(180_000); // 3 × 60s
    expect(out.exercisesPracticed.sort()).toEqual([
      "descending-five-to-one-nay",
      "five-note-scale-mee-may-mah",
    ]);
    expect(out.meanAccuracyPct).toBeCloseTo(96, 1); // helper uses accuracyPct=96 by default
  });

  it("filters by sinceMs cutoff (older sessions excluded)", () => {
    const old = seedSessionRecord({
      exerciseId: "five-note-scale-mee-may-mah",
      startedAt: FIXED_NOW - 14 * DAY_MS,
      attempts: [{ tonic: "C3", notes: [{ targetMidi: 60, accuracyPct: 50 }] }],
    });
    const recent = seedSessionRecord({
      exerciseId: "five-note-scale-mee-may-mah",
      startedAt: FIXED_NOW - 1 * DAY_MS,
      attempts: [{ tonic: "C3", notes: [{ targetMidi: 60, accuracyPct: 90 }] }],
    });
    const out = summarizeSessions([old, recent], { sinceMs: FIXED_NOW - 7 * DAY_MS });
    expect(out.count).toBe(1);
    expect(out.meanAccuracyPct).toBe(90);
  });
});

describe("progressForExercise", () => {
  it("returns an empty result when no sessions match", () => {
    const out = progressForExercise([], "any-id");
    expect(out).toEqual({
      exerciseId: "any-id",
      sessionsCount: 0,
      bestKey: null,
      recentMeanAccuracy: 0,
      trend: [],
    });
  });

  it("bestKey is the highest tonic where any attempt cleared the threshold", () => {
    const session = seedSessionRecord({
      exerciseId: "five-note-scale-mee-may-mah",
      startedAt: FIXED_NOW,
      attempts: [
        { tonic: "C3", notes: [{ targetMidi: 60, accuracyPct: 90 }] }, // pass
        { tonic: "E3", notes: [{ targetMidi: 64, accuracyPct: 80 }] }, // pass
        { tonic: "G3", notes: [{ targetMidi: 67, accuracyPct: 60 }] }, // FAIL
      ],
    });
    expect(progressForExercise([session], "five-note-scale-mee-may-mah").bestKey).toBe("E3");
  });

  it("respects accuracyThresholdPct override", () => {
    const session = seedSessionRecord({
      exerciseId: "ex",
      startedAt: FIXED_NOW,
      attempts: [
        { tonic: "C3", notes: [{ targetMidi: 60, accuracyPct: 65 }] },
        { tonic: "G3", notes: [{ targetMidi: 67, accuracyPct: 65 }] },
      ],
    });
    expect(progressForExercise([session], "ex").bestKey).toBeNull(); // default 70 → none
    expect(
      progressForExercise([session], "ex", { accuracyThresholdPct: 60 }).bestKey,
    ).toBe("G3");
  });

  it("recentMeanAccuracy averages the last 5 sessions", () => {
    const exId = "ex";
    const sessions = [50, 50, 50, 50, 50, 100, 100, 100, 100, 100].map((acc, i) =>
      seedSessionRecord({
        exerciseId: exId,
        startedAt: FIXED_NOW - (10 - i) * DAY_MS,
        attempts: [{ tonic: "C3", notes: [{ targetMidi: 60, accuracyPct: acc }] }],
      }),
    );
    const out = progressForExercise(sessions, exId);
    // Last 5 sessions all 100% → mean 100
    expect(out.recentMeanAccuracy).toBe(100);
  });

  it("trend is grouped by date in chronological order", () => {
    const exId = "ex";
    const day1 = Date.UTC(2026, 4, 1, 8, 0, 0);  // 2026-05-01
    const day2 = Date.UTC(2026, 4, 2, 8, 0, 0);  // 2026-05-02
    const sessions = [
      seedSessionRecord({
        exerciseId: exId,
        startedAt: day2,
        attempts: [{ tonic: "C3", notes: [{ targetMidi: 60, accuracyPct: 80 }] }],
      }),
      seedSessionRecord({
        exerciseId: exId,
        startedAt: day1 + 1000,
        attempts: [{ tonic: "C3", notes: [{ targetMidi: 60, accuracyPct: 60 }] }],
      }),
      seedSessionRecord({
        exerciseId: exId,
        startedAt: day1,
        attempts: [{ tonic: "C3", notes: [{ targetMidi: 60, accuracyPct: 100 }] }],
      }),
    ];
    const out = progressForExercise(sessions, exId);
    expect(out.trend.map((t) => t.date)).toEqual(["2026-05-01", "2026-05-02"]);
    expect(out.trend[0]!.meanAccuracyPct).toBe(80);  // (60+100)/2
    expect(out.trend[1]!.meanAccuracyPct).toBe(80);
  });

  it("ignores sessions for other exercises", () => {
    const sessions = [
      seedSessionRecord({
        exerciseId: "ex-a",
        startedAt: FIXED_NOW,
        attempts: [{ tonic: "C3", notes: [{ targetMidi: 60, accuracyPct: 90 }] }],
      }),
      seedSessionRecord({
        exerciseId: "ex-b",
        startedAt: FIXED_NOW,
        attempts: [{ tonic: "G3", notes: [{ targetMidi: 67, accuracyPct: 90 }] }],
      }),
    ];
    expect(progressForExercise(sessions, "ex-a").bestKey).toBe("C3");
    expect(progressForExercise(sessions, "ex-a").sessionsCount).toBe(1);
  });
});

describe("thisWeekSummary", () => {
  it("filters to the last 7 days using the provided now (deterministic)", () => {
    const inWindow = seedSessionRecord({
      exerciseId: "ex",
      startedAt: FIXED_NOW - 3 * DAY_MS,
      attempts: [{ tonic: "C3", notes: [{ targetMidi: 60, accuracyPct: 80 }] }],
    });
    const outsideWindow = seedSessionRecord({
      exerciseId: "ex",
      startedAt: FIXED_NOW - 14 * DAY_MS,
      attempts: [{ tonic: "C3", notes: [{ targetMidi: 60, accuracyPct: 50 }] }],
    });
    const summary = thisWeekSummary([inWindow, outsideWindow], FIXED_NOW);
    expect(summary.count).toBe(1);
    expect(summary.meanAccuracyPct).toBe(80);
  });
});

describe("bestKeyPerExercise", () => {
  it("returns highest qualifying tonic per exercise", () => {
    const sessions = [
      seedSessionRecord({
        exerciseId: "ex-a",
        startedAt: FIXED_NOW,
        attempts: [
          { tonic: "C3", notes: [{ targetMidi: 60, accuracyPct: 95 }] },
          { tonic: "G3", notes: [{ targetMidi: 67, accuracyPct: 95 }] },
        ],
      }),
      seedSessionRecord({
        exerciseId: "ex-b",
        startedAt: FIXED_NOW,
        attempts: [{ tonic: "F3", notes: [{ targetMidi: 65, accuracyPct: 95 }] }],
      }),
    ];
    expect(bestKeyPerExercise(sessions)).toEqual({
      "ex-a": "G3",
      "ex-b": "F3",
    });
  });

  it("records null for an exercise with no qualifying attempts", () => {
    const sessions = [
      seedSessionRecord({
        exerciseId: "ex-a",
        startedAt: FIXED_NOW,
        attempts: [{ tonic: "C3", notes: [{ targetMidi: 60, accuracyPct: 50 }] }], // below 70
      }),
    ];
    expect(bestKeyPerExercise(sessions)).toEqual({ "ex-a": null });
  });
});

describe("bestSessionAccuracy", () => {
  it("returns null when no sessions exist for the exercise", () => {
    expect(bestSessionAccuracy([], "any")).toBeNull();
    const sessions = [
      seedSessionRecord({
        exerciseId: "other",
        startedAt: FIXED_NOW,
        attempts: [{ tonic: "C3", notes: [{ targetMidi: 60, accuracyPct: 90 }] }],
      }),
    ];
    expect(bestSessionAccuracy(sessions, "missing")).toBeNull();
  });

  it("returns the highest single-session mean accuracy ever recorded", () => {
    const exId = "ex";
    const sessions = [70, 95, 60].map((acc) =>
      seedSessionRecord({
        exerciseId: exId,
        startedAt: FIXED_NOW,
        attempts: [{ tonic: "C3", notes: [{ targetMidi: 60, accuracyPct: acc }] }],
      }),
    );
    expect(bestSessionAccuracy(sessions, exId)).toBe(95);
  });
});

describe("rollingAccuracy", () => {
  it("groups by ISO date and clips to the most recent windowSize days", () => {
    const day = (n: number) => Date.UTC(2026, 4, n, 8, 0, 0);
    const sessions = [
      seedSessionRecord({
        exerciseId: "ex",
        startedAt: day(1),
        attempts: [{ tonic: "C3", notes: [{ targetMidi: 60, accuracyPct: 60 }] }],
      }),
      seedSessionRecord({
        exerciseId: "ex",
        startedAt: day(2),
        attempts: [{ tonic: "C3", notes: [{ targetMidi: 60, accuracyPct: 80 }] }],
      }),
      seedSessionRecord({
        exerciseId: "ex",
        startedAt: day(3),
        attempts: [{ tonic: "C3", notes: [{ targetMidi: 60, accuracyPct: 100 }] }],
      }),
    ];
    const out = rollingAccuracy(sessions, 2);
    expect(out.length).toBe(2);
    expect(out[0]!.date).toBe("2026-05-02");
    expect(out[1]!.date).toBe("2026-05-03");
  });
});
