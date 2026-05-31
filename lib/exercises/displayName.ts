// Resolves an exercise id to a display name across all sources:
//   - built-in (EXERCISE_NAMES map)
//   - user-imported exercise (descriptor.name from userStore)
//   - song chunk (composed from parent song + chunk name)
//
// Components that today render `exerciseName(id)` fall back to the raw id
// string for unknown ids. This async resolver returns the right label for
// chunks too. Prefer this in any UI that may see a chunk id.

import { EXERCISE_NAMES } from "./names";
import { getUserExercise } from "./userStore";
import { getSong } from "../songs/store";
import { parseChunkId } from "../songs/types";

/** Sync best-effort: returns built-in name or the raw id. Use for hot paths. */
export function exerciseNameSync(id: string): string {
  return EXERCISE_NAMES[id] ?? id;
}

/** Async resolver that also looks up user-imported exercises and song chunks. */
export async function resolveExerciseName(id: string): Promise<string> {
  const builtIn = EXERCISE_NAMES[id];
  if (builtIn) return builtIn;
  const parsed = parseChunkId(id);
  if (parsed) {
    const song = await getSong(parsed.songId).catch(() => undefined);
    const chunk = song?.chunks.find((c) => c.id === parsed.chunkId);
    if (song && chunk) return `${song.name} — ${chunk.name}`;
    return id;
  }
  const stored = await getUserExercise(id).catch(() => undefined);
  return stored?.descriptor.name ?? id;
}
