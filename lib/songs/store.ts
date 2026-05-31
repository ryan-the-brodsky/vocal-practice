import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StoredSong } from "./types";

// AsyncStorage-backed runtime store for user-imported songs.
// Pattern mirrors lib/exercises/userStore.ts.

const SONGS_KEY = "vocal-training:songs:v1";

let writeQueue: Promise<void> = Promise.resolve();

// Display rename only — pre-E1 imports stored default "Chunk N" names. We
// rewrite them to "Segment N" on read so the UI is consistent without forcing
// a storage migration; the new names persist whenever the song is saved.
const LEGACY_CHUNK_NAME_RE = /^Chunk (\d+)$/;
function migrateLegacyChunkNames(songs: StoredSong[]): StoredSong[] {
  return songs.map((s) => {
    let mutated = false;
    const chunks = s.chunks.map((c) => {
      const m = LEGACY_CHUNK_NAME_RE.exec(c.name);
      if (!m) return c;
      mutated = true;
      return { ...c, name: `Segment ${m[1]}` };
    });
    return mutated ? { ...s, chunks } : s;
  });
}

async function readAll(): Promise<StoredSong[]> {
  const raw = await AsyncStorage.getItem(SONGS_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return migrateLegacyChunkNames(parsed as StoredSong[]);
}

async function writeAll(items: StoredSong[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SONGS_KEY, JSON.stringify(items));
  } catch (err) {
    if (
      err instanceof Error &&
      (err.name === "QuotaExceededError" || err.message.includes("exceeded the quota"))
    ) {
      throw new Error(
        "Storage is full. Open Progress and clear old sessions to free space, or delete this song and try a shorter one.",
      );
    }
    throw err;
  }
}

function enqueue(fn: () => Promise<void>): Promise<void> {
  writeQueue = writeQueue.then(fn, fn);
  return writeQueue;
}

export async function listSongs(): Promise<StoredSong[]> {
  return readAll();
}

export async function getSong(id: string): Promise<StoredSong | undefined> {
  const items = await readAll();
  return items.find((it) => it.id === id);
}

export function saveSong(song: StoredSong): Promise<void> {
  return enqueue(async () => {
    const items = await readAll();
    const idx = items.findIndex((it) => it.id === song.id);
    if (idx === -1) {
      items.push(song);
    } else {
      items[idx] = song;
    }
    await writeAll(items);
  });
}

export function deleteSong(id: string): Promise<void> {
  return enqueue(async () => {
    const items = await readAll();
    await writeAll(items.filter((it) => it.id !== id));
  });
}
