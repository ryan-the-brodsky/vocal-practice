jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// download helpers are browser-only; stub them so Node doesn't blow up.
jest.mock("@/lib/capture/download", () => ({
  downloadBlob: jest.fn(),
  captureTimestamp: () => "2026-06-23T00-00-00-000Z",
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BACKUP_KEYS,
  exportAll,
  importAll,
  lastExportInfo,
} from "../exportImport";

const DAY_MS = 24 * 60 * 60 * 1000;
const EXCLUDED_KEY = "vocal-training:settings:headphones-confirmed-session";

beforeEach(async () => {
  await AsyncStorage.clear();
});

// ---------------------------------------------------------------------------
// Round-trip
// ---------------------------------------------------------------------------

describe("round-trip: exportAll → importAll", () => {
  it("restores every backed-up key and excludes ephemeral key", async () => {
    // Seed all backup keys plus the excluded ephemeral key.
    for (const k of BACKUP_KEYS) {
      await AsyncStorage.setItem(k, `val:${k}`);
    }
    await AsyncStorage.setItem(EXCLUDED_KEY, "should-not-export");

    const envelope = await exportAll(new Date().toISOString());
    expect(envelope.schemaVersion).toBe(1);
    expect(typeof envelope.exportedAt).toBe("string");
    // Excluded key must not appear in the envelope.
    expect(Object.keys(envelope.appData)).not.toContain(EXCLUDED_KEY);

    // Clear storage and restore.
    await AsyncStorage.clear();
    const result = await importAll(JSON.stringify(envelope));
    expect(result.ok).toBe(true);
    if (!result.ok) return; // narrow type

    expect(result.restoredKeys.sort()).toEqual([...BACKUP_KEYS].sort());
    for (const k of BACKUP_KEYS) {
      expect(await AsyncStorage.getItem(k)).toBe(`val:${k}`);
    }
    // Ephemeral key was never in envelope — must still be absent.
    expect(await AsyncStorage.getItem(EXCLUDED_KEY)).toBeNull();
  });

  it("skips null values in appData (key absent in source)", async () => {
    // Only set half the keys; the others will come back as null from getItem.
    const presentKeys = BACKUP_KEYS.slice(0, 3);
    for (const k of presentKeys) {
      await AsyncStorage.setItem(k, "present");
    }

    const envelope = await exportAll(new Date().toISOString());
    await AsyncStorage.clear();

    const result = await importAll(JSON.stringify(envelope));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Only the keys that had values should be restored.
    expect(result.restoredKeys.sort()).toEqual([...presentKeys].sort());
    for (const k of BACKUP_KEYS.slice(3)) {
      expect(await AsyncStorage.getItem(k)).toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// importAll — invalid input
// ---------------------------------------------------------------------------

describe("importAll — malformed input", () => {
  it("returns ok:false for invalid JSON", async () => {
    const result = await importAll("not json {{");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/json/i);
  });

  it("returns ok:false when JSON is an array (not an object)", async () => {
    const result = await importAll(JSON.stringify([1, 2, 3]));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeTruthy();
  });

  it("returns ok:false when schemaVersion is missing", async () => {
    const result = await importAll(JSON.stringify({ appData: {} }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/schemaVersion/i);
  });

  it("returns ok:false when schemaVersion is an unknown number", async () => {
    const result = await importAll(JSON.stringify({ schemaVersion: 99, appData: {} }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/99/);
  });

  it("returns ok:false when appData is missing", async () => {
    const result = await importAll(JSON.stringify({ schemaVersion: 1 }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/appData/i);
  });

  it("returns ok:false when appData is not an object", async () => {
    const result = await importAll(JSON.stringify({ schemaVersion: 1, appData: "nope" }));
    expect(result.ok).toBe(false);
  });

  it("ignores keys in appData that are not in BACKUP_KEYS", async () => {
    const envelope = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      appData: {
        "vocal-training:sessions:v1": "legit-data",
        "some:unknown:key": "should-be-ignored",
        [EXCLUDED_KEY]: "should-also-be-ignored",
      },
    };
    const result = await importAll(JSON.stringify(envelope));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.restoredKeys).toEqual(["vocal-training:sessions:v1"]);
    expect(await AsyncStorage.getItem("some:unknown:key")).toBeNull();
    expect(await AsyncStorage.getItem(EXCLUDED_KEY)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// lastExportInfo
// ---------------------------------------------------------------------------

describe("lastExportInfo", () => {
  it("returns null/null when no export has been recorded", async () => {
    const info = await lastExportInfo(Date.now());
    expect(info.at).toBeNull();
    expect(info.ageDays).toBeNull();
  });

  it("computes ageDays correctly from injected nowMs", async () => {
    const exportedAt = new Date("2026-06-20T12:00:00Z").toISOString();
    await AsyncStorage.setItem("vocal-training:backup:last-export", exportedAt);

    const nowMs = new Date("2026-06-23T12:00:00Z").getTime(); // 3 days later
    const info = await lastExportInfo(nowMs);
    expect(info.at).toBe(exportedAt);
    expect(info.ageDays).toBeCloseTo(3, 5);
  });

  it("returns ageDays:null for a corrupt timestamp", async () => {
    await AsyncStorage.setItem("vocal-training:backup:last-export", "not-a-date");
    const info = await lastExportInfo(Date.now());
    expect(info.at).toBe("not-a-date");
    expect(info.ageDays).toBeNull();
  });
});
