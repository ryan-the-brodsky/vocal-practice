import type { SessionRecord } from "./types";
import type { SessionStore } from "./storage";

/**
 * In-memory implementation of SessionStore.
 * Identical interface to createAsyncStorageStore() — useful for tests and
 * dev scenarios where AsyncStorage isn't available (e.g. Jest, Storybook).
 */
export function createInMemoryStore(
  initial: SessionRecord[] = []
): SessionStore {
  // Deep-clone initial data so callers can't mutate it externally.
  let store: Map<string, SessionRecord> = new Map(
    initial.map((s) => [s.id, { ...s }])
  );

  return {
    async list(): Promise<SessionRecord[]> {
      return Array.from(store.values()).sort((a, b) => a.startedAt - b.startedAt);
    },

    async get(id: string): Promise<SessionRecord | null> {
      return store.get(id) ?? null;
    },

    async upsert(session: SessionRecord): Promise<void> {
      store.set(session.id, { ...session });
    },

    async delete(id: string): Promise<void> {
      store.delete(id);
    },

    async clear(): Promise<void> {
      store = new Map();
    },
  };
}
