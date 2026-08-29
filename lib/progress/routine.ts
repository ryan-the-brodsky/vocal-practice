import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SessionRecord } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoutineConfig {
  exerciseIds: string[];
}

export interface RoutineStatus {
  done: number;
  total: number;
  items: { id: string; done: boolean }[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROUTINE_KEY = "vocal-training:routine:v1";

export const DEFAULT_ROUTINE: RoutineConfig = {
  exerciseIds: [
    "five-note-scale-mee-may-mah",
    "descending-five-to-one-nay",
    "goog-octave-arpeggio",
    "rossini-lip-trill",
  ],
};

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export async function loadRoutine(): Promise<RoutineConfig> {
  try {
    const raw = await AsyncStorage.getItem(ROUTINE_KEY);
    if (!raw) return DEFAULT_ROUTINE;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "exerciseIds" in parsed &&
      Array.isArray((parsed as RoutineConfig).exerciseIds)
    ) {
      return { exerciseIds: (parsed as RoutineConfig).exerciseIds };
    }
    return DEFAULT_ROUTINE;
  } catch {
    return DEFAULT_ROUTINE;
  }
}

export async function saveRoutine(config: RoutineConfig): Promise<void> {
  await AsyncStorage.setItem(ROUTINE_KEY, JSON.stringify(config));
}

// Read-modify-write edits serialize through this queue so two quick toggles
// (e.g. a lesson page with several exercise blocks) can't clobber each other.
// Prefer these helpers over hand-rolled loadRoutine/saveRoutine for edits.
let writeQueue: Promise<unknown> = Promise.resolve();
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(fn, fn);
  writeQueue = next.catch(() => {});
  return next;
}

/** Appends any ids not already present (order preserved, deduped). */
export function addExerciseIds(
  ids: string[],
): Promise<{ added: string[]; exerciseIds: string[] }> {
  return enqueue(async () => {
    const current = (await loadRoutine()).exerciseIds;
    const seen = new Set(current);
    const added: string[] = [];
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      added.push(id);
    }
    const exerciseIds = [...current, ...added];
    if (added.length > 0) await saveRoutine({ exerciseIds });
    return { added, exerciseIds };
  });
}

/** Removes every occurrence of the given ids. */
export function removeExerciseIds(
  ids: string[],
): Promise<{ removed: string[]; exerciseIds: string[] }> {
  return enqueue(async () => {
    const current = (await loadRoutine()).exerciseIds;
    const drop = new Set(ids);
    const exerciseIds = current.filter((id) => !drop.has(id));
    const removed = ids.filter((id) => current.includes(id));
    if (exerciseIds.length !== current.length) await saveRoutine({ exerciseIds });
    return { removed, exerciseIds };
  });
}

/** Adds the id if absent, removes it if present. */
export function toggleExerciseId(
  id: string,
): Promise<{ added: boolean; exerciseIds: string[] }> {
  return enqueue(async () => {
    const current = (await loadRoutine()).exerciseIds;
    const added = !current.includes(id);
    const exerciseIds = added ? [...current, id] : current.filter((x) => x !== id);
    await saveRoutine({ exerciseIds });
    return { added, exerciseIds };
  });
}

/** Removes any routine exercise IDs matching the predicate. No-op if none match.
 *  Used when deleting a song so its orphaned chunk IDs don't linger in the routine. */
export async function pruneRoutineExerciseIds(
  predicate: (id: string) => boolean,
): Promise<void> {
  const config = await loadRoutine();
  const filtered = config.exerciseIds.filter((id) => !predicate(id));
  if (filtered.length !== config.exerciseIds.length) {
    await saveRoutine({ exerciseIds: filtered });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true if at least one logged session for exerciseId has a local-timezone date of today. */
export function isDoneToday(sessions: SessionRecord[], exerciseId: string): boolean {
  const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local TZ
  return sessions.some((s) => {
    if (s.exerciseId !== exerciseId) return false;
    const dateStr = new Date(s.startedAt).toLocaleDateString("en-CA");
    return dateStr === todayStr;
  });
}

/** Returns completion status for the routine against the given sessions list. */
export function todayStatus(routine: RoutineConfig, sessions: SessionRecord[]): RoutineStatus {
  const items = routine.exerciseIds.map((id) => ({
    id,
    done: isDoneToday(sessions, id),
  }));
  const done = items.filter((i) => i.done).length;
  return { done, total: items.length, items };
}
