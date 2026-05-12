// Use the AsyncStorage in-memory mock that ships with the package.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  trimSessionForStorage,
  MAX_PERSISTED_SESSIONS,
  createAsyncStorageStore,
} from "../storage";
import type { SessionRecord, NoteScore, KeyAttemptResult } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNote(overrides: Partial<NoteScore> = {}): NoteScore {
  return {
    targetMidi: 60,
    meanCentsDeviation: 5,
    accuracyPct: 85,
    framesAboveClarity: 20,
    samplesInWindow: 100,
    trace: [{ tMs: 0, hz: 261.63, cents: 5, clarity: 0.9 }],
    ...overrides,
  };
}

function makeAttempt(overrides: Partial<KeyAttemptResult> = {}): KeyAttemptResult {
  return {
    tonic: "C3",
    notes: [makeNote()],
    meanAccuracyPct: 85,
    meanCentsDeviation: 5,
    ...overrides,
  };
}

let sessionSeq = 0;
function makeSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  sessionSeq += 1;
  return {
    id: `sess-${sessionSeq}`,
    startedAt: Date.now() + sessionSeq * 1000,
    completedAt: Date.now() + sessionSeq * 1000 + 5000,
    exerciseId: "five-note-scale",
    voicePart: "tenor",
    tempo: 120,
    keyAttempts: [makeAttempt()],
    totalDurationMs: 5000,
    parentSessionId: "parent-123",
    coachingFocus: { keyTonic: "C3", noteIndex: 0, targetMidi: 60 },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// trimSessionForStorage
// ---------------------------------------------------------------------------

describe("trimSessionForStorage", () => {
  test("drops samplesInWindow, trace, parentSessionId, coachingFocus", () => {
    const session = makeSession();
    const trimmed = trimSessionForStorage(session);

    expect(trimmed.parentSessionId).toBeUndefined();
    expect(trimmed.coachingFocus).toBeUndefined();

    for (const attempt of trimmed.keyAttempts) {
      for (const note of attempt.notes) {
        expect(note.samplesInWindow).toBeUndefined();
        expect(note.trace).toBeUndefined();
      }
    }
  });

  test("keeps non-residue fields intact", () => {
    const session = makeSession();
    const trimmed = trimSessionForStorage(session);

    expect(trimmed.id).toBe(session.id);
    expect(trimmed.startedAt).toBe(session.startedAt);
    expect(trimmed.completedAt).toBe(session.completedAt);
    expect(trimmed.exerciseId).toBe(session.exerciseId);
    expect(trimmed.voicePart).toBe(session.voicePart);
    expect(trimmed.tempo).toBe(session.tempo);
    expect(trimmed.totalDurationMs).toBe(session.totalDurationMs);
    expect(trimmed.keyAttempts[0].tonic).toBe("C3");
    expect(trimmed.keyAttempts[0].notes[0].targetMidi).toBe(60);
    expect(trimmed.keyAttempts[0].notes[0].accuracyPct).toBe(85);
    expect(trimmed.keyAttempts[0].notes[0].framesAboveClarity).toBe(20);
  });

  test("is non-mutating — input still has all fields after trim", () => {
    const session = makeSession();
    trimSessionForStorage(session);

    // Input must be untouched.
    expect(session.parentSessionId).toBe("parent-123");
    expect(session.coachingFocus).toBeDefined();
    expect(session.keyAttempts[0].notes[0].samplesInWindow).toBe(100);
    expect(session.keyAttempts[0].notes[0].trace).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Cap behavior
// ---------------------------------------------------------------------------

describe("session cap", () => {
  // Pruning warns by design; this block deliberately overflows the cap, so swallow it.
  let warnSpy: jest.SpyInstance;
  beforeEach(async () => {
    await AsyncStorage.clear();
    sessionSeq = 0;
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => warnSpy.mockRestore());

  test("600 completed sessions → 500 kept, sorted startedAt DESC, oldest dropped", async () => {
    const store = createAsyncStorageStore();
    // Insert 600 sessions with distinct timestamps (oldest first = seq 1..600).
    for (let i = 0; i < 600; i++) {
      const s = makeSession({ completedAt: Date.now() + i * 1000 });
      await store.upsert(s);
    }

    const all = await store.list();
    expect(all).toHaveLength(MAX_PERSISTED_SESSIONS);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Pruned"));

    // Newest 500 should be kept; list() returns in startedAt ASC order from readAll.
    const ids = all.map((s) => s.id);
    // The 500 kept sessions should all have startedAt greater than the oldest kept.
    const kept = all.sort((a, b) => b.startedAt - a.startedAt);
    expect(kept).toHaveLength(500);
    // The session with the highest startedAt should be present.
    expect(ids).toContain(kept[0].id);
  }, 30_000);

  test("in-progress sessions are always kept regardless of age", async () => {
    const store = createAsyncStorageStore();

    // Fill with MAX_PERSISTED_SESSIONS completed sessions.
    for (let i = 0; i < MAX_PERSISTED_SESSIONS; i++) {
      await store.upsert(
        makeSession({ startedAt: 1_000_000 + i * 1000, completedAt: 2_000_000 + i * 1000 })
      );
    }

    // Add one very old in-progress session (startedAt = 1, so oldest possible).
    const inProgress = makeSession({ startedAt: 1, completedAt: null });
    await store.upsert(inProgress);

    const all = await store.list();
    const inProgressFound = all.find((s) => s.id === inProgress.id);
    expect(inProgressFound).toBeDefined();
  }, 30_000);
});

// ---------------------------------------------------------------------------
// Migration: legacy records are cleaned on read
// ---------------------------------------------------------------------------

describe("migrate-on-read", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    sessionSeq = 0;
  });

  test("legacy session with residue is cleaned on list()", async () => {
    // Manually write a record with residue directly into AsyncStorage.
    const legacy = makeSession(); // has samplesInWindow, trace, parentSessionId, coachingFocus
    await AsyncStorage.setItem(
      "vocal-training:sessions:v1",
      JSON.stringify([legacy])
    );

    const store = createAsyncStorageStore();
    const sessions = await store.list();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].parentSessionId).toBeUndefined();
    expect(sessions[0].coachingFocus).toBeUndefined();
    expect(sessions[0].keyAttempts[0].notes[0].samplesInWindow).toBeUndefined();
    expect(sessions[0].keyAttempts[0].notes[0].trace).toBeUndefined();
  });

  test("clean session passes through migration unchanged", async () => {
    const clean = makeSession();
    // Trim before writing so it has no residue.
    const trimmed = trimSessionForStorage(clean);
    await AsyncStorage.setItem(
      "vocal-training:sessions:v1",
      JSON.stringify([trimmed])
    );

    const store = createAsyncStorageStore();
    const sessions = await store.list();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe(trimmed.id);
    expect(sessions[0].keyAttempts[0].notes[0].accuracyPct).toBe(85);
  });
});
