import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loadVoicePart,
  saveVoicePart,
  VOICE_PART_STORAGE_KEY,
} from "../voicePart";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

describe("voicePart persistence", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("saveVoicePart writes the part under the canonical key", async () => {
    await saveVoicePart("soprano");
    expect(await AsyncStorage.getItem(VOICE_PART_STORAGE_KEY)).toBe("soprano");
  });

  it("loadVoicePart returns the persisted part", async () => {
    await saveVoicePart("alto");
    expect(await loadVoicePart()).toBe("alto");
  });

  it("loadVoicePart returns null when nothing is stored", async () => {
    expect(await loadVoicePart()).toBeNull();
  });

  it("loadVoicePart returns null on an invalid stored value", async () => {
    await AsyncStorage.setItem(VOICE_PART_STORAGE_KEY, "countertenor");
    expect(await loadVoicePart()).toBeNull();
  });

  it("round-trips all four voice parts", async () => {
    for (const part of ["soprano", "alto", "tenor", "baritone"] as const) {
      await saveVoicePart(part);
      expect(await loadVoicePart()).toBe(part);
    }
  });
});
