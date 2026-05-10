import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SavedCoaching } from "./engine/types";

const SAVED_KEY = "vocal-training:coaching:saved:v1";

export const MAX_SAVED_COACHING = 200;

// Promise mutex so concurrent writes don't clobber each other (mirrors progress/storage.ts).
let writeQueue: Promise<void> = Promise.resolve();

async function readAll(): Promise<SavedCoaching[]> {
  const raw = await AsyncStorage.getItem(SAVED_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedCoaching[];
  } catch {
    return [];
  }
}

async function writeAll(items: SavedCoaching[]): Promise<void> {
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(items));
}

function enqueue(fn: () => Promise<void>): Promise<void> {
  writeQueue = writeQueue.then(fn, fn);
  return writeQueue;
}

export async function listSavedCoaching(): Promise<SavedCoaching[]> {
  const all = await readAll();
  return [...all].sort((a, b) => b.savedAt - a.savedAt);
}

export async function getSavedCoaching(id: string): Promise<SavedCoaching | null> {
  const all = await readAll();
  return all.find((s) => s.id === id) ?? null;
}

export function saveSavedCoaching(record: SavedCoaching): Promise<void> {
  return enqueue(async () => {
    const all = await readAll();
    const idx = all.findIndex((s) => s.id === record.id);
    if (idx === -1) all.push(record);
    else all[idx] = record;

    // Cap: keep the MAX_SAVED_COACHING most-recent entries by savedAt.
    if (all.length > MAX_SAVED_COACHING) {
      const kept = [...all]
        .sort((a, b) => b.savedAt - a.savedAt)
        .slice(0, MAX_SAVED_COACHING);
      const pruneCount = all.length - kept.length;
      console.warn(`[savedStorage] Pruned ${pruneCount} old tips (cap=${MAX_SAVED_COACHING})`);
      await writeAll(kept);
      return;
    }
    await writeAll(all);
  });
}

export function deleteSavedCoaching(id: string): Promise<void> {
  return enqueue(async () => {
    const all = await readAll();
    await writeAll(all.filter((s) => s.id !== id));
  });
}
