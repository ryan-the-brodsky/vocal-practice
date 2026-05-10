import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ExerciseDescriptor } from "./types";

// AsyncStorage-backed runtime store for user-imported exercises.
// Pattern mirrors lib/progress/storage.ts (JSON-array-in-AsyncStorage).

const USER_EXERCISES_KEY = "vocal-training:exercises:user:v1";

// `analysis` is `any` for now: the typed MelodyAnalysis lives in lib/analyze/types.ts
// (Slice 2, concurrent). Type it once that file lands; a type-only import would dangle today.
export interface StoredExtractedExercise {
  descriptor: ExerciseDescriptor;
  source: {
    importedAt: number;
    sourceFilename?: string;
    durationSec: number;
  };
  analysis?: any;
}

// Simple promise mutex so concurrent writes don't clobber each other.
let writeQueue: Promise<void> = Promise.resolve();

async function readAll(): Promise<StoredExtractedExercise[]> {
  const raw = await AsyncStorage.getItem(USER_EXERCISES_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed as StoredExtractedExercise[];
}

async function writeAll(items: StoredExtractedExercise[]): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_EXERCISES_KEY, JSON.stringify(items));
  } catch (err) {
    if (
      err instanceof Error &&
      (err.name === "QuotaExceededError" || err.message.includes("exceeded the quota"))
    ) {
      throw new Error(
        "Storage is full. Open Progress and clear old sessions to free space, or delete this melody and try a smaller one."
      );
    }
    throw err;
  }
}

function enqueue(fn: () => Promise<void>): Promise<void> {
  writeQueue = writeQueue.then(fn, fn);
  return writeQueue;
}

export async function listUserExercises(): Promise<StoredExtractedExercise[]> {
  return readAll();
}

export async function getUserExercise(
  id: string
): Promise<StoredExtractedExercise | undefined> {
  const items = await readAll();
  return items.find((it) => it.descriptor.id === id);
}

export function saveUserExercise(stored: StoredExtractedExercise): Promise<void> {
  return enqueue(async () => {
    const items = await readAll();
    const idx = items.findIndex((it) => it.descriptor.id === stored.descriptor.id);
    if (idx === -1) {
      items.push(stored);
    } else {
      items[idx] = stored;
    }
    await writeAll(items);
  });
}

export function deleteUserExercise(id: string): Promise<void> {
  return enqueue(async () => {
    const items = await readAll();
    await writeAll(items.filter((it) => it.descriptor.id !== id));
  });
}
