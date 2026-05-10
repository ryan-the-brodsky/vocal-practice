import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SessionRecord } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RoutineFrequency = "daily" | "3x-weekly" | "weekly";

export interface RoutineConfig {
  exerciseIds: string[];
  frequency: RoutineFrequency;
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
  frequency: "daily",
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
      "frequency" in parsed &&
      Array.isArray((parsed as RoutineConfig).exerciseIds)
    ) {
      return parsed as RoutineConfig;
    }
    return DEFAULT_ROUTINE;
  } catch {
    return DEFAULT_ROUTINE;
  }
}

export async function saveRoutine(config: RoutineConfig): Promise<void> {
  await AsyncStorage.setItem(ROUTINE_KEY, JSON.stringify(config));
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
