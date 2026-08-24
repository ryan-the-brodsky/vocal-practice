// visits.ts counts arrivals at the SITE — a Learn-article reader who never
// sings still reads as "returning". These counters track PRODUCT actions
// instead, so a returner here is someone who came back to the tool, not to a
// blog post. Same first-party, cookieless, per-device storage as visits.ts,
// and the same caveat: a shared or wiped browser miscounts.

const PRACTICE_KEY = 'vocal-training:practice-count:v1';
const FINISH_KEY = 'vocal-training:finish-count:v1';

export type PracticeContext = {
  practiceNumber: number;
  hasPracticedBefore: boolean;
};

export type FinishContext = {
  finishNumber: number;
  hasFinishedBefore: boolean;
};

function readCount(key: string): number {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return 0;
    const n = JSON.parse(raw) as unknown;
    return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    // Private mode, disabled storage, or a corrupted value — treat as first time.
    return 0;
  }
}

function writeCount(key: string, value: number): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked — the returned value is still correct for this
    // event, it just won't persist to the next one.
  }
}

/**
 * Increments the practice count once per practice session start and returns the
 * context to stamp on `practice_started`. This is the genuine tool-returner
 * signal — it only moves when someone actually starts singing.
 */
export function recordPracticeStart(): PracticeContext {
  if (typeof window === 'undefined') {
    return { practiceNumber: 1, hasPracticedBefore: false };
  }
  const prior = readCount(PRACTICE_KEY);
  const practiceNumber = prior + 1;
  writeCount(PRACTICE_KEY, practiceNumber);
  return { practiceNumber, hasPracticedBefore: prior >= 1 };
}

/**
 * Reads the current practice context without incrementing, so `pattern_completed`
 * can carry the same practiceNumber the run's `practice_started` already stamped
 * (letting completion be sliced by tool-returner status).
 */
export function readPracticeContext(): PracticeContext {
  if (typeof window === 'undefined') {
    return { practiceNumber: 1, hasPracticedBefore: false };
  }
  const count = readCount(PRACTICE_KEY);
  return { practiceNumber: Math.max(1, count), hasPracticedBefore: count > 1 };
}

/**
 * Increments the finish count and returns the context to stamp on
 * `pattern_completed`. Call ONLY when the exercise finished every planned key
 * (`completedAllKeys === true`) — a one-key-then-Stop run is not a finish.
 */
export function recordFinish(): FinishContext {
  if (typeof window === 'undefined') {
    return { finishNumber: 1, hasFinishedBefore: false };
  }
  const prior = readCount(FINISH_KEY);
  const finishNumber = prior + 1;
  writeCount(FINISH_KEY, finishNumber);
  return { finishNumber, hasFinishedBefore: prior >= 1 };
}
