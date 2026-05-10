// Use the AsyncStorage in-memory mock that ships with the package.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  deleteSavedCoaching,
  getSavedCoaching,
  listSavedCoaching,
  saveSavedCoaching,
  MAX_SAVED_COACHING,
} from "../savedStorage";
import type { AdviceCard, SavedCoaching } from "../engine/types";

function makeRecord(overrides: Partial<SavedCoaching> = {}): SavedCoaching {
  const symptomCard: AdviceCard = {
    id: "s/sharp",
    kind: "symptom",
    category: "intonation",
    title: "Singing sharp",
    soundsLike: "snapshot text",
    fixTip: "snapshot fix",
    tags: ["sharp"],
  };
  return {
    id: "rec-1",
    savedAt: 1_700_000_000_000,
    exerciseId: "five-note-scale",
    exerciseName: "Five-Note Scale",
    sessionId: "sess-1",
    diagnosis: {
      detectorId: "global-sharp",
      severity: 30,
      observations: 8,
      evidenceText: "+22¢ sharp on average across 8 notes",
    },
    symptomCard,
    causeCards: [
      {
        id: "c/over-blowing",
        kind: "cause",
        category: "breath",
        title: "Over-blowing",
        fixTip: "snapshot cause fix",
        tags: ["sharp"],
      },
    ],
    ...overrides,
  };
}

describe("savedStorage CRUD", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test("empty list when nothing saved", async () => {
    expect(await listSavedCoaching()).toEqual([]);
    expect(await getSavedCoaching("anything")).toBeNull();
  });

  test("save then list returns the saved item", async () => {
    const rec = makeRecord();
    await saveSavedCoaching(rec);
    const items = await listSavedCoaching();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(rec.id);
    expect(items[0].diagnosis.evidenceText).toBe(rec.diagnosis.evidenceText);
  });

  test("get returns the same record by id", async () => {
    const rec = makeRecord();
    await saveSavedCoaching(rec);
    const got = await getSavedCoaching(rec.id);
    expect(got).not.toBeNull();
    expect(got!.id).toBe(rec.id);
    expect(got!.symptomCard?.id).toBe("s/sharp");
  });

  test("save with same id replaces existing", async () => {
    const rec = makeRecord();
    await saveSavedCoaching(rec);
    await saveSavedCoaching({ ...rec, savedAt: rec.savedAt + 1000 });
    const items = await listSavedCoaching();
    expect(items).toHaveLength(1);
    expect(items[0].savedAt).toBe(rec.savedAt + 1000);
  });

  test("list is sorted newest-first", async () => {
    await saveSavedCoaching(makeRecord({ id: "a", savedAt: 1000 }));
    await saveSavedCoaching(makeRecord({ id: "b", savedAt: 3000 }));
    await saveSavedCoaching(makeRecord({ id: "c", savedAt: 2000 }));
    const items = await listSavedCoaching();
    expect(items.map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  test("delete removes only the targeted record", async () => {
    await saveSavedCoaching(makeRecord({ id: "a" }));
    await saveSavedCoaching(makeRecord({ id: "b" }));
    await deleteSavedCoaching("a");
    const items = await listSavedCoaching();
    expect(items.map((i) => i.id)).toEqual(["b"]);
  });

  test("snapshot fidelity — saved card content is independent of post-save mutation", async () => {
    const rec = makeRecord();
    // Capture frozen content from the (already-mutated) snapshot in storage.
    await saveSavedCoaching(rec);
    // Mutate the in-memory card the test passed in — must not leak through to storage.
    rec.symptomCard!.fixTip = "MUTATED LATER";
    rec.causeCards[0].fixTip = "ALSO MUTATED";
    const got = await getSavedCoaching(rec.id);
    expect(got!.symptomCard!.fixTip).toBe("snapshot fix");
    expect(got!.causeCards[0].fixTip).toBe("snapshot cause fix");
  });

  test("malformed storage value yields empty list (resilient parse)", async () => {
    await AsyncStorage.setItem("vocal-training:coaching:saved:v1", "not-json");
    expect(await listSavedCoaching()).toEqual([]);
  });

  test("cap: upserting MAX_SAVED_COACHING + 50 keeps the most-recent MAX entries", async () => {
    // Seed by directly writing — far cheaper than 250 sequential upserts.
    const seeded = Array.from({ length: MAX_SAVED_COACHING }, (_, i) =>
      makeRecord({ id: `old-${i}`, savedAt: 1_000_000 + i }),
    );
    await AsyncStorage.setItem(
      "vocal-training:coaching:saved:v1",
      JSON.stringify(seeded),
    );

    // Now upsert 50 more, each strictly newer than the seeded set.
    for (let i = 0; i < 50; i++) {
      await saveSavedCoaching(makeRecord({ id: `new-${i}`, savedAt: 5_000_000 + i }));
    }

    const items = await listSavedCoaching();
    expect(items).toHaveLength(MAX_SAVED_COACHING);
    // All 50 newest must be present.
    for (let i = 0; i < 50; i++) {
      expect(items.some((it) => it.id === `new-${i}`)).toBe(true);
    }
    // The oldest seeded entries must have been pruned.
    expect(items.some((it) => it.id === "old-0")).toBe(false);
  }, 30_000);
});
