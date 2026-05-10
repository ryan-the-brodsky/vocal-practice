import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SessionRecord } from "./types";

// ---------------------------------------------------------------------------
// Storage constants
// ---------------------------------------------------------------------------

const SESSIONS_KEY = "vocal-training:sessions:v1";
const VERSION_KEY = "vocal-training:sessions:version";
const CURRENT_VERSION = 1;

export const MAX_PERSISTED_SESSIONS = 500;

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface SessionStore {
  list(): Promise<SessionRecord[]>;
  get(id: string): Promise<SessionRecord | null>;
  upsert(session: SessionRecord): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

// ---------------------------------------------------------------------------
// trimSessionForStorage — strips live-calculation residue before persisting
// ---------------------------------------------------------------------------

export function trimSessionForStorage(session: SessionRecord): SessionRecord {
  // Deep-clone so the caller's in-memory copy retains all fields.
  const clone: SessionRecord = JSON.parse(JSON.stringify(session));

  // Drop deprecated retry-coaching fields.
  delete clone.parentSessionId;
  delete clone.coachingFocus;

  // Strip per-note residue from every key attempt.
  for (const attempt of clone.keyAttempts) {
    for (const note of attempt.notes) {
      delete note.samplesInWindow;
      delete note.trace;
    }
  }

  return clone;
}

// ---------------------------------------------------------------------------
// getSessionsStorageSizeBytes — byte estimate of persisted sessions JSON
// ---------------------------------------------------------------------------

export async function getSessionsStorageSizeBytes(): Promise<number> {
  // localStorage is UTF-16; multiply char count by 2 for byte estimate.
  return ((await AsyncStorage.getItem(SESSIONS_KEY))?.length ?? 0) * 2;
}

// ---------------------------------------------------------------------------
// Migration — strips legacy residue on first read after upgrade
// ---------------------------------------------------------------------------

function migrateOne(session: SessionRecord): { session: SessionRecord; changed: boolean } {
  const hasResidue =
    session.parentSessionId !== undefined ||
    session.coachingFocus !== undefined ||
    session.keyAttempts.some((a) =>
      a.notes.some((n) => n.samplesInWindow !== undefined || n.trace !== undefined)
    );

  if (!hasResidue) return { session, changed: false };
  return { session: trimSessionForStorage(session), changed: true };
}

function migrate(
  sessions: SessionRecord[],
  onMigrated: () => void
): SessionRecord[] {
  let anyChanged = false;
  const result = sessions.map((s) => {
    const { session, changed } = migrateOne(s);
    if (changed) anyChanged = true;
    return session;
  });
  if (anyChanged) onMigrated();
  return result;
}

// ---------------------------------------------------------------------------
// Quota-safe setItem wrapper
// ---------------------------------------------------------------------------

async function safeSetItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (err) {
    if (
      err instanceof Error &&
      (err.name === "QuotaExceededError" || err.message.includes("exceeded the quota"))
    ) {
      throw new Error(
        "Storage is full. Open Progress and clear old sessions to free space, or delete imported melodies you no longer need."
      );
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// AsyncStorage implementation
// ---------------------------------------------------------------------------

export function createAsyncStorageStore(): SessionStore {
  // Simple promise mutex so concurrent writes don't clobber each other.
  let writeQueue: Promise<void> = Promise.resolve();

  async function readAll(): Promise<SessionRecord[]> {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return migrate(parsed as SessionRecord[], () => {
      // Best-effort write-back — don't block reads on it.
      void writeAll(parsed as SessionRecord[]);
    });
  }

  async function writeAll(sessions: SessionRecord[]): Promise<void> {
    await safeSetItem(SESSIONS_KEY, JSON.stringify(sessions));
  }

  async function ensureVersionKey(): Promise<void> {
    const v = await AsyncStorage.getItem(VERSION_KEY);
    if (!v) {
      await AsyncStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
    }
  }

  function enqueue(fn: () => Promise<void>): Promise<void> {
    writeQueue = writeQueue.then(fn, fn); // chain regardless of prior result
    return writeQueue;
  }

  return {
    async list(): Promise<SessionRecord[]> {
      await ensureVersionKey();
      return readAll();
    },

    async get(id: string): Promise<SessionRecord | null> {
      const sessions = await readAll();
      return sessions.find((s) => s.id === id) ?? null;
    },

    upsert(session: SessionRecord): Promise<void> {
      return enqueue(async () => {
        const sessions = await readAll();
        const trimmed = trimSessionForStorage(session);
        const idx = sessions.findIndex((s) => s.id === trimmed.id);
        if (idx === -1) {
          sessions.push(trimmed);
        } else {
          sessions[idx] = trimmed;
        }

        // Cap: keep top MAX_PERSISTED_SESSIONS completed sessions + all in-progress.
        if (sessions.length > MAX_PERSISTED_SESSIONS) {
          const inProgress = sessions.filter((s) => s.completedAt === null);
          const completed = sessions
            .filter((s) => s.completedAt !== null)
            .sort((a, b) => b.startedAt - a.startedAt)
            .slice(0, MAX_PERSISTED_SESSIONS - inProgress.length);
          const pruneCount = sessions.length - completed.length - inProgress.length;
          console.warn(`[storage] Pruned ${pruneCount} old sessions (cap=${MAX_PERSISTED_SESSIONS})`);
          sessions.length = 0;
          sessions.push(...completed, ...inProgress);
        }

        await writeAll(sessions);
      });
    },

    delete(id: string): Promise<void> {
      return enqueue(async () => {
        const sessions = await readAll();
        await writeAll(sessions.filter((s) => s.id !== id));
      });
    },

    clear(): Promise<void> {
      return enqueue(async () => {
        await AsyncStorage.removeItem(SESSIONS_KEY);
      });
    },
  };
}
