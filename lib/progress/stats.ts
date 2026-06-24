import type { SessionRecord, SessionSummary, ExerciseProgress } from "./types";

// ---------------------------------------------------------------------------
// Internal note-to-MIDI helper (chromatic, C4 = 60)
// Accepts names like "C3", "F#4", "Bb2", "Eb5".
// ---------------------------------------------------------------------------

const _NOTE_NAMES: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

function _noteToMidi(name: string): number {
  // Match note-name (1–2 chars) and octave (possibly negative, e.g. "C-1")
  const match = name.match(/^([A-Ga-g][#b]?)(-?\d+)$/);
  if (!match) return -1;
  const pc = _NOTE_NAMES[match[1]];
  if (pc === undefined) return -1;
  const octave = parseInt(match[2], 10);
  return (octave + 1) * 12 + pc; // MIDI convention: C-1 = 0
}

// ---------------------------------------------------------------------------
// Internal: compute mean accuracy across all key-attempts in a session
// ---------------------------------------------------------------------------

function _sessionMeanAccuracy(session: SessionRecord): number {
  if (session.keyAttempts.length === 0) return 0;
  const sum = session.keyAttempts.reduce(
    (acc, k) => acc + k.meanAccuracyPct,
    0
  );
  return sum / session.keyAttempts.length;
}

function _sessionMeanCentsDeviation(session: SessionRecord): number {
  if (session.keyAttempts.length === 0) return 0;
  const sum = session.keyAttempts.reduce(
    (acc, k) => acc + k.meanCentsDeviation,
    0
  );
  return sum / session.keyAttempts.length;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Aggregate summary across a list of sessions, optionally filtered by a
 * start timestamp (sinceMs = ms epoch; sessions before that time are excluded).
 */
export function summarizeSessions(
  sessions: SessionRecord[],
  opts?: { sinceMs?: number }
): SessionSummary {
  const filtered =
    opts?.sinceMs !== undefined
      ? sessions.filter((s) => s.startedAt >= (opts.sinceMs as number))
      : sessions;

  if (filtered.length === 0) {
    return {
      count: 0,
      totalDurationMs: 0,
      meanAccuracyPct: 0,
      meanCentsDeviation: 0,
      exercisesPracticed: [],
    };
  }

  const totalDurationMs = filtered.reduce(
    (acc, s) => acc + (s.totalDurationMs ?? 0),
    0
  );

  // Unscored (follow-along) sessions have no keyAttempts — they count toward
  // session totals but must not drag the accuracy/cents means toward zero.
  const scored = filtered.filter((s) => s.keyAttempts.length > 0);

  const meanAccuracyPct =
    scored.length === 0
      ? 0
      : scored.reduce((acc, s) => acc + _sessionMeanAccuracy(s), 0) /
        scored.length;

  const meanCentsDeviation =
    scored.length === 0
      ? 0
      : scored.reduce((acc, s) => acc + _sessionMeanCentsDeviation(s), 0) /
        scored.length;

  const exercisesPracticed = Array.from(
    new Set(filtered.map((s) => s.exerciseId))
  );

  return {
    count: filtered.length,
    totalDurationMs,
    meanAccuracyPct,
    meanCentsDeviation,
    exercisesPracticed,
  };
}

/**
 * Per-exercise progress with trend and best-key detection.
 *
 * @param accuracyThresholdPct - minimum mean accuracy to count a key as
 *   "achieved" when computing bestKey (default 70).
 * @param trendWindow - number of most-recent sessions included in the trend
 *   (default 30).
 */
export function progressForExercise(
  sessions: SessionRecord[],
  exerciseId: string,
  opts?: { accuracyThresholdPct?: number; trendWindow?: number }
): ExerciseProgress {
  const threshold = opts?.accuracyThresholdPct ?? 70;
  const trendWindow = opts?.trendWindow ?? 30;

  // Skip unscored (follow-along) sessions — they have no accuracy or keys.
  const relevant = sessions
    .filter((s) => s.exerciseId === exerciseId && s.keyAttempts.length > 0)
    .sort((a, b) => a.startedAt - b.startedAt);

  if (relevant.length === 0) {
    return {
      exerciseId,
      sessionsCount: 0,
      bestKey: null,
      recentMeanAccuracy: 0,
      trend: [],
    };
  }

  // Best key: highest tonic (by MIDI) where any key-attempt cleared the
  // accuracy threshold across all sessions.
  let bestKey: string | null = null;
  let bestMidi = -1;

  for (const session of relevant) {
    for (const attempt of session.keyAttempts) {
      if (attempt.meanAccuracyPct >= threshold) {
        const midi = _noteToMidi(attempt.tonic);
        if (midi > bestMidi) {
          bestMidi = midi;
          bestKey = attempt.tonic;
        }
      }
    }
  }

  // Recent mean accuracy: last 5 completed sessions.
  const recent = relevant.slice(-5);
  const recentMeanAccuracy =
    recent.length === 0
      ? 0
      : recent.reduce((acc, s) => acc + _sessionMeanAccuracy(s), 0) /
        recent.length;

  // Trend: last trendWindow sessions, one data point per day (averaged).
  const windowSessions = relevant.slice(-trendWindow);
  const byDay = new Map<string, number[]>();
  for (const s of windowSessions) {
    const date = new Date(s.startedAt).toISOString().slice(0, 10);
    const list = byDay.get(date) ?? [];
    list.push(_sessionMeanAccuracy(s));
    byDay.set(date, list);
  }

  const trend = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, accuracies]) => ({
      date,
      meanAccuracyPct:
        accuracies.reduce((a, b) => a + b, 0) / accuracies.length,
    }));

  return {
    exerciseId,
    sessionsCount: relevant.length,
    bestKey,
    recentMeanAccuracy,
    trend,
  };
}

/**
 * Convenience: last-7-days summary.
 * @param now - optional epoch ms override (for testing)
 */
export function thisWeekSummary(
  sessions: SessionRecord[],
  now?: number
): SessionSummary {
  const base = now ?? Date.now();
  return summarizeSessions(sessions, { sinceMs: base - 7 * 24 * 60 * 60 * 1000 });
}

/**
 * Returns a map of exerciseId → highest tonic achieved with any key-attempt
 * that has meanAccuracyPct >= 70% (default threshold).
 */
export function bestKeyPerExercise(
  sessions: SessionRecord[],
  opts?: { accuracyThresholdPct?: number }
): Record<string, string | null> {
  const threshold = opts?.accuracyThresholdPct ?? 70;
  const result: Record<string, string | null> = {};
  const bestMidi: Record<string, number> = {};

  for (const session of sessions) {
    if (session.keyAttempts.length === 0) continue; // skip unscored (follow-along)
    const exId = session.exerciseId;
    if (!(exId in result)) {
      result[exId] = null;
      bestMidi[exId] = -1;
    }
    for (const attempt of session.keyAttempts) {
      if (attempt.meanAccuracyPct >= threshold) {
        const midi = _noteToMidi(attempt.tonic);
        if (midi > (bestMidi[exId] ?? -1)) {
          bestMidi[exId] = midi;
          result[exId] = attempt.tonic;
        }
      }
    }
  }

  return result;
}

/**
 * Highest single-session mean accuracy ever recorded for an exercise.
 * Returns null if no sessions exist for that exerciseId.
 */
export function bestSessionAccuracy(
  sessions: SessionRecord[],
  exerciseId: string
): number | null {
  const relevant = sessions.filter((s) => s.exerciseId === exerciseId);
  if (relevant.length === 0) return null;
  return Math.max(...relevant.map(_sessionMeanAccuracy));
}

// Local-calendar date string "YYYY-MM-DD" from an epoch ms (in the runner's timezone).
function _localDateStr(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Number of consecutive calendar days (local time) with ≥1 session, ending
 * today or yesterday.  Pass `nowMs` so the function stays pure/testable.
 */
export function currentStreak(sessions: SessionRecord[], nowMs: number): number {
  if (sessions.length === 0) return 0;

  const DAY = 24 * 60 * 60 * 1000;
  const today = _localDateStr(nowMs);
  const yesterday = _localDateStr(nowMs - DAY);

  const activeDays = new Set(sessions.map((s) => _localDateStr(s.startedAt)));

  // Streak must reach at least today or yesterday to be "alive".
  const startMs = activeDays.has(today) ? nowMs : activeDays.has(yesterday) ? nowMs - DAY : null;
  if (startMs === null) return 0;

  // Walk backwards day by day from the anchor, counting consecutive active days.
  let count = 0;
  let cursorMs = startMs;
  while (true) {
    if (!activeDays.has(_localDateStr(cursorMs))) break;
    count += 1;
    cursorMs -= DAY;
  }
  return count;
}

/**
 * Whether `candidate` sets a new personal best for its exerciseId.
 * Compares against all OTHER sessions; returns previousBest=null on first-ever.
 */
export function isPersonalBest(
  sessions: SessionRecord[],
  candidate: SessionRecord,
): { isBest: boolean; previousBest: number | null } {
  // An unscored (follow-along) candidate has no accuracy to compare.
  if (candidate.keyAttempts.length === 0) return { isBest: false, previousBest: null };

  const others = sessions.filter(
    (s) =>
      s.exerciseId === candidate.exerciseId &&
      s.id !== candidate.id &&
      s.keyAttempts.length > 0,
  );
  if (others.length === 0) return { isBest: true, previousBest: null };

  const previousBest = Math.max(...others.map(_sessionMeanAccuracy));
  return {
    isBest: _sessionMeanAccuracy(candidate) > previousBest,
    previousBest,
  };
}

/**
 * Rolling per-day accuracy across all exercises, ordered chronologically.
 * @param windowSize - max number of most-recent days to return (default 30)
 */
export function rollingAccuracy(
  sessions: SessionRecord[],
  windowSize = 30
): { date: string; meanAccuracyPct: number }[] {
  const byDay = new Map<string, number[]>();

  for (const s of sessions) {
    const date = new Date(s.startedAt).toISOString().slice(0, 10);
    const list = byDay.get(date) ?? [];
    list.push(_sessionMeanAccuracy(s));
    byDay.set(date, list);
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-windowSize)
    .map(([date, accuracies]) => ({
      date,
      meanAccuracyPct:
        accuracies.reduce((a, b) => a + b, 0) / accuracies.length,
    }));
}
